import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getDbClient } from '@/lib/db';
import type { Address, AddressInput } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await getDbClient();

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (error) {
      throw error;
    }

    return successResponse((data as Address[]) || []);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const addressData: AddressInput = {
      name: body.name,
      street: body.street,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country,
      phone: body.phone,
      is_default: body.is_default || false,
    };

    // Validate required fields
    if (!addressData.name || !addressData.street || !addressData.city || !addressData.state || !addressData.zip || !addressData.country || !addressData.phone) {
      return errorResponse(new Error('All address fields including phone number are required'), 400);
    }

    const supabase = await getDbClient();

    // If this is marked as default, update others
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false } as any)
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        ...addressData,
      } as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data as Address, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

