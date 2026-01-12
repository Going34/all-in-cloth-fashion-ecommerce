#!/usr/bin/env tsx
/**
 * Create Default Admin User Script
 * 
 * This script creates a default admin user in Supabase Auth and assigns ADMIN role
 * 
 * Usage:
 *   npm run create:admin
 *   Or: npx tsx scripts/create-admin-user.ts
 * 
 * Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (required for creating users)
 *   ADMIN_EMAIL - Admin email (default: admin@allincloth.com)
 *   ADMIN_PASSWORD - Admin password (default: Admin@123)
 *   ADMIN_NAME - Admin name (default: Admin User)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zagoyabmutueuzzndkmb.supabase.co';
const supabaseServiceKey = 'sb_secret_E29qz5SdYf_yViv_cCb0mg_tA9g11zO'
const adminEmail = process.env.ADMIN_EMAIL || 'admin@allincloth.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
const adminName = process.env.ADMIN_NAME || 'Admin User';

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
  console.error('   ⚠️  Service role key has admin privileges - keep it secret!');
  process.exit(1);
}

// Use service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  console.log('🚀 Creating default admin user...\n');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Name: ${adminName}`);
  console.log(`   Password: ${adminPassword}\n`);

  try {
    // Step 1: Check if user already exists in auth
    console.log('📋 Step 1: Checking if user exists...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error checking existing users:', listError.message);
      process.exit(1);
    }

    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);
    
    let userId: string;

    if (existingUser) {
      console.log('   ⚠️  User already exists in Supabase Auth');
      userId = existingUser.id;
      
      // Update password if needed
      if (adminPassword !== 'Admin@123' || process.env.ADMIN_PASSWORD) {
        console.log('   🔄 Updating password...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: adminPassword,
        });
        if (updateError) {
          console.error('   ❌ Failed to update password:', updateError.message);
        } else {
          console.log('   ✅ Password updated');
        }
      }
    } else {
      // Step 2: Create user in Supabase Auth
      console.log('📋 Step 2: Creating user in Supabase Auth...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: adminName,
        },
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        console.error('   This might be due to:');
        console.error('   1. Missing roles table or USER role');
        console.error('   2. handle_new_user() trigger failing');
        console.error('   3. Database constraints not met');
        console.error('   Attempting to work around trigger issue...');
        
        // Try to get more details about the error
        if (authError.message.includes('trigger') || authError.message.includes('Database error')) {
          console.log('   ⚠️  Trigger may be failing. Will create user profile manually...');
          // Don't exit - we'll try to create user profile manually below
        } else {
          console.error('   Check Supabase Dashboard → Logs for detailed error');
          process.exit(1);
        }
      }

      if (!authUser?.user) {
        // If user creation failed but we have a user ID from error, try to continue
        if (authError && authError.message.includes('already exists')) {
          console.log('   ℹ️  User might already exist, checking...');
          // Will be handled in the existing user check above
          // Try to get user ID from existing users
          const { data: retryUsers } = await supabase.auth.admin.listUsers();
          const retryUser = retryUsers?.users?.find(u => u.email === adminEmail);
          if (retryUser) {
            userId = retryUser.id;
          } else {
            console.error('❌ Failed to create auth user and could not find existing user');
            process.exit(1);
          }
        } else {
          console.error('❌ Failed to create auth user');
          process.exit(1);
        }
      } else {
        userId = authUser.user.id;
        console.log('   ✅ User created in Supabase Auth');
      }
    }

    // Ensure userId is set before proceeding
    if (!userId) {
      console.error('❌ User ID is not available. Cannot proceed.');
      process.exit(1);
    }

    // If we have userId but trigger might have failed, ensure profile exists
    if (userId) {
      // Small delay to let trigger complete (if it exists)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 4: Check/Insert user profile
    console.log('📋 Step 3: Creating/updating user profile...');
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking user profile:', profileCheckError.message);
      process.exit(1);
    }

    if (!existingProfile) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: adminEmail,
          name: adminName,
          is_email_verified: true,
          is_active: true,
        } as any);

      if (insertError) {
        console.error('❌ Error creating user profile:', insertError.message);
        process.exit(1);
      }
      console.log('   ✅ User profile created');
    } else {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: adminName,
          is_email_verified: true,
          is_active: true,
        } as any)
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating user profile:', updateError.message);
        process.exit(1);
      }
      console.log('   ✅ User profile updated');
    }

    // Step 5: Get ADMIN role ID
    console.log('📋 Step 4: Getting ADMIN role...');
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'ADMIN')
      .single();

    if (roleError || !adminRole) {
      console.error('❌ Error fetching ADMIN role:', roleError?.message || 'Role not found');
      console.error('   Make sure migrations have been run and roles table has ADMIN role');
      process.exit(1);
    }

    console.log('   ✅ ADMIN role found');

    // Step 6: Assign ADMIN role to user
    console.log('📋 Step 5: Assigning ADMIN role...');
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: adminRole.id,
      } as any, {
        onConflict: 'user_id,role_id',
      });

    if (userRoleError) {
      console.error('❌ Error assigning ADMIN role:', userRoleError.message);
      process.exit(1);
    }

    console.log('   ✅ ADMIN role assigned');

    // Success!
    console.log('\n✅ Default admin user created successfully!\n');
    console.log('📝 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);
    console.log('🔗 Login at: http://localhost:3000/admin/login\n');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdminUser();

