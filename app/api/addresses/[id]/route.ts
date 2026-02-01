import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getAdminDbClient } from '@/lib/adminDb';
import { NotFoundError } from '@/lib/errors';
import type { Address, AddressInput } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const db = getAdminDbClient();

    const { data, error } = await db
      .from('addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Address', id);
    }

    return successResponse(data as Address);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const db = getAdminDbClient();

    // Check if address exists and belongs to user
    const { data: existing } = await db
      .from('addresses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      throw new NotFoundError('Address', id);
    }

    // If setting as default, remove default from others
    if (updates.is_default) {
      await db
        .from('addresses')
        .update({ is_default: false } as any)
        .eq('user_id', user.id);
    }

    const { data, error } = await db
      .from('addresses')
      .update(updates as any)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const db = getAdminDbClient();

    // Check if address exists and belongs to user
    const { data: existing } = await db
      .from('addresses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      throw new NotFoundError('Address', id);
    }

    const { error } = await db
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return successResponse({ message: 'Address deleted successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}

