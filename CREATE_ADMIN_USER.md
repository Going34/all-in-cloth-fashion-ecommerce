# Create Default Admin User

This guide explains how to create a default admin user for the admin portal.

## 🚀 Quick Method (Recommended)

### Using the Script (Easiest)

```bash
# Set your service role key (get it from Supabase Dashboard → Settings → API)
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script
npm run create:admin
```

**Default Credentials:**
- **Email:** `admin@allincloth.com`
- **Password:** `Admin@123`

### Custom Credentials

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export ADMIN_EMAIL="your-admin@example.com"
export ADMIN_PASSWORD="YourSecurePassword123"
export ADMIN_NAME="Your Admin Name"

npm run create:admin
```

---

## 📋 Manual Method (Alternative)

If you prefer to create the admin user manually:

### Step 1: Create User in Supabase Auth

1. Go to: **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** → **"Create New User"**
3. Fill in:
   - **Email:** `admin@allincloth.com` (or your preferred email)
   - **Password:** `Admin@123` (or your preferred password)
   - **Auto Confirm User:** ✅ (check this)
4. Click **"Create User"**

### Step 2: Get User ID

1. After creating the user, note the **User UID** (UUID)
2. Or find it in the users list

### Step 3: Create User Profile

Run this SQL in **Supabase Dashboard** → **SQL Editor**:

```sql
-- Replace USER_ID_HERE with the UUID from Step 2
INSERT INTO users (id, email, name, is_email_verified, is_active)
VALUES (
  'USER_ID_HERE',
  'admin@allincloth.com',
  'Admin User',
  true,
  true
)
ON CONFLICT (id) DO UPDATE
SET name = 'Admin User',
    is_email_verified = true,
    is_active = true;
```

### Step 4: Assign ADMIN Role

Run this SQL:

```sql
-- Get ADMIN role ID
SELECT id FROM roles WHERE name = 'ADMIN';

-- Then insert into user_roles (replace ROLE_ID and USER_ID)
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'USER_ID_HERE',
  (SELECT id FROM roles WHERE name = 'ADMIN')
)
ON CONFLICT (user_id, role_id) DO NOTHING;
```

---

## ✅ Verify Admin Access

1. Go to: `http://localhost:3000/admin/login`
2. Login with:
   - **Email:** `admin@allincloth.com`
   - **Password:** `Admin@123`
3. You should be redirected to `/admin/dashboard`

---

## 🔐 Security Notes

1. **Change Default Password:** After first login, change the password immediately
2. **Service Role Key:** Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it has admin privileges
3. **Environment Variables:** Never commit service role keys to git

---

## 🛠️ Troubleshooting

### Error: "Service role key not set"

**Solution:** Get your service role key from:
- Supabase Dashboard → Settings → API → `service_role` key

### Error: "Role not found"

**Solution:** Make sure migrations have been run:
```bash
# Check migration status
npm run migrate

# If migrations not run, execute them via Supabase Dashboard
```

### Error: "User already exists"

**Solution:** The script will update the existing user. If you want to create a new one:
- Use a different email
- Or delete the existing user first (Supabase Dashboard → Authentication → Users)

### Can't Login After Creation

**Check:**
1. User exists in `auth.users` (Supabase Dashboard → Authentication)
2. User profile exists in `users` table
3. User has ADMIN role in `user_roles` table
4. Email is confirmed (should be auto-confirmed by script)

**Verify with SQL:**
```sql
-- Check user profile
SELECT * FROM users WHERE email = 'admin@allincloth.com';

-- Check user roles
SELECT u.email, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@allincloth.com';
```

---

## 📝 Script Details

The `create-admin-user.ts` script:
1. ✅ Creates user in Supabase Auth (or updates if exists)
2. ✅ Creates/updates user profile in `users` table
3. ✅ Assigns ADMIN role from `roles` table
4. ✅ Auto-confirms email
5. ✅ Handles existing users gracefully

**Location:** `scripts/create-admin-user.ts`

---

## 🎯 Quick Reference

```bash
# Create admin with defaults
npm run create:admin

# Create admin with custom credentials
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="SecurePass123" \
ADMIN_NAME="Admin Name" \
npm run create:admin
```

---

**Need Help?** Check the troubleshooting section above or review the script output for detailed error messages.

