import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getDbClient } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import type { Address } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const supabase = await getDbClient();

    // Check if address exists and belongs to user
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      throw new NotFoundError('Address', id);
    }

    // Remove default from all addresses
    await supabase
      .from('addresses')
      .update({ is_default: false } as any)
      .eq('user_id', user.id);

    // Set new default
    const { data, error } = await supabase
      .from('addresses')
      .update({ is_default: true } as any)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data as Address);
  } catch (error) {
    return errorResponse(error);
  }
}

