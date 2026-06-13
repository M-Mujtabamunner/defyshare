
-- 1. Tighten conversation_members UPDATE: self-updates may not escalate role
DROP POLICY IF EXISTS "Admin updates membership" ON public.conversation_members;

CREATE POLICY "Admin updates membership"
ON public.conversation_members
FOR UPDATE
TO authenticated
USING (
  public.is_conversation_admin(conversation_id, auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_conversation_admin(conversation_id, auth.uid())
  OR (
    user_id = auth.uid()
    AND role = 'member'::public.member_role
  )
);

-- 2. chat-media storage bucket: restrict UPDATE to original uploader
DROP POLICY IF EXISTS "Chat media: uploader can update own files" ON storage.objects;

CREATE POLICY "Chat media: uploader can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND ((storage.foldername(name))[2])::uuid = auth.uid()
)
WITH CHECK (
  bucket_id = 'chat-media'
  AND ((storage.foldername(name))[2])::uuid = auth.uid()
);
