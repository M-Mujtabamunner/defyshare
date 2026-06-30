import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getB2UploadUrl, isB2Path, toB2Path, b2Key, deleteB2Objects } from '@/lib/storageUrls';

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
  subject?: string;
  uploader_email?: string;
  uploader_id?: string;
  keep_forever?: boolean;
  expires_seconds?: number | null;
}

export interface PerFileProgress {
  id: string;
  name: string;
  size: number;
  loaded: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
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

const CONCURRENCY = 6;

const xhrPut = (url: string, file: File, onProgress: (loaded: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });

export const useFileSharing = (roomKey: string) => {
  const [files, setFiles] = useState<SharedFile[]>([]);
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

  useEffect(() => {
    if (!roomKey) return;

    const cleanupExpired = async () => {
      const { data: expired } = await supabase
        .from('shared_files')
        .select('id, file_path')
        .eq('room_key', roomKey)
        .eq('keep_forever', false)
        .lt('expires_at', new Date().toISOString());

      if (expired && expired.length > 0) {
        const cloudPaths = expired.filter((f) => !isB2Path(f.file_path)).map((f) => f.file_path);
        const b2Keys = expired.filter((f) => isB2Path(f.file_path)).map((f) => b2Key(f.file_path));
        if (cloudPaths.length > 0) await supabase.storage.from('shared-files').remove(cloudPaths);
        if (b2Keys.length > 0) await deleteB2Objects(b2Keys);
        await supabase.from('shared_files').delete().in('id', expired.map((f) => f.id));
      }
    };

    const fetchFiles = async () => {
      setLoading(true);
      await cleanupExpired();
      const { data, error } = await supabase
        .from('shared_files')
        .select('*')
        .eq('room_key', roomKey)
        .order('created_at', { ascending: false });
      if (!error && data) setFiles(data as SharedFile[]);
      setLoading(false);
    };

    fetchFiles();

    const channel = supabase
      .channel(`files-${roomKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_files', filter: `room_key=eq.${roomKey}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFiles((prev) => (prev.some((f) => f.id === (payload.new as SharedFile).id) ? prev : [payload.new as SharedFile, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            setFiles((prev) => prev.filter((f) => f.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setFiles((prev) => prev.map((f) => (f.id === payload.new.id ? (payload.new as SharedFile) : f)));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomKey]);

  const recomputeProgress = useCallback(() => {
    let loaded = 0;
    let total = 0;
    for (const v of loadedRef.current.values()) loaded += v;
    for (const v of totalsRef.current.values()) total += v;
    const progress = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
    setUploadState((prev) => ({ ...prev, progress }));
  }, []);

  const uploadOne = useCallback(
    async (file: File, metadata: UploadMetadata | undefined, id: string) => {
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const key = `${roomKey}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const filePath = toB2Path(key);
      totalsRef.current.set(id, file.size);
      loadedRef.current.set(id, 0);

      const uploadUrl = await getB2UploadUrl(key, file.type);
      await xhrPut(uploadUrl, file, (loaded) => {
        loadedRef.current.set(id, loaded);
        recomputeProgress();
      });

      const expires_seconds = metadata?.expires_seconds;
      const keep_forever = metadata?.keep_forever ?? false;
      const insertRow: Record<string, unknown> = {
        room_key: roomKey,
        name: file.name,
        size: file.size,
        type: file.type,
        file_path: filePath,
        uploader_name: metadata?.uploader_name ?? null,
        subject: metadata?.subject ?? file.name,
        uploader_email: metadata?.uploader_email ?? null,
        uploader_id: metadata?.uploader_id ?? null,
        keep_forever,
      };
      if (expires_seconds && expires_seconds > 0) {
        insertRow.expires_at = new Date(Date.now() + expires_seconds * 1000).toISOString();
      }
      const { error: dbError } = await supabase.from('shared_files').insert(insertRow as never);
      if (dbError) throw dbError;
    },
    [roomKey, recomputeProgress],
  );

  const addFiles = useCallback(
    async (incoming: File[], metadata?: UploadMetadata) => {
      if (!roomKey || incoming.length === 0) return { ok: 0, failed: 0 };
      loadedRef.current.clear();
      totalsRef.current.clear();
      setUploadState({
        isUploading: true,
        progress: 0,
        fileName: incoming.length === 1 ? incoming[0].name : `${incoming.length} files`,
        totalFiles: incoming.length,
        completedFiles: 0,
      });

      let ok = 0;
      let failed = 0;
      let cursor = 0;
      const worker = async () => {
        while (cursor < incoming.length) {
          const i = cursor++;
          const file = incoming[i];
          const id = `${i}-${file.name}`;
          try {
            await uploadOne(file, metadata, id);
            ok++;
          } catch {
            failed++;
          }
          setUploadState((prev) => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, incoming.length) }, worker));

      setUploadState({ isUploading: false, progress: 100, totalFiles: incoming.length, completedFiles: incoming.length });
      setTimeout(() => setUploadState({ isUploading: false, progress: 0, totalFiles: 0, completedFiles: 0 }), 600);
      return { ok, failed };
    },
    [roomKey, uploadOne],
  );

  const addFile = useCallback(
    async (file: File, metadata?: UploadMetadata) => {
      await addFiles([file], metadata);
    },
    [addFiles],
  );

  const removeFile = useCallback(
    async (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (isB2Path(file.file_path)) await deleteB2Objects([b2Key(file.file_path)]);
      else await supabase.storage.from('shared-files').remove([file.file_path]);
      await supabase.from('shared_files').delete().eq('id', fileId);
    },
    [files],
  );

  const downloadFile = useCallback(async (file: SharedFile) => {
    const { getSignedFileUrl, triggerBlobDownload } = await import('@/lib/storageUrls');
    const url = await getSignedFileUrl(file.file_path);
    if (!url) throw new Error('Could not generate download link');
    await triggerBlobDownload(url, file.name);
  }, []);

  const clearAll = useCallback(async () => {
    const prevFiles = [...files];
    setFiles([]);
    const cloudPaths = prevFiles.filter((f) => !isB2Path(f.file_path)).map((f) => f.file_path);
    const b2Keys = prevFiles.filter((f) => isB2Path(f.file_path)).map((f) => b2Key(f.file_path));
    if (cloudPaths.length > 0) await supabase.storage.from('shared-files').remove(cloudPaths);
    if (b2Keys.length > 0) await deleteB2Objects(b2Keys);
    await supabase.from('shared_files').delete().eq('room_key', roomKey);
  }, [files, roomKey]);

  return { files, loading, uploadState, addFile, addFiles, removeFile, downloadFile, clearAll };
};
