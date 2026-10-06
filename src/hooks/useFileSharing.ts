import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getB2UploadUrls,
  startMultipart,
  getPartUrls,
  completeMultipart,
  abortMultipart,
  isB2Path,
  toB2Path,
  b2Key,
  deleteB2Objects,
  getDownloadUrl,
  triggerDownload,
} from '@/lib/storageUrls';
import { mimeTypeFor } from '@/lib/fileTypes';
import { decodeTarget, encodeTarget, targetIncludes, type Peer, type Target } from '@/lib/recipients';

export interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file_path: string;
  room_key: string;
  created_at: string;
  expires_at: string;
  keep_forever: boolean;
  uploader_name: string | null;
  subject: string | null;
  uploader_email: string | null;
  uploader_id: string | null;
}

export type { Peer, Target } from '@/lib/recipients';

export interface PerFileProgress {
  id: string;
  name: string;
  size: number;
  loaded: number;
  status: 'queued' | 'uploading' | 'done' | 'error' | 'canceled';
  error?: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number; // 0-100 aggregate
  fileName?: string;
  totalFiles: number;
  completedFiles: number;
  items: PerFileProgress[];
}

/** Every shared file is removed 3 hours after upload. */
export const FILE_TTL_MS = 3 * 60 * 60 * 1000;

// --- Sender / audience ---
// uploader_id/uploader_name hold the sending device; the audience is encoded in
// uploader_email (see src/lib/recipients.ts).
export const targetOf = (file: SharedFile): Target => decodeTarget(file.uploader_email);

export const senderOf = (file: SharedFile): Peer | null =>
  file.uploader_id ? { id: file.uploader_id, name: file.uploader_name || 'Unknown device' } : null;

/** Files sent to specific devices or a group only show to them and the sender. */
const canSee = (file: SharedFile, deviceId: string, myGroupIds: ReadonlySet<string>) =>
  file.uploader_id === deviceId || targetIncludes(targetOf(file), deviceId, myGroupIds);

// --- Upload tuning ---
const MB = 1024 * 1024;
const MULTIPART_MIN = 24 * MB; // larger files upload as parallel parts
const partSizeFor = (size: number) => Math.max(8 * MB, Math.ceil(size / 9000 / MB) * MB);
const MAX_CONNECTIONS = 6; // browsers allow about 6 connections per host
const MAX_ATTEMPTS = 3;
const PART_URL_BATCH = 100;

const FILE_COLUMNS =
  'id, name, size, type, file_path, room_key, created_at, expires_at, keep_forever, uploader_name, subject, uploader_email, uploader_id';

const cacheKey = (room: string) => `defyshare:files:${room}`;
const isLive = (f: SharedFile) => new Date(f.expires_at).getTime() > Date.now();

const readCache = (room: string): SharedFile[] => {
  try {
    const raw = localStorage.getItem(cacheKey(room));
    return raw ? (JSON.parse(raw) as SharedFile[]).filter(isLive) : [];
  } catch {
    return [];
  }
};

const writeCache = (room: string, files: SharedFile[]) => {
  try {
    localStorage.setItem(cacheKey(room), JSON.stringify(files.slice(0, 100)));
  } catch {
    /* storage full or blocked */
  }
};

class UploadCanceledError extends Error {
  constructor() {
    super('Upload canceled');
    this.name = 'UploadCanceledError';
  }
}

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Upload failed (${status})`);
  }
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Caps concurrent requests across every file in a batch. */
const createLimiter = (limit: number) => {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async <T,>(task: () => Promise<T>): Promise<T> => {
    if (active < limit) active++;
    else await new Promise<void>((r) => waiting.push(r)); // slot handed over by release
    try {
      return await task();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  };
};

/** Retries network errors and 5xx/429 responses with backoff; never retries a cancel. */
const withRetry = async <T,>(task: () => Promise<T>, onRetry?: () => void): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (e) {
      const retryable = !(e instanceof UploadCanceledError) && (!(e instanceof HttpError) || e.status >= 500 || e.status === 429);
      if (!retryable || attempt >= MAX_ATTEMPTS) throw e;
      onRetry?.();
      await sleep(600 * attempt);
    }
  }
};

/** PUT with progress; resolves with the ETag (needed to finish multipart uploads). */
const xhrPut = (
  url: string,
  body: Blob,
  contentType: string | null,
  onProgress: (loaded: number) => void,
  track: (xhr: XMLHttpRequest) => () => void,
) =>
  new Promise<string | null>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const untrack = track(xhr);
    xhr.open('PUT', url);
    if (contentType) xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      untrack();
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.getResponseHeader('ETag'));
      else reject(new HttpError(xhr.status));
    };
    xhr.onerror = () => {
      untrack();
      reject(new Error('Network error during upload'));
    };
    xhr.onabort = () => {
      untrack();
      reject(new UploadCanceledError());
    };
    xhr.send(body);
  });

/** Display name keeps the folder path for files picked/dropped as part of a folder. */
const displayName = (file: File) => (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

const newKey = (roomKey: string, file: File) => {
  const safeName = file.name.replace(/[^\w.-]+/g, '_') || 'file';
  return `${roomKey}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
};

interface UploadOptions {
  sender: Peer;
  target: Target;
}

const NO_GROUPS: ReadonlySet<string> = new Set();

export const useFileSharing = (
  roomKey: string,
  deviceId: string,
  myGroupIds: ReadonlySet<string> = NO_GROUPS,
  onIncoming?: (file: SharedFile, from: Peer | null, target: Target) => void,
) => {
  const [files, setFiles] = useState<SharedFile[]>(() => (roomKey ? readCache(roomKey) : []));
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    totalFiles: 0,
    completedFiles: 0,
    items: [],
  });
  const loadedRef = useRef<Map<string, number>>(new Map());
  const totalsRef = useRef<Map<string, number>>(new Map());
  const xhrsRef = useRef<Map<string, Set<XMLHttpRequest>>>(new Map());
  const multipartRef = useRef<Map<string, { key: string; uploadId: string }>>(new Map());
  const fileMapRef = useRef<Map<string, File>>(new Map());
  const optionsRef = useRef<UploadOptions | null>(null);
  const canceledRef = useRef<Set<string>>(new Set());
  const limiterRef = useRef(createLimiter(MAX_CONNECTIONS));
  const frameRef = useRef(0);
  const onIncomingRef = useRef(onIncoming);
  onIncomingRef.current = onIncoming;
  const deviceIdRef = useRef(deviceId);
  deviceIdRef.current = deviceId;
  const groupIdsRef = useRef(myGroupIds);
  groupIdsRef.current = myGroupIds;

  useEffect(() => {
    if (!roomKey) return;
    let active = true;

    // Paint the last known list instantly, then refresh from the server.
    const cached = readCache(roomKey);
    setFiles(cached);
    setLoading(cached.length === 0);

    supabase
      .from('shared_files')
      .select(FILE_COLUMNS)
      .eq('room_key', roomKey)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) setFiles(data as SharedFile[]);
        setLoading(false);
      });

    // Expired rows are also removed by the server cron; this just tidies up early.
    supabase
      .from('shared_files')
      .delete()
      .eq('room_key', roomKey)
      .lt('expires_at', new Date().toISOString())
      .then(() => undefined);

    const channel = supabase
      .channel(`files-${roomKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_files', filter: `room_key=eq.${roomKey}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as SharedFile;
            setFiles((prev) => (prev.some((f) => f.id === row.id) ? prev : [row, ...prev]));
            const me = deviceIdRef.current;
            const target = targetOf(row);
            if (target.kind !== 'everyone' && row.uploader_id !== me && targetIncludes(target, me, groupIdsRef.current)) {
              onIncomingRef.current?.(row, senderOf(row), target);
            }
          } else if (payload.eventType === 'DELETE') {
            setFiles((prev) => prev.filter((f) => f.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setFiles((prev) => prev.map((f) => (f.id === payload.new.id ? (payload.new as SharedFile) : f)));
          }
        },
      )
      .subscribe();

    // Drop files from view the moment they expire.
    const tick = setInterval(() => {
      setFiles((prev) => (prev.every(isLive) ? prev : prev.filter(isLive)));
    }, 30_000);

    return () => {
      active = false;
      clearInterval(tick);
      supabase.removeChannel(channel);
    };
  }, [roomKey]);

  useEffect(() => {
    if (roomKey && !loading) writeCache(roomKey, files);
  }, [roomKey, files, loading]);

  const visibleFiles = useMemo(() => files.filter((f) => canSee(f, deviceId, myGroupIds)), [files, deviceId, myGroupIds]);

  // Progress events arrive many times per second per part; render at most once per frame.
  const scheduleProgress = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      let loaded = 0;
      let total = 0;
      for (const v of loadedRef.current.values()) loaded += v;
      for (const v of totalsRef.current.values()) total += v;
      const progress = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
      setUploadState((prev) => ({
        ...prev,
        progress,
        items: prev.items.map((it) =>
          it.status === 'uploading' ? { ...it, loaded: loadedRef.current.get(it.id) ?? it.loaded } : it,
        ),
      }));
    });
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<PerFileProgress>) => {
    setUploadState((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }, []);

  const tracker = useCallback(
    (id: string) => (xhr: XMLHttpRequest) => {
      if (canceledRef.current.has(id)) {
        queueMicrotask(() => xhr.abort());
      }
      const set = xhrsRef.current.get(id) ?? new Set<XMLHttpRequest>();
      set.add(xhr);
      xhrsRef.current.set(id, set);
      return () => set.delete(xhr);
    },
    [],
  );

  const assertActive = (id: string) => {
    if (canceledRef.current.has(id)) throw new UploadCanceledError();
  };

  const uploadSimple = useCallback(
    async (id: string, file: File, key: string, url: string | undefined, contentType: string) => {
      const limit = limiterRef.current;
      await withRetry(
        async () => {
          assertActive(id);
          const target = url ?? (await getB2UploadUrls([key]))[key];
          await limit(() =>
            xhrPut(target, file, contentType, (loaded) => {
              loadedRef.current.set(id, loaded);
              scheduleProgress();
            }, tracker(id)),
          );
        },
        () => loadedRef.current.set(id, 0),
      );
    },
    [scheduleProgress, tracker],
  );

  const uploadMultipart = useCallback(
    async (id: string, file: File, key: string, contentType: string) => {
      const limit = limiterRef.current;
      const uploadId = await startMultipart(key, contentType);
      multipartRef.current.set(id, { key, uploadId });
      const partSize = partSizeFor(file.size);
      const count = Math.ceil(file.size / partSize);
      const partLoaded = new Map<number, number>();
      const batches = new Map<number, Promise<Record<string, string>>>();
      const urlFor = async (n: number) => {
        const b = Math.floor((n - 1) / PART_URL_BATCH);
        if (!batches.has(b)) {
          const first = b * PART_URL_BATCH + 1;
          batches.set(b, getPartUrls(key, uploadId, range(first, Math.min(count, first + PART_URL_BATCH - 1))));
        }
        return (await batches.get(b)!)[n];
      };
      const reportProgress = () => {
        let sum = 0;
        for (const v of partLoaded.values()) sum += v;
        loadedRef.current.set(id, sum);
        scheduleProgress();
      };

      let failed = false;
      const etags: { partNumber: number; etag: string }[] = [];
      try {
        await Promise.all(
          range(1, count).map((n) =>
            withRetry(
              async () => {
                if (failed) throw new UploadCanceledError();
                assertActive(id);
                const url = await urlFor(n);
                const blob = file.slice((n - 1) * partSize, Math.min(file.size, n * partSize));
                const etag = await limit(() => {
                  if (failed) throw new UploadCanceledError();
                  return xhrPut(url, blob, null, (loaded) => {
                    partLoaded.set(n, loaded);
                    reportProgress();
                  }, tracker(id));
                });
                if (!etag) throw new Error('Upload server did not return a part ETag');
                etags.push({ partNumber: n, etag });
              },
              () => {
                partLoaded.set(n, 0);
                reportProgress();
              },
            ).catch((e) => {
              // One part failing for good stops the rest of this file.
              if (!failed) {
                failed = true;
                xhrsRef.current.get(id)?.forEach((x) => x.abort());
              }
              throw e;
            }),
          ),
        );
        await completeMultipart(key, uploadId, etags);
      } catch (e) {
        abortMultipart(key, uploadId);
        throw e;
      } finally {
        multipartRef.current.delete(id);
      }
    },
    [scheduleProgress, tracker],
  );

  const uploadOne = useCallback(
    async (id: string, file: File, key: string, url: string | undefined, options: UploadOptions) => {
      const name = displayName(file);
      const contentType = mimeTypeFor(file);
      totalsRef.current.set(id, file.size);
      loadedRef.current.set(id, 0);
      updateItem(id, { status: 'uploading', loaded: 0, error: undefined });
      assertActive(id);

      if (file.size >= MULTIPART_MIN) await uploadMultipart(id, file, key, contentType);
      else await uploadSimple(id, file, key, url, contentType);
      assertActive(id);

      const { data, error: dbError } = await supabase
        .from('shared_files')
        .insert({
          room_key: roomKey,
          name,
          size: file.size,
          type: contentType,
          file_path: toB2Path(key),
          uploader_id: options.sender.id,
          uploader_name: options.sender.name,
          uploader_email: encodeTarget(options.target),
          subject: name,
          keep_forever: false,
          expires_at: new Date(Date.now() + FILE_TTL_MS).toISOString(),
        } as never)
        .select(FILE_COLUMNS)
        .single();
      if (dbError) {
        deleteB2Objects([key]);
        throw dbError;
      }
      const row = data as unknown as SharedFile;
      setFiles((prev) => (prev.some((f) => f.id === row.id) ? prev : [row, ...prev]));
      loadedRef.current.set(id, file.size);
      updateItem(id, { status: 'done', loaded: file.size });
    },
    [roomKey, updateItem, uploadMultipart, uploadSimple],
  );

  const runOne = useCallback(
    async (id: string, file: File, key: string, url: string | undefined, options: UploadOptions) => {
      try {
        await uploadOne(id, file, key, url, options);
        return 'ok' as const;
      } catch (e) {
        if (e instanceof UploadCanceledError || canceledRef.current.has(id)) {
          updateItem(id, { status: 'canceled', error: 'Canceled' });
          return 'canceled' as const;
        }
        updateItem(id, { status: 'error', error: e instanceof Error ? e.message : 'Upload failed' });
        return 'failed' as const;
      } finally {
        xhrsRef.current.delete(id);
      }
    },
    [uploadOne, updateItem],
  );

  const addFiles = useCallback(
    async (incoming: File[], options: UploadOptions) => {
      if (!roomKey || incoming.length === 0) return { ok: 0, failed: 0 };
      loadedRef.current.clear();
      totalsRef.current.clear();
      xhrsRef.current.clear();
      fileMapRef.current.clear();
      canceledRef.current.clear();
      optionsRef.current = options;
      const items: PerFileProgress[] = incoming.map((f, i) => {
        const id = `${i}-${displayName(f)}`;
        fileMapRef.current.set(id, f);
        return { id, name: displayName(f), size: f.size, loaded: 0, status: 'queued' };
      });
      setUploadState({
        isUploading: true,
        progress: 0,
        fileName: incoming.length === 1 ? displayName(incoming[0]) : `${incoming.length} files`,
        totalFiles: incoming.length,
        completedFiles: 0,
        items,
      });

      // One request signs every small file's upload URL.
      const keys = incoming.map((f) => newKey(roomKey, f));
      const smallKeys = keys.filter((_, i) => incoming[i].size < MULTIPART_MIN);
      const urls = smallKeys.length > 0 ? await getB2UploadUrls(smallKeys).catch(() => ({} as Record<string, string>)) : {};

      let ok = 0;
      let failed = 0;
      let cursor = 0;
      const worker = async () => {
        while (cursor < incoming.length) {
          const i = cursor++;
          const id = items[i].id;
          if (canceledRef.current.has(id)) {
            updateItem(id, { status: 'canceled', error: 'Canceled' });
          } else {
            const res = await runOne(id, incoming[i], keys[i], urls[keys[i]], options);
            if (res === 'ok') ok++;
            else if (res === 'failed') failed++;
          }
          setUploadState((prev) => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
        }
      };
      await Promise.all(Array.from({ length: Math.min(MAX_CONNECTIONS, incoming.length) }, worker));

      setUploadState((prev) => ({ ...prev, isUploading: false, progress: 100 }));
      return { ok, failed };
    },
    [roomKey, runOne, updateItem],
  );

  const cancelUpload = useCallback(
    (id: string) => {
      canceledRef.current.add(id);
      const xhrs = xhrsRef.current.get(id);
      if (xhrs && xhrs.size > 0) {
        xhrs.forEach((x) => x.abort());
      } else {
        updateItem(id, { status: 'canceled', error: 'Canceled' });
      }
      const mp = multipartRef.current.get(id);
      if (mp) abortMultipart(mp.key, mp.uploadId);
      loadedRef.current.set(id, 0);
      scheduleProgress();
    },
    [scheduleProgress, updateItem],
  );

  const retryUpload = useCallback(
    async (id: string) => {
      const file = fileMapRef.current.get(id);
      const options = optionsRef.current;
      if (!file || !options) return;
      canceledRef.current.delete(id);
      setUploadState((prev) => ({
        ...prev,
        isUploading: true,
        items: prev.items.map((it) => (it.id === id ? { ...it, status: 'queued', loaded: 0, error: undefined } : it)),
      }));
      const res = await runOne(id, file, newKey(roomKey, file), undefined, options);
      setUploadState((prev) => {
        const stillActive = prev.items.some((it) => it.status === 'uploading' || it.status === 'queued');
        return { ...prev, isUploading: stillActive };
      });
      return res;
    },
    [roomKey, runOne],
  );

  const dismissUploads = useCallback(() => {
    loadedRef.current.clear();
    totalsRef.current.clear();
    xhrsRef.current.clear();
    fileMapRef.current.clear();
    canceledRef.current.clear();
    setUploadState({ isUploading: false, progress: 0, totalFiles: 0, completedFiles: 0, items: [] });
  }, []);

  /**
   * Change who a sent file is for. The table only allows insert/delete, so the
   * row is re-posted with the new audience; the stored file itself is untouched.
   */
  const changeTarget = useCallback(async (file: SharedFile, target: Target) => {
    const { id: oldId, ...row } = file;
    const { data, error } = await supabase
      .from('shared_files')
      .insert({ ...row, uploader_email: encodeTarget(target) } as never)
      .select(FILE_COLUMNS)
      .single();
    if (error) throw error;
    const next = data as unknown as SharedFile;
    setFiles((prev) => prev.map((f) => (f.id === oldId ? next : f)));
    await supabase.from('shared_files').delete().eq('id', oldId);
  }, []);

  const removeStored = (list: SharedFile[]) => {
    const cloudPaths = list.filter((f) => !isB2Path(f.file_path)).map((f) => f.file_path);
    const keys = list.filter((f) => isB2Path(f.file_path)).map((f) => b2Key(f.file_path));
    if (cloudPaths.length > 0) supabase.storage.from('shared-files').remove(cloudPaths);
    deleteB2Objects(keys);
  };

  const removeFile = useCallback(
    async (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      removeStored([file]);
      await supabase.from('shared_files').delete().eq('id', fileId);
    },
    [files],
  );

  const downloadFile = useCallback(async (file: SharedFile) => {
    const filename = file.name.split('/').pop() || file.name;
    const url = await getDownloadUrl(file.file_path, filename);
    if (!url) throw new Error('Could not generate download link');
    triggerDownload(url, filename);
  }, []);

  /** Clears what this device can see — never files sent privately to other devices. */
  const clearAll = useCallback(async () => {
    const mine = visibleFiles;
    const ids = new Set(mine.map((f) => f.id));
    setFiles((prev) => prev.filter((f) => !ids.has(f.id)));
    removeStored(mine);
    if (ids.size > 0) await supabase.from('shared_files').delete().in('id', [...ids]);
  }, [visibleFiles]);

  return {
    files: visibleFiles,
    allFiles: files,
    loading,
    uploadState,
    addFiles,
    removeFile,
    downloadFile,
    clearAll,
    cancelUpload,
    retryUpload,
    dismissUploads,
    changeTarget,
  };
};
