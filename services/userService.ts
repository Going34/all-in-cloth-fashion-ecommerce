import { createClient } from '@/utils/supabase/client';
import type { User, Address, AddressInput, Role } from '@/types';

const supabase = createClient();

export interface UserProfile extends User {
  roles?: Role[];
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      user_roles (roles (*))
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  const profile = data as any;
  return {
    ...profile,
    roles: profile.user_roles?.map((ur: any) => ur.roles).filter(Boolean) || [],
  };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'phone'>>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('users')
    .update(updates as any)
    .eq('id', userId);

  return { error: error as Error | null };
}

// Address functions
export async function getUserAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }

  return (data as Address[]) || [];
}

export async function createAddress(
  userId: string,
  address: AddressInput
): Promise<{ data: Address | null; error: Error | null }> {
  // If this is the first address or marked as default, update others
  if (address.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false } as any)
      .eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: userId,
      ...address,
    } as any)
    .select()
    .single();

  return { data: data as Address | null, error: error as Error | null };
}

export async function updateAddress(
  addressId: string,
  userId: string,
  updates: Partial<AddressInput>
): Promise<{ error: Error | null }> {
  // If setting as default, remove default from others
  if (updates.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false } as any)
      .eq('user_id', userId);
  }

  const { error } = await supabase
    .from('addresses')
    .update(updates as any)
    .eq('id', addressId)
    .eq('user_id', userId);

  return { error: error as Error | null };
}

export async function deleteAddress(addressId: string, userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);

  return { error: error as Error | null };
}

export async function setDefaultAddress(addressId: string, userId: string): Promise<{ error: Error | null }> {
  // Remove default from all addresses
  await supabase
    .from('addresses')
    .update({ is_default: false } as any)
    .eq('user_id', userId);

  // Set new default
  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true } as any)
    .eq('id', addressId)
    .eq('user_id', userId);

  return { error: error as Error | null };
}

export async function getDefaultAddress(userId: string): Promise<Address | null> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (error) {
    return null;
  }

  return data as Address;
}

// Admin functions
export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      user_roles (roles (*))
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return ((data as any[]) || []).map((user) => ({
    ...user,
    roles: user.user_roles?.map((ur: any) => ur.roles).filter(Boolean) || [],
  }));
}

export async function updateUserRole(
  userId: string,
  roleId: string
): Promise<{ error: Error | null }> {
  // Remove existing roles
  await supabase.from('user_roles').delete().eq('user_id', userId);

  // Add new role
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleId } as any);

  return { error: error as Error | null };
}

export async function deactivateUser(userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false } as any)
    .eq('id', userId);

  return { error: error as Error | null };
}

export async function activateUser(userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: true } as any)
    .eq('id', userId);

  return { error: error as Error | null };
}
