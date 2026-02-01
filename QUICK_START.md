# ⚡ Quick Start Guide

**Fast setup in 5 minutes** - For experienced developers.

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MSG91_AUTH_KEY=your-msg91-auth-key
AUTH_JWT_SECRET=your-long-random-secret

# Optional (recommended for admin access via phone)
ADMIN_PHONE=+919999999999
```

---

## 3. Run Migrations

```bash
# Combine migrations
npm run migrate:combine

# Execute in Supabase Dashboard → SQL Editor
# Copy contents of: supabase/migrations/ALL_MIGRATIONS_COMBINED.sql
```

---

## 4. Create Admin User

```bash
npm run create:admin
```

**Default credentials (created in Supabase Auth):**
- Email: `admin@allincloth.com`
- Password: `Admin@123`

**Admin portal login (after setting `ADMIN_PHONE`):**
- Enter the admin phone number on `/admin/login` (OTP is skipped if `is_phone_verified` is true)

---

## 5. Start Dev Server

```bash
npm run dev
```

**Visit:**
- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin/login

---

## ✅ Done!

For detailed instructions, see: `BUILD_GUIDE.md`

