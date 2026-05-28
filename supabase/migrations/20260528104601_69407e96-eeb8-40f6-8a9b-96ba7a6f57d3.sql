-- 1. Fix friendship UPDATE: only addressee can change status to accepted
DROP POLICY IF EXISTS "Respond to friend requests" ON public.friendships;

CREATE POLICY "Respond to friend requests"
ON public.friendships
FOR UPDATE
TO authenticated
USING ((auth.uid() = addressee_id) OR (auth.uid() = requester_id))
WITH CHECK (
  (auth.uid() = addressee_id)
  OR (auth.uid() = requester_id AND status = 'pending'::friendship_status)
);

-- 2. Storage: restrict INSERT to user's own folder
DROP POLICY IF EXISTS "Authenticated can upload chat images" ON storage.objects;

CREATE POLICY "Authenticated can upload chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Storage: add UPDATE policy restricted to owner folder
CREATE POLICY "Users update own chat images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'chat-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Realtime: enable RLS and require authenticated access on broadcast messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive realtime" ON realtime.messages;

CREATE POLICY "Authenticated can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);