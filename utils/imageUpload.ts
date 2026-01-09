import { createClient } from '@/utils/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param folder - Optional folder path (default: 'products')
 * @returns Promise with upload result containing URL and path
 */
export async function uploadImageToStorage(
  file: File,
  folder: string = 'products'
): Promise<UploadResult> {
  try {
    const supabase = createClient();

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validImageTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${validImageTypes.join(', ')}`);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload multiple image files to Supabase Storage
 * @param files - Array of image files to upload
 * @param folder - Optional folder path (default: 'products')
 * @returns Promise with array of upload results
 */
export async function uploadMultipleImages(
  files: File[],
  folder: string = 'products'
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadImageToStorage(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Supabase Storage
 * @param path - The path of the image to delete
 * @returns Promise with success status
 */
export async function deleteImageFromStorage(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

