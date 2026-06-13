import { useState, useCallback, useEffect } from 'react';
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
  /** Seconds until expiry. null = forever (only honored when keep_forever is true). undefined = default 30h. */
  expires_seconds?: number | null;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  fileName?: string;
}

export const useFileSharing = (roomKey: string) => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
  });

  useEffect(() => {
    if (!roomKey) return;

    const cleanupExpired = async () => {
      // Best-effort delete of expired files (skips keep_forever)
      const { data: expired } = await supabase
        .from('shared_files')
        .select('id, file_path')
        .eq('room_key', roomKey)
        .eq('keep_forever', false)
        .lt('expires_at', new Date().toISOString());

      if (expired && expired.length > 0) {
        const cloudPaths = expired.filter(f => !isB2Path(f.file_path)).map(f => f.file_path);
        if (cloudPaths.length > 0) {
          await supabase.storage.from('shared-files').remove(cloudPaths);
        }
        await supabase.from('shared_files').delete().in('id', expired.map(f => f.id));
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

      if (!error && data) {
        setFiles(data as SharedFile[]);
      }
      setLoading(false);
    };

    fetchFiles();

    const channel = supabase
      .channel(`files-${roomKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_files',
          filter: `room_key=eq.${roomKey}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFiles(prev => [payload.new as SharedFile, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setFiles(prev => prev.filter(f => f.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setFiles(prev => prev.map(f => f.id === payload.new.id ? payload.new as SharedFile : f));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomKey]);

  const addFile = useCallback(async (file: File, metadata?: UploadMetadata) => {
    if (!roomKey) return;

    const key = `${roomKey}/${Date.now()}-${file.name}`;
    const filePath = toB2Path(key); // new uploads go to Backblaze B2
    setUploadState({ isUploading: true, progress: 0, fileName: file.name });

    const progressInterval = setInterval(() => {
      setUploadState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 10, 90)
      }));
    }, 100);

    try {
      const uploadUrl = await getB2UploadUrl(key, file.type);
      const putRes = await fetch(uploadUrl, { method: 'PUT', body: file });
      clearInterval(progressInterval);
      if (!putRes.ok) {
        setUploadState({ isUploading: false, progress: 0 });
        throw new Error(`Upload failed (${putRes.status})`);
      }

      setUploadState(prev => ({ ...prev, progress: 95 }));

      const expires_seconds = metadata?.expires_seconds;
      const keep_forever = metadata?.keep_forever ?? false;
      const insertRow: Record<string, unknown> = {
        room_key: roomKey,
        name: file.name,
        size: file.size,
        type: file.type,
        file_path: filePath,
        uploader_name: metadata?.uploader_name ?? null,
        subject: metadata?.subject ?? null,
        uploader_email: metadata?.uploader_email ?? null,
        uploader_id: metadata?.uploader_id ?? null,
        keep_forever,
      };
      // Forever => keep DB default (will be filtered out by keep_forever flag).
      // Custom seconds => override expires_at.
      if (keep_forever && expires_seconds && expires_seconds > 0) {
        insertRow.expires_at = new Date(Date.now() + expires_seconds * 1000).toISOString();
      } else if (!keep_forever && expires_seconds && expires_seconds > 0) {
        insertRow.expires_at = new Date(Date.now() + expires_seconds * 1000).toISOString();
      }

      const { error: dbError } = await supabase
        .from('shared_files')
        .insert(insertRow as never);

      if (dbError) {
        setUploadState({ isUploading: false, progress: 0 });
        throw dbError;
      }

      setUploadState({ isUploading: false, progress: 100 });
      setTimeout(() => setUploadState({ isUploading: false, progress: 0 }), 500);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadState({ isUploading: false, progress: 0 });
      throw error;
    }
  }, [roomKey]);

  const removeFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (isB2Path(file.file_path)) {
      await deleteB2Objects([b2Key(file.file_path)]);
    } else {
      await supabase.storage.from('shared-files').remove([file.file_path]);
    }
    await supabase.from('shared_files').delete().eq('id', fileId);
  }, [files]);

  const downloadFile = useCallback(async (file: SharedFile) => {
    const { getSignedFileUrl, triggerBlobDownload } = await import('@/lib/storageUrls');
    const url = await getSignedFileUrl(file.file_path);
    if (!url) throw new Error('Could not generate download link');
    await triggerBlobDownload(url, file.name);
  }, []);

  const clearAll = useCallback(async () => {
    const prevFiles = [...files];
    setFiles([]);
    const cloudPaths = prevFiles.filter(f => !isB2Path(f.file_path)).map(f => f.file_path);
    if (cloudPaths.length > 0) {
      await supabase.storage.from('shared-files').remove(cloudPaths);
    }
    await supabase.from('shared_files').delete().eq('room_key', roomKey);
  }, [files, roomKey]);

  return { files, loading, uploadState, addFile, removeFile, downloadFile, clearAll };
};
