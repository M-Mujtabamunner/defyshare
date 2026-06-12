
# Plan: Promo picker fix + Friends/Groups/Messaging

This is a very large request, so it ships in checkpointed slices. Each slice is independently verifiable and does not break existing file sharing, IP rooms, expiry, admin, or login.

---

## Slice 0 — Promo duration picker behavior (small, ship first)

Today: applying the promo code immediately sets "Forever" and the picker is hidden behind a conditional that already shows it but pre-selects Forever, so it feels automatic.

Change:
- After a valid promo is applied, do NOT auto-set Forever. Set `override_seconds` to "unset" and force the user to pick from the dropdown: **1h, 2h, 5h, 10h, 15h, 30h, 3 days, 15 days, Forever**.
- Picker becomes the highlighted primary action right after applying the code, with a "Please choose a duration" hint.
- Uploads done before a duration is picked fall back to the default 30h expiry.
- Selection persists per user in `promo_overrides` (already supported).

No schema change needed.

---

## Slice 1 — Data model + profile sync

Create tables with RLS + GRANTs:
- `profiles` (user_id, google_name, google_email, google_photo, last_seen)
- `friend_requests` (sender, receiver, status, is_read)
- `friends` (user_id, friend_id, custom_display_name) — symmetric pair rows
- `blocked_users` (blocker_id, blocked_user_id)
- `conversations` (type: direct|group, last_message_at)
- `conversation_members` (conversation_id, user_id, role)
- `groups` (conversation_id, group_name, group_photo, created_by)
- `messages` (conversation_id, sender_id, type, text_content, file_url/name/size/type, is_read)

Helpers (SECURITY DEFINER, used inside RLS to avoid recursion):
- `is_friend(a,b)`, `is_blocked(a,b)`, `is_conversation_member(conv,user)`

Realtime enabled on `messages`, `friend_requests`, `conversation_members`.

Storage: new private bucket `chat-media` with signed-URL downloads. Policies allow upload only by conversation members.

Sign-in hook upserts `profiles` from Google identity (name, email, photo, last_seen).

---

## Slice 2 — Friends shell + Friend Requests page

- Top header gets a **Friends** button (with red dot for unread requests or unread messages).
- Route `/friends`:
  - Left sidebar: Friend Requests button, Create Group button, search, friends list (with Google photos + unread badges), groups list (with avatars + unread badges).
  - Center: empty state "Select a friend or group to start sharing."
- Route `/friends/request` with three tabs:
  - **Received**: Accept / Reject / Block
  - **Sent**: Cancel
  - **Block list**: Unblock
  - Add-friend search by name/email, "User not found" message, dedupe + self-send + block guards.
  - Visiting marks received requests as read.

---

## Slice 3 — Direct chat `/friends/:friendSlug`

- Slug = name slug, resolved via stable user id (friendship pair) to avoid duplicates.
- Chat header shows photo, name, email; clicking opens right-side settings panel (rename locally, block, remove friend; if blocked, message input is hidden and a notice is shown).
- Messages: text, image, video, file. Sent bubble = blue, received = neutral (works in light + dark).
- Whole-page drag-and-drop upload with progress + preview; also a send button + attach button.
- Realtime via Supabase channel filtered on `conversation_id`.

---

## Slice 4 — Groups

- **Create Group** modal (popup) from sidebar:
  - Searchable friend multi-select; selected rows get a transparent-blue overlay; click to unselect.
  - Group name (required), optional avatar upload.
  - Validation: name + ≥1 friend; creator auto-added as admin.
- Route `/friends/group/:groupSlug` mirrors direct chat features and shows sender avatar/name per message.
- Group settings panel: rename, change photo, add/remove members (admin), leave, delete (creator).

---

## Slice 5 — Notifications + polish

- Unread badges on Friends button, sidebar items.
- Toasts for new request / accepted / new message / new group / new file (respects existing notifications setting).
- Mobile responsive pass on sidebar (collapsible drawer).
- Theme toggle already persists; reuse the existing `ThemeProvider`.

---

## Routing summary

```
/                       existing file share (unchanged)
/admin                  existing
/friends                main messenger
/friends/request        Received / Sent / Block tabs
/friends/:friendSlug    direct chat
/friends/group/:slug    group chat
```

---

## Technical notes (for reviewers)

- All new public tables include explicit `GRANT` blocks for `authenticated` + `service_role`; no `anon` access.
- RLS uses SECURITY DEFINER helpers to keep policies non-recursive.
- Slug collisions resolved by appending a 4-char id suffix.
- Block semantics: when A blocks B, neither can message or send requests; existing history stays visible to both; B is moved to A's Block list and removed from A's friend list. Re-friending requires a new request after unblock.
- Auth is already Google via Lovable Cloud managed OAuth; nothing changes here.
- Existing file-sharing pages, hooks, and the `shared-files` bucket are untouched.

---

## Open questions (need answers before Slice 1)

1. **Slice order confirm**: ship Slice 0 (promo picker) first, then 1→5 in order?
2. **Block visibility**: confirm "history stays visible to both, but B disappears from A's friend list" — or should history be hidden too?
3. **Slug collisions for friends/groups with the same name**: OK to append a short id like `/friends/mujtaba-x7k2`?

Reply with answers (or just "go" to accept the defaults above) and I'll start with Slice 0.
