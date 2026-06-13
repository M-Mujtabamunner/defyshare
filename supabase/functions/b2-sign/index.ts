// Presigns S3-compatible URLs for Backblaze B2 (path-style).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const KEY_ID = Deno.env.get('B2_KEY_ID')!;
const APP_KEY = Deno.env.get('B2_APPLICATION_KEY')!;
const BUCKET = 'defyshare';
const ENDPOINT = 's3.us-east-005.backblazeb2.com';
const REGION = 'us-east-005';
const SERVICE = 's3';

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

    // For delete action, perform the deletes server-side so the client doesn't need CORS-DELETE.
    if (action === 'delete') {
      const results: { key: string; ok: boolean; status: number }[] = [];
      for (const key of keys) {
        const url = await presign('DELETE', key, 300);
        const res = await fetch(url, { method: 'DELETE' });
        await res.text();
        results.push({ key, ok: res.ok || res.status === 404, status: res.status });
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
