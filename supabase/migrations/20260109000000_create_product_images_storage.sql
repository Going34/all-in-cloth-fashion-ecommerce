-- Create storage bucket for product images
-- Note: This migration creates the bucket via SQL if possible
-- If your Supabase version doesn't support bucket creation via SQL,
-- you'll need to create it manually in the Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: product-images
-- 4. Public: true (so images can be accessed via public URLs)
-- 5. File size limit: 5242880 (5MB)
-- 6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp, image/svg+xml

-- Attempt to create bucket (works in Supabase v1.3.0+)
DO $$
BEGIN
  -- Check if bucket already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'product-images'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'product-images',
      'product-images',
      true,
      5242880, -- 5MB
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    );
  END IF;
END $$;

-- Create RLS policies for the product-images bucket
-- Allow authenticated users to upload images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to upload product images'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload product images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'product-images' AND
      (storage.foldername(name))[1] = 'products'
    );
  END IF;
END $$;

-- Allow public read access to product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public read access to product images'
  ) THEN
    CREATE POLICY "Allow public read access to product images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Allow authenticated users to update their uploaded images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to update product images'
  ) THEN
    CREATE POLICY "Allow authenticated users to update product images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Allow authenticated users to delete their uploaded images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to delete product images'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete product images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Add comment
COMMENT ON POLICY "Allow authenticated users to upload product images" ON storage.objects IS 
  'Allows authenticated users (admins) to upload product images to the product-images bucket';

