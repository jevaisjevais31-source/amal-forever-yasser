-- Prevent listing all files in chat-images bucket via API; public URLs still work
DROP POLICY IF EXISTS "Chat images public read" ON storage.objects;

CREATE POLICY "Users read own chat images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);