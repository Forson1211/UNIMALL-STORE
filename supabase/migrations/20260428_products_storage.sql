-- Create storage bucket for products if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for products bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Allow everyone to read products (public bucket)
CREATE POLICY "Public read access to products"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow users to manage their own uploads in products bucket
CREATE POLICY "Users can update their own products images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND owner = auth.uid());

CREATE POLICY "Users can delete their own products images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND owner = auth.uid());
