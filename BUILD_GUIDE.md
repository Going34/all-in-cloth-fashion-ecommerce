# 🚀 Complete Build Guide - Step by Step

This guide will walk you through setting up the **All in Cloth** e-commerce platform from scratch.

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **npm** or **yarn** package manager
- ✅ **Supabase Account** - [Sign up](https://supabase.com/)
- ✅ **Git** (optional, for version control)

---

## Step 1: Clone/Download Project

```bash
# If using git
git clone <repository-url>
cd all-in-cloth---fashion-e-commerce/e-commerce

# Or navigate to the project directory if already downloaded
cd /path/to/all-in-cloth---fashion-e-commerce/e-commerce
```

---

## Step 2: Install Dependencies

```bash
# Install all required packages
npm install

# This installs:
# - Next.js 16.1.1
# - React 19.2.3
# - Supabase client libraries
# - TypeScript
# - Tailwind CSS
# - And other dependencies
```

**Expected output:** Dependencies installed successfully (may take 1-2 minutes)

---

## Step 3: Set Up Supabase Project

### 3.1 Create Supabase Project

1. Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name:** `all-in-cloth` (or your preferred name)
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to be ready

### 3.2 Get API Keys

1. In Supabase Dashboard, go to: **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) ⚠️ **Keep this secret!**

---

## Step 4: Configure Environment Variables

### 4.1 Create `.env.local` File

In the `e-commerce` directory, create a file named `.env.local`:

```bash
# Create the file
touch .env.local

# Or use your editor to create it
```

### 4.2 Add Environment Variables

Open `.env.local` and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Alternative key names (if your Supabase uses different names)
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key-here
# NEXT_PUBLIC_SUPABASE_API_KEY=your-key-here

# Service Role Key (for admin user creation - keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Replace:**
- `https://your-project-ref.supabase.co` → Your actual Supabase URL
- `your-anon-key-here` → Your actual anon/public key
- `your-service-role-key-here` → Your actual service_role key

**⚠️ Important:**
- Never commit `.env.local` to git
- The service_role key has admin privileges - keep it secret!

---

## Step 5: Test Database Connection

### 5.1 Test via CLI

```bash
npm run test:db
```

**Expected output:**
```
✅ Database connection successful!
✅ Connected to: https://your-project.supabase.co
```

### 5.2 Test via Admin UI (After starting dev server)

```bash
# Start dev server first (Step 6)
npm run dev

# Then visit:
http://localhost:3000/admin/test-connection
```

---

## Step 6: Run Database Migrations

This project uses **Supabase CLI** for all database migrations. The custom migration system has been removed.

### 6.1 Link Your Supabase Project

```bash
# Login to Supabase CLI (if not already logged in)
npx supabase login

# Link your project (get project-ref from Dashboard → Settings → General)
npx supabase link --project-ref your-project-ref
```

### 6.2 Apply Migrations

```bash
# Push migrations to your Supabase project
npx supabase db push
```

This will:
- Apply the baseline migration (`000_baseline.sql`) which contains the complete schema
- Apply any additional migrations in order
- Track migrations in Supabase's migration system

**Note:** The baseline migration is marked as already applied in production, so it won't recreate existing tables.

### 6.3 Verify Migrations

```bash
# Check migration status
npx supabase migration list

# Or verify in Supabase Dashboard:
# Go to Database → Migrations to see applied migrations
```

**Verify Tables:**
- Go to **Table Editor** in Supabase Dashboard
- You should see all tables (users, products, orders, etc.)

### 6.4 Migration Documentation

For detailed migration workflow and best practices, see:
- **[MIGRATIONS.md](MIGRATIONS.md)** - Complete migration guide
```

**Expected:** All migrations should show as "executed" or "success"

---

## Step 7: Create Default Admin User

### 7.1 Set Service Role Key (if not in .env.local)

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 7.2 Run Admin Creation Script

```bash
npm run create:admin
```

**Expected output:**
```
🚀 Creating default admin user...

   Email: admin@allincloth.com
   Name: Admin User
   Password: Admin@123

📋 Step 1: Checking if user exists...
📋 Step 2: Creating user in Supabase Auth...
   ✅ User created in Supabase Auth
📋 Step 3: Creating/updating user profile...
   ✅ User profile created
📋 Step 4: Getting ADMIN role...
   ✅ ADMIN role found
📋 Step 5: Assigning ADMIN role...
   ✅ ADMIN role assigned

✅ Default admin user created successfully!

📝 Login Credentials:
   Email: admin@allincloth.com
   Password: Admin@123
```

### 7.3 Custom Admin Credentials (Optional)

```bash
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="SecurePass123"
export ADMIN_NAME="Admin Name"

npm run create:admin
```

---

## Step 8: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
  ▲ Next.js 16.1.1
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### 8.1 Verify Application is Running

Open your browser and visit:
- **Storefront:** http://localhost:3000
- **Admin Login:** http://localhost:3000/admin/login

---

## Step 9: Login to Admin Portal

1. Go to: http://localhost:3000/admin/login
2. Enter credentials:
   - **Email:** `admin@allincloth.com`
   - **Password:** `Admin@123`
3. Click **"Access Dashboard"**
4. ✅ You should be redirected to `/admin/dashboard`

**⚠️ Security:** Change the password after first login!

---

## Step 10: Verify Everything Works

### 10.1 Test Storefront

- ✅ Homepage loads: http://localhost:3000
- ✅ Shop page works: http://localhost:3000/shop
- ✅ Product pages load: http://localhost:3000/product/[id]

### 10.2 Test Admin Portal

- ✅ Admin login works: http://localhost:3000/admin/login
- ✅ Admin dashboard loads: http://localhost:3000/admin/dashboard
- ✅ Can create products: http://localhost:3000/admin/products
- ✅ Can view orders: http://localhost:3000/admin/orders

### 10.3 Test Database Connection

- ✅ Connection test: http://localhost:3000/admin/test-connection
- ✅ Migration status: http://localhost:3000/admin/migrations

---

## Step 11: Build for Production

### 11.1 Create Production Build

```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 11.2 Start Production Server

```bash
npm start
```

**Expected output:**
```
  ▲ Next.js 16.1.1
  - Local:        http://localhost:3000
  - Ready in 1.2s
```

---

## 📊 Quick Reference Checklist

Use this checklist to track your progress:

- [ ] **Step 1:** Project cloned/downloaded
- [ ] **Step 2:** Dependencies installed (`npm install`)
- [ ] **Step 3:** Supabase project created
- [ ] **Step 4:** Environment variables configured (`.env.local`)
- [ ] **Step 5:** Database connection tested
- [ ] **Step 6:** Migrations executed (tables created)
- [ ] **Step 7:** Admin user created
- [ ] **Step 8:** Dev server running (`npm run dev`)
- [ ] **Step 9:** Admin login successful
- [ ] **Step 10:** All features verified
- [ ] **Step 11:** Production build tested (optional)

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Supabase URL or key not configured"

**Solution:**
- Check `.env.local` exists
- Verify environment variable names are correct
- Restart dev server after adding env vars

### Issue: "Migration failed"

**Solution:**
- Check Supabase project is active
- Verify SQL syntax in migration files
- Try running migrations one by one via Dashboard

### Issue: "Admin user creation failed"

**Solution:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check migrations have been executed (roles table exists)
- Ensure Supabase project is active

### Issue: "Can't login to admin portal"

**Solution:**
- Verify user exists in Supabase Auth (Dashboard → Authentication → Users)
- Check user has ADMIN role assigned
- Ensure email is confirmed

---

## 📚 Additional Resources

- **Migration Guide:** `HOW_TO_RUN_MIGRATIONS.md`
- **Admin Setup:** `ADMIN_SETUP.md`
- **Create Admin User:** `CREATE_ADMIN_USER.md`
- **Database Connection:** `DB_CONNECTION_TEST.md`

---

## 🎯 Next Steps

After successful setup:

1. **Add Products:** Use admin portal to add products
2. **Configure Payment:** Set up payment gateway
3. **Customize:** Update branding, colors, content
4. **Deploy:** Deploy to Vercel, Netlify, or your preferred platform

---

## ✅ Success Indicators

You've successfully built the project when:

- ✅ Dev server runs without errors
- ✅ Database connection test passes
- ✅ All 21 tables exist in Supabase
- ✅ Admin login works
- ✅ Storefront pages load
- ✅ Production build completes successfully

---

**Need Help?** Check the troubleshooting section or review the detailed guides in the project root.

