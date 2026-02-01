-- Create trigger to auto-create user profile when auth user is created
-- The handle_new_user() function already exists in baseline migration
-- This trigger will fire after a new user is inserted into auth.users

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- The trigger will:
-- 1. Extract full_name or name from raw_user_meta_data
-- 2. Create user profile in public.users table
-- 3. Assign default 'USER' role via user_roles table
-- 4. Set is_email_verified based on email_confirmed_at




