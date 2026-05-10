
-- Admin moderation policies for reviews
CREATE POLICY "Admins can update any review"
ON public.reviews FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any review"
ON public.reviews FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Explicitly deny user_roles writes from authenticated/anon users
CREATE POLICY "Block role inserts from users"
ON public.user_roles AS RESTRICTIVE FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Block role updates from users"
ON public.user_roles AS RESTRICTIVE FOR UPDATE
TO authenticated, anon
USING (false);

CREATE POLICY "Block role deletes from users"
ON public.user_roles AS RESTRICTIVE FOR DELETE
TO authenticated, anon
USING (false);

-- Prevent listing of all avatar files; public CDN access still works for known URLs
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
