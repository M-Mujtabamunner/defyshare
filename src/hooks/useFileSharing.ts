import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getB2UploadUrl,
  isB2Path,
  toB2Path,
  b2Key,
  deleteB2Objects,
  getDownloadUrl,
  triggerDownload,
} from '@/lib/storageUrls';
import { mimeTypeFor } from '@/lib/fileTypes';

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

export interface UploadMetadata {
  uploader_name?: string;
  uploader_email?: string | null;
  uploader_id?: string | null;
}

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

const CONCURRENCY = 6;
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

const xhrPut = (
  url: string,
  file: File,
  contentType: string,
  onProgress: (loaded: number) => void,
  registerXhr: (xhr: XMLHttpRequest) => void,
) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    registerXhr(xhr);
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new UploadCanceledError());
    xhr.send(file);
  });

/** Display name keeps the folder path for files picked/dropped as part of a folder. */
const displayName = (file: File) => (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

export const useFileSharing = (roomKey: string) => {
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
  const xhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  const fileMapRef = useRef<Map<string, File>>(new Map());
  const metadataRef = useRef<UploadMetadata | undefined>(undefined);
  const canceledRef = useRef<Set<string>>(new Set());

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

  const recomputeProgress = useCallback(() => {
    let loaded = 0;
    let total = 0;
    for (const v of loadedRef.current.values()) loaded += v;
    for (const v of totalsRef.current.values()) total += v;
    const progress = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
    setUploadState((prev) => ({ ...prev, progress }));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<PerFileProgress>) => {
    setUploadState((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }, []);

  const uploadOne = useCallback(
    async (file: File, metadata: UploadMetadata | undefined, id: string) => {
      const name = displayName(file);
      const contentType = mimeTypeFor(file);
      const safeName = file.name.replace(/[^\w.-]+/g, '_') || 'file';
      const key = `${roomKey}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      totalsRef.current.set(id, file.size);
      loadedRef.current.set(id, 0);
      updateItem(id, { status: 'uploading', loaded: 0, error: undefined });

      const uploadUrl = await getB2UploadUrl(key);
      if (canceledRef.current.has(id)) throw new UploadCanceledError();
      await xhrPut(
        uploadUrl,
        file,
        contentType,
        (loaded) => {
          loadedRef.current.set(id, loaded);
          updateItem(id, { loaded });
          recomputeProgress();
        },
        (xhr) => {
          xhrsRef.current.set(id, xhr);
        },
      );
      xhrsRef.current.delete(id);

      const { data, error: dbError } = await supabase
        .from('shared_files')
        .insert({
          room_key: roomKey,
          name,
          size: file.size,
          type: contentType,
          file_path: toB2Path(key),
          uploader_name: metadata?.uploader_name ?? null,
          subject: name,
          uploader_email: metadata?.uploader_email ?? null,
          uploader_id: metadata?.uploader_id ?? null,
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
      updateItem(id, { status: 'done', loaded: file.size });
    },
    [roomKey, recomputeProgress, updateItem],
  );

  const runOne = useCallback(
    async (id: string, file: File, metadata: UploadMetadata | undefined) => {
      try {
        await uploadOne(file, metadata, id);
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
    async (incoming: File[], metadata?: UploadMetadata) => {
      if (!roomKey || incoming.length === 0) return { ok: 0, failed: 0 };
      loadedRef.current.clear();
      totalsRef.current.clear();
      xhrsRef.current.clear();
      fileMapRef.current.clear();
      canceledRef.current.clear();
      metadataRef.current = metadata;
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

      let ok = 0;
      let failed = 0;
      let cursor = 0;
      const worker = async () => {
        while (cursor < incoming.length) {
          const i = cursor++;
          const file = incoming[i];
          const id = items[i].id;
          if (canceledRef.current.has(id)) {
            updateItem(id, { status: 'canceled', error: 'Canceled' });
          } else {
            const res = await runOne(id, file, metadata);
            if (res === 'ok') ok++;
            else if (res === 'failed') failed++;
          }
          setUploadState((prev) => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, incoming.length) }, worker));

      setUploadState((prev) => ({ ...prev, isUploading: false, progress: 100 }));
      return { ok, failed };
    },
    [roomKey, runOne, updateItem],
  );

  const cancelUpload = useCallback((id: string) => {
    canceledRef.current.add(id);
    const xhr = xhrsRef.current.get(id);
    if (xhr) {
      try { xhr.abort(); } catch { /* noop */ }
      xhrsRef.current.delete(id);
    } else {
      // Not started yet (queued) — mark canceled immediately
      updateItem(id, { status: 'canceled', error: 'Canceled' });
    }
    loadedRef.current.set(id, 0);
    recomputeProgress();
  }, [recomputeProgress, updateItem]);

  const retryUpload = useCallback(async (id: string) => {
    const file = fileMapRef.current.get(id);
    if (!file) return;
    canceledRef.current.delete(id);
    setUploadState((prev) => ({
      ...prev,
      isUploading: true,
      items: prev.items.map((it) => (it.id === id ? { ...it, status: 'queued', loaded: 0, error: undefined } : it)),
    }));
    const res = await runOne(id, file, metadataRef.current);
    setUploadState((prev) => {
      const stillActive = prev.items.some((it) => it.status === 'uploading' || it.status === 'queued');
      return { ...prev, isUploading: stillActive };
    });
    return res;
  }, [runOne]);

  const dismissUploads = useCallback(() => {
    loadedRef.current.clear();
    totalsRef.current.clear();
    xhrsRef.current.clear();
    fileMapRef.current.clear();
    canceledRef.current.clear();
    setUploadState({ isUploading: false, progress: 0, totalFiles: 0, completedFiles: 0, items: [] });
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

  const clearAll = useCallback(async () => {
    const prevFiles = [...files];
    setFiles([]);
    removeStored(prevFiles);
    await supabase.from('shared_files').delete().eq('room_key', roomKey);
  }, [files, roomKey]);

  return {
    files,
    loading,
    uploadState,
    addFiles,
    removeFile,
    downloadFile,
    clearAll,
    cancelUpload,
    retryUpload,
    dismissUploads,
  };
};
