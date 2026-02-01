-- Allow service role to insert users (for OTP-based registration)
-- Service role bypasses RLS, but we add this policy for explicit clarity
-- and to handle cases where service role might not fully bypass

-- Policy to allow service role/system to insert users
CREATE POLICY "Service role can insert users"
  ON "public"."users"
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow service role/system to insert user_roles
CREATE POLICY "Service role can insert user_roles"
  ON "public"."user_roles"
  FOR INSERT
  WITH CHECK (true);

