This is a very large request. I'll break it into shippable slices so we can verify each one before moving on. Please confirm the slice order (or reshuffle) before I start building.

## Quick fixes (Slice 0 — ship first, small)

1. **Delete-then-reappear bug**: when a file is deleted it comes back on refresh. Root cause is almost certainly the storage object isn't being removed (only the DB row), and/or the realtime subscription re-inserts a cached row. I'll: remove the storage object on delete, and make the delete idempotent against realtime.
2. **Promo code duration picker**: replace the "keep forever" auto-toggle with a duration selector shown after a valid promo: 1h, 2h, 5h, 10h, 15h, 30h, 3d, 15d, Forever. Persist chosen expiry per upload (and as the user's default override). Existing `promo_overrides` table gets an `override_seconds` column (nullable = forever).
3. **Google OAuth branding (logo + "DefyShare" name on consent screen)**: this is **not something Lovable code can change**. The consent screen comes from the Google Cloud OAuth client. To show your logo and "DefyShare" instead of "Lovable", you must use your **own** Google OAuth client (the one you pasted: `1000151514827-06ck2md25mdoa8c9k9v86ho273n5u4cr.apps.googleusercontent.com`) configured with your app name + logo on the OAuth consent screen in Google Cloud Console.

   **What I need from you**: the matching **client secret** for that client ID. I'll then switch the project from Lovable-managed Google OAuth to BYO credentials so your consent screen shows DefyShare. Without the secret I can't complete this step.

   Required Google Cloud Console setup on your side (one-time):
   - OAuth consent screen → App name: DefyShare, upload your logo, add authorized domains (`lovable.app`, your custom domain if any).
   - Credentials → your OAuth client → Authorized redirect URI: the callback URL shown in Cloud → Auth Settings → Google provider (I'll paste it once we open that panel).

---

## Friends + Messaging system (Slices 1–5 — large)

I'll build it in this order. Each slice is a checkpoint.

### Slice 1 — Data model + profiles
- Tables: `profiles`, `friend_requests`, `friends`, `blocked_users`, `conversations`, `conversation_members`, `groups`, `messages` (with RLS + GRANTs).
- Auto-upsert `profiles` row on sign-in (Google name/email/photo).
- New storage bucket `chat-media` (private, signed URLs).
- Helper SQL functions for "are we friends?", "is blocked?", conversation membership checks — used by RLS to avoid recursion.

### Slice 2 — Friends shell + requests page
- Top-nav **Friends** button with unread red dot.
- Route `/friends` with sidebar (friend list, group list, search, Create Group, Friend Requests button) and empty center state.
- Route `/friends/request` with tabs: Received / Sent / Block List + Add Friend by email/name search. Mark received requests read on visit.

### Slice 3 — Direct chat
- Route `/friends/:friendSlug` (slug from name, resolved by email/user id).
- Text + image + video + file messages, drag-and-drop anywhere on the page, upload progress, file previews, timestamps, sent = blue / received = neutral.
- Realtime via Supabase channels on `messages` filtered by `conversation_id`.
- Right-side settings panel: rename locally, block, remove friend.

### Slice 4 — Groups
- Create Group modal: searchable friend multi-select with transparent-blue selected coating, group name (required), optional avatar upload.
- Route `/friends/group/:groupSlug` with the same chat features as direct chat + sender avatar/name on each message.
- Group settings panel: rename, change photo, add/remove members (admin), leave, delete (creator).

### Slice 5 — Notifications + polish
- Red dot / unread counts on Friends button and sidebar items.
- Toast notifications for new request / accepted / new message / new group / new file.
- Mobile responsive pass.
- Theme toggle already exists and persists; I'll just make sure it's on every page (it already is via the existing header).

---

## What I need from you before starting

1. **Confirm slice order** above, or tell me which to do first.
2. **Google OAuth client secret** for `1000151514827-...apps.googleusercontent.com` (only needed for the branding fix in Slice 0).
3. **Group slug collisions**: if two groups have the same name, OK to append a short id (e.g. `/friends/group/team-alpha-x7k2`)? Same question for friends with identical names.
4. **Block visibility**: when A blocks B, should B still see the old chat history with A, or should A disappear from B's friend list entirely?

Reply with answers (or "go") and I'll start with Slice 0 immediately.
