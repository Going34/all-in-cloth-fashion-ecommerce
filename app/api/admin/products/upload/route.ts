import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { getDbClient } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await getDbClient();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return errorResponse(new Error('No file provided'), 400);
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validImageTypes.includes(file.type)) {
      return errorResponse(
        new Error(`Invalid file type. Allowed types: ${validImageTypes.join(', ')}`),
        400
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return errorResponse(new Error('File size exceeds 5MB limit'), 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return errorResponse(new Error(`Upload failed: ${error.message}`), 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return errorResponse(new Error('Failed to get public URL for uploaded image'), 500);
    }

    return successResponse({
      url: urlData.publicUrl,
      path: filePath,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

