export interface B2Config {
  keyId?: string;
  appKey?: string;
  bucket: string;
  region: string;
  endpoint: string;
}

export const FILE_TTL_MS: number;
export function b2Config(env?: Record<string, string | undefined>): B2Config;
export function presign(cfg: B2Config, method: string, key: string, expires: number, extraParams?: Record<string, string>): string;
export function hardDelete(cfg: B2Config, keys: string[]): Promise<number>;
export function sweepExpired(cfg: B2Config, now?: number): Promise<{ scanned: number; deleted: number; errors: string[] }>;
export function handleSignRequest(body: unknown, cfg?: B2Config): Promise<{ status: number; json: Record<string, unknown> }>;
