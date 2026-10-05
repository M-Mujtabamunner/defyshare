import React from 'react';
import { Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { checkIsAdmin } from '@/lib/admin';

const NOTIF_KEY = 'defyshare:notifications';

const SettingsSheet: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(NOTIF_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(NOTIF_KEY, String(notifications));
    } catch {
      /* ignore */
    }
  }, [notifications]);

  const [showAdmin, setShowAdmin] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    if (!user) { setShowAdmin(false); return; }
    checkIsAdmin().then((ok) => { if (!cancelled) setShowAdmin(ok); });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Shared files and text are deleted after 3 hours.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="notif" className="text-sm font-medium">Upload notifications</Label>
            <Switch id="notif" checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {showAdmin && (
            <Link to="/admin" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Shield className="w-4 h-4" />
                Open Admin
              </Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
