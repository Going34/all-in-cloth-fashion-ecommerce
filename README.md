# All in Cloth - Fashion E-Commerce Platform

A modern e-commerce platform built with Next.js and Supabase.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` with your Supabase credentials (see [BUILD_GUIDE.md](BUILD_GUIDE.md))

3. **Run database migrations:**
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Documentation

- **[BUILD_GUIDE.md](BUILD_GUIDE.md)** - Complete setup guide
- **[MIGRATIONS.md](MIGRATIONS.md)** - Database migration guide
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide

## Database Migrations

This project uses **Supabase CLI** for all database migrations. 

- ✅ All migrations are in `supabase/migrations/`
- ✅ Baseline migration: `000_baseline.sql` (DO NOT MODIFY)
- ✅ Use `npx supabase db push` to apply migrations
- ✅ See [MIGRATIONS.md](MIGRATIONS.md) for complete guide

**Important:** Never modify the baseline migration. Create new numbered migrations for all schema changes.

## Tech Stack

- **Framework:** Next.js 16.1.1
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
