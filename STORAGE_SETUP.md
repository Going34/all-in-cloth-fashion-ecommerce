# Supabase Storage Setup Guide

This guide explains how to set up the `product-images` storage bucket in Supabase for image uploads.

## Option 1: Automatic Setup (Recommended)

If you're using Supabase v1.3.0 or later, run the migration:

```bash
# The migration will automatically create the bucket
# Make sure you have the necessary permissions
```

The migration file `20260109000000_create_product_images_storage.sql` will:
- Create the `product-images` bucket
- Set it as public (for public URL access)
- Configure file size limit (5MB)
- Set allowed MIME types
- Create RLS policies for access control

## Option 2: Manual Setup via Dashboard

If the migration doesn't work or you prefer manual setup:

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on "Storage" in the left sidebar

2. **Create New Bucket**
   - Click "New bucket" button
   - Configure as follows:
     - **Name**: `product-images`
     - **Public**: `true` (enables public URL access)
     - **File size limit**: `5242880` (5MB)
     - **Allowed MIME types**: 
       - `image/jpeg`
       - `image/jpg`
       - `image/png`
       - `image/gif`
       - `image/webp`
       - `image/svg+xml`

3. **Set Up RLS Policies** (if not created by migration)
   - Go to Storage → Policies
   - For the `product-images` bucket, create these policies:
     
     **Policy 1: Upload (INSERT)**
     - Name: "Allow authenticated users to upload product images"
     - Target roles: `authenticated`
     - Allowed operation: `INSERT`
     - Policy definition:
       ```sql
       bucket_id = 'product-images' AND
       (storage.foldername(name))[1] = 'products'
       ```
     
     **Policy 2: Read (SELECT)**
     - Name: "Allow public read access to product images"
     - Target roles: `public`
     - Allowed operation: `SELECT`
     - Policy definition:
       ```sql
       bucket_id = 'product-images'
       ```
     
     **Policy 3: Update (UPDATE)**
     - Name: "Allow authenticated users to update product images"
     - Target roles: `authenticated`
     - Allowed operation: `UPDATE`
     - Policy definition:
       ```sql
       bucket_id = 'product-images'
       ```
     
     **Policy 4: Delete (DELETE)**
     - Name: "Allow authenticated users to delete product images"
     - Target roles: `authenticated`
     - Allowed operation: `DELETE`
     - Policy definition:
       ```sql
       bucket_id = 'product-images'
       ```

## Verify Setup

After setup, verify the bucket is working:

1. **Check bucket exists**: Go to Storage → Buckets and confirm `product-images` is listed
2. **Test upload**: Try uploading an image through the product form
3. **Check public URL**: Verify uploaded images have accessible public URLs

## Troubleshooting

### "Bucket not found" error
- Ensure the bucket name is exactly `product-images` (case-sensitive)
- Check that the bucket was created successfully in the dashboard

### "Permission denied" error
- Verify RLS policies are correctly set up
- Ensure the user is authenticated (admin users)
- Check that the bucket is set to public if you need public URLs

### "File too large" error
- Verify file size limit is set to 5MB (5242880 bytes)
- Check that uploaded files are under the limit

### "Invalid file type" error
- Ensure allowed MIME types include the image type you're uploading
- Check file extension matches the MIME type

## Storage Structure

Images are stored in the following structure:
```
product-images/
  └── products/
      └── {timestamp}-{random}.{ext}
```

Example: `products/1704067200000-abc123def456.jpg`

## API Endpoint

The upload endpoint is available at:
```
POST /api/admin/products/upload
```

Requires:
- Admin authentication
- FormData with `file` field
- Optional `folder` field (defaults to 'products')

Returns:
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "path": "products/...",
    "fileName": "image.jpg",
    "size": 12345,
    "type": "image/jpeg"
  }
}
```

