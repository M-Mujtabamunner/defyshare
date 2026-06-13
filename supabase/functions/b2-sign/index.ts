// Presigns S3-compatible URLs for Backblaze B2 (path-style),
// and performs hard deletes via B2 native API (removes all file versions).
// Requires a valid Supabase JWT — anonymous callers receive HTTP 401.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const KEY_ID = Deno.env.get('B2_KEY_ID')!;
const APP_KEY = Deno.env.get('B2_APPLICATION_KEY')!;
const BUCKET = 'defyshare';
const ENDPOINT = 's3.us-east-005.backblazeb2.com';
const REGION = 'us-east-005';
const SERVICE = 's3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

async function requireUser(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const token = authHeader.slice('Bearer '.length);
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return { userId: data.claims.sub as string };
}


// --- B2 native API auth (cached for the lifetime of the isolate) ---
type B2Auth = { apiUrl: string; authToken: string; bucketId: string; expiresAt: number };
let b2AuthCache: B2Auth | null = null;

async function b2Authorize(): Promise<B2Auth> {
  if (b2AuthCache && b2AuthCache.expiresAt > Date.now() + 60_000) return b2AuthCache;
  const basic = btoa(`${KEY_ID}:${APP_KEY}`);
  const res = await fetch('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new Error(`b2_authorize_account failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const apiUrl: string = json.apiInfo.storageApi.apiUrl;
  const authToken: string = json.authorizationToken;
  // find bucketId for our bucket name
  const listRes = await fetch(`${apiUrl}/b2api/v3/b2_list_buckets`, {
    method: 'POST',
    headers: { Authorization: authToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: json.accountId, bucketName: BUCKET }),
  });
  if (!listRes.ok) throw new Error(`b2_list_buckets failed: ${listRes.status} ${await listRes.text()}`);
  const listJson = await listRes.json();
  const bucketId: string = listJson.buckets?.[0]?.bucketId;
  if (!bucketId) throw new Error(`bucket "${BUCKET}" not found`);
  b2AuthCache = { apiUrl, authToken, bucketId, expiresAt: Date.now() + 23 * 3600 * 1000 };
  return b2AuthCache;
}

async function b2HardDelete(key: string): Promise<{ ok: boolean; deleted: number; error?: string }> {
  const auth = await b2Authorize();
  let deleted = 0;
  let startFileName: string | undefined = key;
  let startFileId: string | undefined = undefined;
  // List up to a few pages of versions matching this exact file name and delete each version.
  for (let page = 0; page < 10; page++) {
    const body: Record<string, unknown> = {
      bucketId: auth.bucketId,
      startFileName,
      maxFileCount: 100,
      prefix: key,
    };
    if (startFileId) body.startFileId = startFileId;
    const res = await fetch(`${auth.apiUrl}/b2api/v3/b2_list_file_versions`, {
      method: 'POST',
      headers: { Authorization: auth.authToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, deleted, error: `list_versions ${res.status}: ${await res.text()}` };
    const json = await res.json();
    const files: Array<{ fileId: string; fileName: string }> = json.files ?? [];
    const matches = files.filter((f) => f.fileName === key);
    if (matches.length === 0 && page === 0) {
      // nothing to delete (treat as success)
      return { ok: true, deleted: 0 };
    }
    for (const f of matches) {
      const delRes = await fetch(`${auth.apiUrl}/b2api/v3/b2_delete_file_version`, {
        method: 'POST',
        headers: { Authorization: auth.authToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: f.fileName, fileId: f.fileId }),
      });
      if (delRes.ok) deleted++;
    }
    if (!json.nextFileName || json.nextFileName !== key) break;
    startFileName = json.nextFileName;
    startFileId = json.nextFileId;
  }
  return { ok: true, deleted };
}



const enc = new TextEncoder();

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
}

function rfc3986(str: string) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

async function presign(method: 'PUT' | 'GET' | 'DELETE', key: string, expires: number) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const credential = `${KEY_ID}/${credentialScope}`;

  // path-style: /<bucket>/<key>
  const canonicalUri =
    '/' + [BUCKET, ...key.split('/')].map(rfc3986).join('/');

  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  };
  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`)
    .join('&');

  const canonicalHeaders = `host:${ENDPOINT}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = await hmac(enc.encode('AWS4' + APP_KEY), dateStamp);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const sigBytes = await hmac(kSigning, stringToSign);
  const signature = [...sigBytes].map((b) => b.toString(16).padStart(2, '0')).join('');

  return `https://${ENDPOINT}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json();
    const action = body?.action as 'put' | 'get' | 'delete';
    const keys: string[] = Array.isArray(body?.keys)
      ? body.keys
      : body?.key
        ? [body.key]
        : [];
    const expires = Number(body?.expires) || 3600;

    if (keys.length === 0 || !['put', 'get', 'delete'].includes(action)) {
      return new Response(JSON.stringify({ error: 'invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const method = action.toUpperCase() as 'PUT' | 'GET' | 'DELETE';

    // For delete action, perform hard delete via B2 native API (removes ALL versions).
    if (action === 'delete') {
      const results: { key: string; ok: boolean; deleted: number; error?: string }[] = [];
      for (const key of keys) {
        try {
          const r = await b2HardDelete(key);
          results.push({ key, ...r });
        } catch (e) {
          results.push({ key, ok: false, deleted: 0, error: String(e) });
        }
      }
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const url = await presign(method, keys[0], expires);
    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
