-- Create storage bucket for site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for site-assets bucket
-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- Allow everyone to read site assets (public bucket)
CREATE POLICY IF NOT EXISTS "Public read access to site assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');

-- Allow authenticated users to update their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets');

-- Allow authenticated users to delete site assets
CREATE POLICY IF NOT EXISTS "Authenticated users can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets');
