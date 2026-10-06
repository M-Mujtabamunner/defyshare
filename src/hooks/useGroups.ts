import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRoomRecords, type RecordEvent } from '@/hooks/useRoomRecords';
import { stripSeparators, type Peer } from '@/lib/recipients';

export const UNTITLED_GROUP = 'Untitled group';
const MAX_GROUP_NAME = 32;

interface GroupRecord {
  type: 'group';
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
}

/** Someone who accepted an invite (the owner is implicitly a member). */
interface MemberRecord {
  type: 'member';
  id: string;
  groupId: string;
  deviceId: string;
  name: string;
}

interface InviteRecord {
  type: 'invite';
  id: string;
  groupId: string;
  groupName: string;
  from: Peer;
  to: Peer;
}

type GroupData = GroupRecord | MemberRecord | InviteRecord;

export interface Group {
  id: string;
  name: string;
  owner: Peer;
  members: Peer[]; // includes the owner first
  invited: Peer[]; // pending invites
  isOwner: boolean;
}

export interface Invite {
  id: string;
  groupId: string;
  groupName: string;
  from: Peer;
}

export type GroupEvent =
  | { type: 'invited'; invite: Invite }
  | { type: 'joined'; eventId: string; groupName: string; who: Peer }
  | { type: 'removed'; eventId: string; groupName: string };

const cleanGroupName = (s: string) => stripSeparators(s).replace(/\s+/g, ' ').trim().slice(0, MAX_GROUP_NAME) || UNTITLED_GROUP;
const memberId = (groupId: string, deviceId: string) => `${groupId}:${deviceId}`;

export const useGroups = (roomKey: string, me: Peer, onGroupEvent?: (e: GroupEvent) => void) => {
  const meRef = useRef(me);
  meRef.current = me;
  const onGroupEventRef = useRef(onGroupEvent);
  onGroupEventRef.current = onGroupEvent;

  const groupsRef = useRef<Map<string, GroupRecord>>(new Map());
  const leavingRef = useRef<Set<string>>(new Set());

  const onRecord = useCallback((e: RecordEvent<GroupData>) => {
    const d = e.record.data;
    const self = meRef.current.id;
    if (e.type === 'insert' && d.type === 'invite' && d.to.id === self) {
      onGroupEventRef.current?.({ type: 'invited', invite: { id: d.id, groupId: d.groupId, groupName: d.groupName, from: d.from } });
    } else if (e.type === 'insert' && d.type === 'member' && d.deviceId !== self) {
      const g = groupsRef.current.get(d.groupId);
      if (g?.ownerId === self) onGroupEventRef.current?.({ type: 'joined', eventId: e.record.rowId, groupName: g.name, who: { id: d.deviceId, name: d.name } });
    } else if (e.type === 'delete' && d.type === 'member' && d.deviceId === self) {
      // Leaving deletes your own record too; only report removals by the owner.
      const g = groupsRef.current.get(d.groupId);
      if (g && g.ownerId !== self && !leavingRef.current.has(d.groupId)) {
        onGroupEventRef.current?.({ type: 'removed', eventId: e.record.rowId, groupName: g.name });
      }
    }
  }, []);

  const { records, allRows, loaded, insert, removeRows, replace, REFRESH_AFTER_MS } = useRoomRecords<GroupData>(roomKey, onRecord);

  const byType = useMemo(() => {
    const groups = new Map<string, { rowId: string; createdAt: number; data: GroupRecord }>();
    const members: { rowId: string; createdAt: number; data: MemberRecord }[] = [];
    const invites: { rowId: string; createdAt: number; data: InviteRecord }[] = [];
    for (const r of records) {
      if (r.data.type === 'group') groups.set(r.data.id, r as { rowId: string; createdAt: number; data: GroupRecord });
      else if (r.data.type === 'member') members.push(r as { rowId: string; createdAt: number; data: MemberRecord });
      else if (r.data.type === 'invite') invites.push(r as { rowId: string; createdAt: number; data: InviteRecord });
    }
    return { groups, members, invites };
  }, [records]);

  useEffect(() => {
    groupsRef.current = new Map([...byType.groups].map(([id, r]) => [id, r.data]));
  }, [byType]);

  /** Groups this device belongs to (owned or joined). */
  const groups = useMemo<Group[]>(() => {
    const list: Group[] = [];
    for (const { data: g } of byType.groups.values()) {
      const joined = byType.members.filter((m) => m.data.groupId === g.id).map((m) => ({ id: m.data.deviceId, name: m.data.name }));
      const owner = { id: g.ownerId, name: g.ownerId === me.id ? me.name : g.ownerName };
      const isOwner = g.ownerId === me.id;
      if (!isOwner && !joined.some((p) => p.id === me.id)) continue;
      list.push({
        id: g.id,
        name: g.name,
        owner,
        members: [owner, ...joined.filter((p) => p.id !== g.ownerId).map((p) => (p.id === me.id ? { ...p, name: me.name } : p))],
        invited: byType.invites.filter((i) => i.data.groupId === g.id).map((i) => i.data.to),
        isOwner,
      });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [byType, me.id, me.name]);

  const myGroupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);

  const invites = useMemo<Invite[]>(
    () =>
      byType.invites
        .filter((i) => i.data.to.id === me.id && byType.groups.has(i.data.groupId) && !myGroupIds.has(i.data.groupId))
        .map((i) => ({ id: i.data.id, groupId: i.data.groupId, groupName: byType.groups.get(i.data.groupId)!.data.name, from: i.data.from })),
    [byType, me.id, myGroupIds],
  );

  const rowsOf = useCallback((ids: string[]) => allRows.filter((r) => ids.includes(r.data.id)).map((r) => r.rowId), [allRows]);

  // Keep my records alive: records expire after 30 days, so re-save old ones.
  useEffect(() => {
    if (!loaded) return;
    const now = Date.now();
    for (const r of records) {
      const mine =
        (r.data.type === 'group' && r.data.ownerId === me.id) || (r.data.type === 'member' && r.data.deviceId === me.id);
      if (mine && now - r.createdAt > REFRESH_AFTER_MS) replace(r.rowId, r.data).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const invite = useCallback(
    async (group: { id: string; name: string }, people: Peer[]) => {
      const existing = new Set(byType.invites.filter((i) => i.data.groupId === group.id).map((i) => i.data.to.id));
      for (const p of people) {
        if (p.id === me.id || existing.has(p.id)) continue;
        await insert({ type: 'invite', id: crypto.randomUUID(), groupId: group.id, groupName: group.name, from: me, to: p });
      }
    },
    [byType, insert, me],
  );

  const createGroup = useCallback(
    async (name: string, people: Peer[] = []) => {
      const group: GroupRecord = { type: 'group', id: crypto.randomUUID(), name: cleanGroupName(name), ownerId: me.id, ownerName: me.name };
      await insert(group);
      if (people.length > 0) await invite(group, people);
      return group.id;
    },
    [insert, invite, me],
  );

  const renameGroup = useCallback(
    async (groupId: string, name: string) => {
      const r = byType.groups.get(groupId);
      if (!r || r.data.ownerId !== me.id) return;
      await replace(r.rowId, { ...r.data, name: cleanGroupName(name), ownerName: me.name });
    },
    [byType, me, replace],
  );

  const removeMember = useCallback(
    async (groupId: string, deviceId: string) => {
      const g = byType.groups.get(groupId);
      if (!g || g.data.ownerId !== me.id) return;
      await removeRows(rowsOf([memberId(groupId, deviceId)]));
    },
    [byType, me.id, removeRows, rowsOf],
  );

  const cancelInvite = useCallback(
    async (groupId: string, deviceId: string) => {
      const ids = byType.invites.filter((i) => i.data.groupId === groupId && i.data.to.id === deviceId).map((i) => i.data.id);
      await removeRows(rowsOf(ids));
    },
    [byType, removeRows, rowsOf],
  );

  const acceptInvite = useCallback(
    async (inv: Invite) => {
      await insert({ type: 'member', id: memberId(inv.groupId, me.id), groupId: inv.groupId, deviceId: me.id, name: me.name });
      await removeRows(rowsOf([inv.id]));
    },
    [insert, me, removeRows, rowsOf],
  );

  const declineInvite = useCallback((inv: Invite) => removeRows(rowsOf([inv.id])), [removeRows, rowsOf]);

  const leaveGroup = useCallback(
    async (groupId: string) => {
      leavingRef.current.add(groupId);
      await removeRows(rowsOf([memberId(groupId, me.id)]));
    },
    [me.id, removeRows, rowsOf],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      const g = byType.groups.get(groupId);
      if (!g || g.data.ownerId !== me.id) return;
      const ids = [
        groupId,
        ...byType.members.filter((m) => m.data.groupId === groupId).map((m) => m.data.id),
        ...byType.invites.filter((i) => i.data.groupId === groupId).map((i) => i.data.id),
      ];
      await removeRows(rowsOf(ids));
    },
    [byType, me.id, removeRows, rowsOf],
  );

  return {
    groups,
    myGroupIds,
    invites,
    createGroup,
    renameGroup,
    invite,
    removeMember,
    cancelInvite,
    acceptInvite,
    declineInvite,
    leaveGroup,
    deleteGroup,
  };
};
