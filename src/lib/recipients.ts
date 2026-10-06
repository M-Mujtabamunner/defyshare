// Who a shared file is for. The hosted table has no recipient column and its
// schema can't be changed from here, so the target rides in the unused
// `uploader_email` column (null = everyone):
//   "to:<deviceId>|<name>;<deviceId>|<name>"  one or more devices
//   "grp:<groupId>|<name>"                     a group
// Keep every read/write of that encoding in this file.

export interface Peer {
  id: string;
  name: string;
}

export type Target =
  | { kind: 'everyone' }
  | { kind: 'devices'; devices: Peer[] }
  | { kind: 'group'; group: Peer };

export const EVERYONE: Target = { kind: 'everyone' };

const DEVICES_PREFIX = 'to:';
const GROUP_PREFIX = 'grp:';

/** Names can't contain the separators used by the encoding. */
export const stripSeparators = (s: string) => s.replace(/[|;]/g, ' ');

const encodePeer = (p: Peer) => `${p.id}|${stripSeparators(p.name)}`;

const decodePeer = (s: string): Peer | null => {
  const [id, ...rest] = s.split('|');
  return id ? { id, name: rest.join(' ') || 'Unknown' } : null;
};

export const encodeTarget = (t: Target): string | null => {
  if (t.kind === 'devices' && t.devices.length > 0) return DEVICES_PREFIX + t.devices.map(encodePeer).join(';');
  if (t.kind === 'group') return GROUP_PREFIX + encodePeer(t.group);
  return null;
};

export const decodeTarget = (v: string | null | undefined): Target => {
  if (v?.startsWith(DEVICES_PREFIX)) {
    const devices = v
      .slice(DEVICES_PREFIX.length)
      .split(';')
      .map(decodePeer)
      .filter((p): p is Peer => !!p);
    return devices.length > 0 ? { kind: 'devices', devices } : EVERYONE;
  }
  if (v?.startsWith(GROUP_PREFIX)) {
    const group = decodePeer(v.slice(GROUP_PREFIX.length));
    return group ? { kind: 'group', group } : EVERYONE;
  }
  return EVERYONE;
};

/** True if a file sent to `t` should reach this device. */
export const targetIncludes = (t: Target, deviceId: string, myGroupIds: ReadonlySet<string>) =>
  t.kind === 'everyone' ||
  (t.kind === 'devices' && t.devices.some((d) => d.id === deviceId)) ||
  (t.kind === 'group' && myGroupIds.has(t.group.id));

export const sameTarget = (a: Target, b: Target) => encodeTarget(a) === encodeTarget(b);
