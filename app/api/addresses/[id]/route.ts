import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getDbClient } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import type { Address, AddressInput } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const supabase = await getDbClient();

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Address', params.id);
    }

    return successResponse(data as Address);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const updates: Partial<AddressInput> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.street !== undefined) updates.street = body.street;
    if (body.city !== undefined) updates.city = body.city;
    if (body.state !== undefined) updates.state = body.state;
    if (body.zip !== undefined) updates.zip = body.zip;
    if (body.country !== undefined) updates.country = body.country;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.is_default !== undefined) updates.is_default = body.is_default;

    const supabase = await getDbClient();

    // Check if address exists and belongs to user
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      throw new NotFoundError('Address', params.id);
    }

    // If setting as default, remove default from others
    if (updates.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false } as any)
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(updates as any)
      .eq('id', params.id)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const supabase = await getDbClient();

    // Check if address exists and belongs to user
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      throw new NotFoundError('Address', params.id);
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return successResponse({ message: 'Address deleted successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}

