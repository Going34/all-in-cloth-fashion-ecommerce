-- =====================================================
-- Migration Tracking Table
-- This table tracks which migrations have been executed
-- =====================================================

-- Create migration status enum (if not exists)
DO $$ BEGIN
    CREATE TYPE migration_status AS ENUM ('success', 'failed', 'partial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create schema_migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    executed_by VARCHAR(255),
    execution_time_ms INTEGER,
    status migration_status DEFAULT 'success',
    error_message TEXT,
    sql_content TEXT
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON schema_migrations(migration_name);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_status ON schema_migrations(status);

-- Add comment
COMMENT ON TABLE schema_migrations IS 'Tracks executed database migrations to prevent duplicate execution';


