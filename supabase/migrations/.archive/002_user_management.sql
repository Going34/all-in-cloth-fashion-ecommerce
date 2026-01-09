-- =====================================================
-- User Management Tables
-- =====================================================

-- TABLE: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- TABLE: roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name role_type UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Insert default roles (if not exist)
INSERT INTO roles (name) VALUES ('USER'), ('ADMIN'), ('OPS')
ON CONFLICT (name) DO NOTHING;

-- TABLE: user_roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- FUNCTION: Create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_id UUID;
    user_name VARCHAR(255);
BEGIN
    -- Extract name from raw_user_meta_data if available
    user_name := NEW.raw_user_meta_data->>'full_name';
    IF user_name IS NULL THEN
        user_name := NEW.raw_user_meta_data->>'name';
    END IF;
    
    -- Create user profile
    INSERT INTO public.users (id, email, name, is_email_verified)
    VALUES (NEW.id, NEW.email, user_name, NEW.email_confirmed_at IS NOT NULL);
    
    -- Get USER role id
    SELECT id INTO user_role_id FROM roles WHERE name = 'USER';
    
    -- Assign default USER role
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, user_role_id);
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


