# Admin Portal Setup

## Quick Start: Create Default Admin User

After running database migrations, create a default admin user:

```bash
# Set your Supabase service role key
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Create default admin user
npm run create:admin
```

**Default Credentials:**
- **Email:** `admin@allincloth.com`
- **Password:** `Admin@123`

**Login URL:** `http://localhost:3000/admin/login`

---

## Full Setup Steps

1. **Run Database Migrations**
   ```bash
   # Combine migrations
   npm run migrate:combine
   
   # Execute in Supabase Dashboard → SQL Editor
   # Or use: supabase db push
   ```

2. **Create Admin User**
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   npm run create:admin
   ```

3. **Login to Admin Portal**
   - Go to: `http://localhost:3000/admin/login`
   - Use default credentials or your custom ones

4. **Change Password** (Recommended)
   - After first login, change the default password

---

## Get Service Role Key

1. Go to: **Supabase Dashboard** → **Settings** → **API**
2. Find **`service_role`** key (keep it secret!)
3. Copy and set as environment variable:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your-key-here"
   ```

---

## Custom Admin Credentials

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export ADMIN_EMAIL="your-admin@example.com"
export ADMIN_PASSWORD="YourSecurePassword123"
export ADMIN_NAME="Your Admin Name"

npm run create:admin
```

---

## Manual Setup (Alternative)

See `CREATE_ADMIN_USER.md` for detailed manual setup instructions.

---

## Troubleshooting

### "Service role key not set"
- Get your key from Supabase Dashboard → Settings → API → `service_role` key
- Set it as environment variable: `export SUPABASE_SERVICE_ROLE_KEY="..."`

### "Role not found"
- Make sure migrations have been executed
- Check that `roles` table has `ADMIN` role

### Can't login after creation
- Verify user exists in Supabase Auth (Dashboard → Authentication → Users)
- Check user has ADMIN role assigned
- Ensure email is confirmed

---

For more details, see: `CREATE_ADMIN_USER.md`

