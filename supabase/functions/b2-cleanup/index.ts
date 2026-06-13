// Deletes expired Backblaze B2 objects for shared_files past their expires_at.
// Triggered by pg_cron every hour.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const KEY_ID = Deno.env.get('B2_KEY_ID')!;
const APP_KEY = Deno.env.get('B2_APPLICATION_KEY')!;
const BUCKET = 'defyshare';
const ENDPOINT = 's3.us-east-005.backblazeb2.com';
const REGION = 'us-east-005';
const SERVICE = 's3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const enc = new TextEncoder();
const B2_PREFIX = 'b2://';

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
}
function rfc3986(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

async function presignDelete(key: string, expires = 300) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const credential = `${KEY_ID}/${credentialScope}`;
  const canonicalUri = '/' + [BUCKET, ...key.split('/')].map(rfc3986).join('/');
  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  };
  const canonicalQuery = Object.keys(params).sort().map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`).join('&');
  const canonicalHeaders = `host:${ENDPOINT}\n`;
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const canonicalRequest = ['DELETE', canonicalUri, canonicalQuery, canonicalHeaders, 'host', payloadHash].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');
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

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Find expired B2 files (skip keep_forever)
  const { data: expired, error } = await supabase
    .from('shared_files')
    .select('id, file_path')
    .eq('keep_forever', false)
    .lt('expires_at', new Date().toISOString())
    .like('file_path', `${B2_PREFIX}%`)
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: { id: string; ok: boolean; status?: number; err?: string }[] = [];
  for (const row of expired ?? []) {
    const key = row.file_path.slice(B2_PREFIX.length);
    try {
      const url = await presignDelete(key);
      const res = await fetch(url, { method: 'DELETE' });
      // B2 returns 204 on success, 404 if already gone — treat both as success
      const ok = res.ok || res.status === 404;
      await res.text();
      if (ok) {
        await supabase.from('shared_files').delete().eq('id', row.id);
      }
      results.push({ id: row.id, ok, status: res.status });
    } catch (e) {
      results.push({ id: row.id, ok: false, err: String(e) });
    }
  }

  return new Response(JSON.stringify({ scanned: expired?.length ?? 0, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
