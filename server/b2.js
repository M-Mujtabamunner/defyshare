// Server-only Backblaze B2 helpers: S3 presigned URLs, hard deletes and the
// expiry sweep. Used by the Vercel function (api/b2-sign.js), the Vite dev
// server and the scheduled sweep (scripts/b2-sweep.mjs). Never import from src/.
import { createHash, createHmac } from 'node:crypto';

export const FILE_TTL_MS = 3 * 60 * 60 * 1000; // every upload is deleted after 3 hours
const MAX_SIGN_SECONDS = 60 * 60;
const MAX_KEYS_PER_REQUEST = 200;

export const b2Config = (env = process.env) => {
  const region = env.B2_REGION || 'us-east-005';
  return {
    keyId: env.B2_KEY_ID,
    appKey: env.B2_APPLICATION_KEY,
    bucket: env.B2_BUCKET || 'Defyshare1',
    region,
    endpoint: `s3.${region}.backblazeb2.com`,
  };
};

const rfc3986 = (s) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const sha256Hex = (s) => createHash('sha256').update(s).digest('hex');
const hmac = (key, data) => createHmac('sha256', key).update(data).digest();

export function presign(cfg, method, key, expires, extraParams = {}) {
  const amzDate = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const canonicalUri = '/' + [cfg.bucket, ...key.split('/')].map(rfc3986).join('/');
  const params = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${cfg.keyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
    ...extraParams,
  };
  const query = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`)
    .join('&');
  const canonicalRequest = [method, canonicalUri, query, `host:${cfg.endpoint}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
  const signingKey = hmac(hmac(hmac(hmac('AWS4' + cfg.appKey, dateStamp), cfg.region), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  return `https://${cfg.endpoint}${canonicalUri}?${query}&X-Amz-Signature=${signature}`;
}

// --- B2 native API (needed to delete every version, not just hide the file) ---
let authCache = null;

async function b2Auth(cfg) {
  if (authCache && authCache.keyId === cfg.keyId && authCache.expiresAt > Date.now()) return authCache;
  const basic = Buffer.from(`${cfg.keyId}:${cfg.appKey}`).toString('base64');
  const res = await fetch('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new Error(`b2_authorize_account ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const apiUrl = json.apiInfo.storageApi.apiUrl;
  const list = await b2Post({ apiUrl, token: json.authorizationToken }, 'b2_list_buckets', {
    accountId: json.accountId,
    bucketName: cfg.bucket,
  });
  const bucketId = list.buckets?.[0]?.bucketId;
  if (!bucketId) throw new Error(`bucket "${cfg.bucket}" not found`);
  authCache = { keyId: cfg.keyId, apiUrl, token: json.authorizationToken, bucketId, expiresAt: Date.now() + 12 * 3600 * 1000 };
  return authCache;
}

async function b2Post(auth, op, body) {
  const res = await fetch(`${auth.apiUrl}/b2api/v3/${op}`, {
    method: 'POST',
    headers: { Authorization: auth.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${op} ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Visit every file version in the bucket (optionally under a prefix). */
async function forEachVersion(cfg, prefix, visit) {
  const auth = await b2Auth(cfg);
  let startFileName;
  let startFileId;
  do {
    const page = await b2Post(auth, 'b2_list_file_versions', {
      bucketId: auth.bucketId,
      maxFileCount: 1000,
      ...(prefix ? { prefix } : {}),
      ...(startFileName ? { startFileName, startFileId } : {}),
    });
    for (const f of page.files ?? []) await visit(f, auth);
    startFileName = page.nextFileName;
    startFileId = page.nextFileId;
  } while (startFileName);
}

const deleteVersion = (auth, f) =>
  b2Post(auth, 'b2_delete_file_version', { fileName: f.fileName, fileId: f.fileId });

/** Permanently delete the given keys (all versions). */
export async function hardDelete(cfg, keys) {
  let deleted = 0;
  for (const key of keys) {
    await forEachVersion(cfg, key, async (f, auth) => {
      if (f.fileName !== key) return;
      await deleteVersion(auth, f);
      deleted++;
    });
  }
  return deleted;
}

/** Delete every file older than FILE_TTL_MS, plus any hidden/leftover versions. */
export async function sweepExpired(cfg, now = Date.now()) {
  let scanned = 0;
  let deleted = 0;
  const errors = [];
  await forEachVersion(cfg, '', async (f, auth) => {
    scanned++;
    const expired = now - f.uploadTimestamp >= FILE_TTL_MS;
    if (!expired && (f.action === 'upload' || f.action === 'start')) return;
    try {
      if (f.action === 'start') {
        await b2Post(auth, 'b2_cancel_large_file', { fileId: f.fileId });
      } else {
        await deleteVersion(auth, f);
      }
      deleted++;
    } catch (e) {
      errors.push(`${f.fileName}: ${e.message}`);
    }
  });
  return { scanned, deleted, errors };
}

// --- S3 multipart upload: large files go up in parallel parts ---
/** Server-side S3 call through a short-lived presigned URL. */
async function s3Call(cfg, method, key, params, { body, headers } = {}) {
  const res = await fetch(presign(cfg, method, key, 300, params), { method, body, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${key}: ${res.status} ${text.slice(0, 300)}`);
  return text;
}

export async function createMultipart(cfg, key, contentType) {
  const xml = await s3Call(cfg, 'POST', key, { uploads: '' }, { headers: { 'Content-Type': contentType || 'application/octet-stream' } });
  const uploadId = xml.match(/<UploadId>([^<]+)<\/UploadId>/)?.[1];
  if (!uploadId) throw new Error('no UploadId in response');
  return uploadId;
}

export const presignPart = (cfg, key, uploadId, partNumber, expires) =>
  presign(cfg, 'PUT', key, expires, { partNumber: String(partNumber), uploadId });

const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function completeMultipart(cfg, key, uploadId, parts) {
  const body =
    '<CompleteMultipartUpload>' +
    [...parts]
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((p) => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${xmlEscape(p.etag)}</ETag></Part>`)
      .join('') +
    '</CompleteMultipartUpload>';
  const xml = await s3Call(cfg, 'POST', key, { uploadId }, { body, headers: { 'Content-Type': 'application/xml' } });
  // S3 can report a failure inside a 200 response.
  if (/<Error>/.test(xml)) throw new Error(`complete failed: ${xml.slice(0, 300)}`);
}

export const abortMultipart = (cfg, key, uploadId) => s3Call(cfg, 'DELETE', key, { uploadId });

// --- Request handler shared by the Vercel function and the Vite dev server ---
const validKey = (k) =>
  typeof k === 'string' && k.length > 0 && k.length <= 1024 && !k.startsWith('/') && !k.split('/').includes('..');

const MAX_PARTS = 10000;
const validUploadId = (id) => typeof id === 'string' && /^[\w.~=+/-]{1,512}$/.test(id);
const validPart = (n) => Number.isInteger(n) && n >= 1 && n <= MAX_PARTS;

const ACTIONS = ['put', 'get', 'delete', 'mp-create', 'mp-parts', 'mp-complete', 'mp-abort'];

export async function handleSignRequest(body, cfg = b2Config()) {
  if (!cfg.keyId || !cfg.appKey) return { status: 500, json: { error: 'B2 credentials are not configured' } };
  const action = body?.action;
  const keys = Array.isArray(body?.keys) ? body.keys : body?.key ? [body.key] : [];
  if (!ACTIONS.includes(action) || keys.length === 0 || keys.length > MAX_KEYS_PER_REQUEST || !keys.every(validKey)) {
    return { status: 400, json: { error: 'invalid request' } };
  }
  const expires = Math.min(Math.max(Number(body.expires) || MAX_SIGN_SECONDS, 60), MAX_SIGN_SECONDS);
  const key = keys[0];

  if (action === 'delete') {
    return { status: 200, json: { deleted: await hardDelete(cfg, keys) } };
  }
  if (action === 'put') {
    if (Array.isArray(body.keys)) {
      return { status: 200, json: { urls: Object.fromEntries(keys.map((k) => [k, presign(cfg, 'PUT', k, expires)])) } };
    }
    return { status: 200, json: { url: presign(cfg, 'PUT', key, expires) } };
  }
  if (action === 'mp-create') {
    const contentType = typeof body.contentType === 'string' ? body.contentType.slice(0, 200) : undefined;
    return { status: 200, json: { uploadId: await createMultipart(cfg, key, contentType) } };
  }
  if (action.startsWith('mp-') && !validUploadId(body.uploadId)) {
    return { status: 400, json: { error: 'invalid uploadId' } };
  }
  if (action === 'mp-parts') {
    const parts = Array.isArray(body.parts) ? body.parts : [];
    if (parts.length === 0 || parts.length > MAX_KEYS_PER_REQUEST || !parts.every(validPart)) {
      return { status: 400, json: { error: 'invalid parts' } };
    }
    const urls = Object.fromEntries(parts.map((n) => [n, presignPart(cfg, key, body.uploadId, n, expires)]));
    return { status: 200, json: { urls } };
  }
  if (action === 'mp-complete') {
    const parts = Array.isArray(body.parts) ? body.parts : [];
    if (parts.length === 0 || parts.length > MAX_PARTS || !parts.every((p) => validPart(p?.partNumber) && typeof p?.etag === 'string')) {
      return { status: 400, json: { error: 'invalid parts' } };
    }
    await completeMultipart(cfg, key, body.uploadId, parts);
    return { status: 200, json: { ok: true } };
  }
  if (action === 'mp-abort') {
    await abortMultipart(cfg, key, body.uploadId);
    return { status: 200, json: { ok: true } };
  }
  // get: optional download filename makes the browser save instead of display
  const download = typeof body.download === 'string' ? body.download.replace(/["\r\n\\]/g, '_') : null;
  const extra = download
    ? { 'response-content-disposition': `attachment; filename="${download}"; filename*=UTF-8''${rfc3986(download)}` }
    : {};
  if (Array.isArray(body.keys)) {
    const urls = Object.fromEntries(keys.map((k) => [k, presign(cfg, 'GET', k, expires, extra)]));
    return { status: 200, json: { urls } };
  }
  return { status: 200, json: { url: presign(cfg, 'GET', keys[0], expires, extra) } };
}
