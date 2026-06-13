import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/admin';
import { SharedFile } from '@/hooks/useFileSharing';
import { getSignedFileUrl } from '@/lib/storageUrls';

interface HistoryRow {
  id: string;
  room_key: string;
  name: string;
  size: number;
  type: string | null;
  subject: string | null;
  uploader_name: string | null;
  uploader_email: string | null;
  uploader_id: string | null;
  uploaded_at: string;
}


const formatBytes = (b: number) => {
  if (!b) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!user || !isAdminEmail(user.email)) return;
    supabase
      .from('shared_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        setFiles((data as SharedFile[]) || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return files;
    return files.filter((f) =>
      [f.name, f.subject, f.uploader_name, f.uploader_email, f.room_key as unknown as string]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [files, q]);

  const stats = useMemo(() => {
    const rooms = new Set(files.map((f) => (f as any).room_key)).size;
    const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);
    return { count: files.length, rooms, totalSize };
  }, [files]);

  const download = async (f: SharedFile) => {
    const url = await getSignedFileUrl(f.file_path);
    if (url) window.open(url, '_blank');
  };

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (!isAdminEmail(user.email)) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <h1 className="text-2xl font-bold">Admin · Global Logs</h1>
          </div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-lg border border-border/50 bg-card/30">
            <p className="text-xs text-muted-foreground">Files</p>
            <p className="text-2xl font-bold text-primary">{stats.count}</p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-card/30">
            <p className="text-xs text-muted-foreground">Active rooms</p>
            <p className="text-2xl font-bold text-primary">{stats.rooms}</p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-card/30">
            <p className="text-xs text-muted-foreground">Storage used</p>
            <p className="text-2xl font-bold text-primary">{formatBytes(stats.totalSize)}</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, subject, uploader, room…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No files</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Uploader</TableHead>
                  <TableHead>Room (IP)</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="max-w-[160px] truncate">{f.subject || '—'}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[180px] truncate">{f.name}</TableCell>
                    <TableCell className="text-xs">
                      <div className="truncate max-w-[160px]">{f.uploader_name || '—'}</div>
                      <div className="text-muted-foreground truncate max-w-[160px]">{f.uploader_email || ''}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{(f as any).room_key}</TableCell>
                    <TableCell className="text-xs">{formatBytes(f.size)}</TableCell>
                    <TableCell className="text-xs">{new Date(f.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => download(f)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
