import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getDbClient } from '@/lib/db';
import type { User } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await getDbClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      throw error || new Error('User not found');
    }

    return successResponse(data as User);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const updates: Partial<Pick<User, 'name' | 'phone'>> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;

    if (Object.keys(updates).length === 0) {
      return errorResponse(new Error('No valid fields to update'), 400);
    }

    const supabase = await getDbClient();

    const { data, error } = await supabase
      .from('users')
      .update(updates as any)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data as User);
  } catch (error) {
    return errorResponse(error);
  }
}

