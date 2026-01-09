-- =====================================================
-- BASELINE MIGRATION - DO NOT MODIFY
-- =====================================================
-- 
-- ⚠️  WARNING: This migration represents the current production schema baseline.
-- 
-- This migration is marked as already applied in production and will NOT execute
-- on existing databases. It serves as the starting point for all future migrations.
-- 
-- DO NOT:
--   - Modify this file
--   - Remove or rename this file
--   - Add new schema changes to this file
-- 
-- DO:
--   - Create new numbered migrations (001_*.sql, 002_*.sql, etc.) for schema changes
--   - Use ALTER TABLE, CREATE INDEX, ADD CONSTRAINT for future changes
--   - Use IF NOT EXISTS where applicable
-- 
-- Generated from production schema using: supabase db dump --schema public
-- Date: $(date +%Y-%m-%d)
-- 
-- =====================================================




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."coupon_type" AS ENUM (
    'flat',
    'percent'
);


ALTER TYPE "public"."coupon_type" OWNER TO "postgres";


CREATE TYPE "public"."migration_status" AS ENUM (
    'success',
    'failed',
    'partial'
);


ALTER TYPE "public"."migration_status" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'paid',
    'shipped',
    'delivered',
    'cancelled'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."product_status" AS ENUM (
    'draft',
    'live'
);


ALTER TYPE "public"."product_status" OWNER TO "postgres";


CREATE TYPE "public"."role_type" AS ENUM (
    'USER',
    'ADMIN',
    'OPS'
);


ALTER TYPE "public"."role_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'pending',
    'success',
    'failed',
    'refunded'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."commit_inventory"("p_variant_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE inventory
    SET 
        stock = stock - p_quantity,
        reserved_stock = GREATEST(0, reserved_stock - p_quantity)
    WHERE variant_id = p_variant_id;
END;
$$;


ALTER FUNCTION "public"."commit_inventory"("p_variant_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || 
                       LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id AND r.name IN ('ADMIN', 'OPS')
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_reserved_inventory"("p_variant_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE inventory
    SET reserved_stock = GREATEST(0, reserved_stock - p_quantity)
    WHERE variant_id = p_variant_id;
END;
$$;


ALTER FUNCTION "public"."release_reserved_inventory"("p_variant_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reserve_inventory"("p_variant_id" "uuid", "p_quantity" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_stock INT;
    v_reserved INT;
    v_available INT;
BEGIN
    -- Lock the row
    SELECT stock, reserved_stock INTO v_stock, v_reserved
    FROM inventory
    WHERE variant_id = p_variant_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    v_available := v_stock - v_reserved;
    
    IF v_available < p_quantity THEN
        RETURN FALSE;
    END IF;
    
    UPDATE inventory
    SET reserved_stock = reserved_stock + p_quantity
    WHERE variant_id = p_variant_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."reserve_inventory"("p_variant_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "street" character varying(255) NOT NULL,
    "city" character varying(100) NOT NULL,
    "state" character varying(100) NOT NULL,
    "zip" character varying(20) NOT NULL,
    "country" character varying(100) NOT NULL,
    "is_default" boolean DEFAULT false
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "actor_id" "uuid",
    "entity" character varying(100) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" character varying(50) NOT NULL,
    "old_value" "jsonb",
    "new_value" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "user_id" "uuid" NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "cart_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "type" "public"."coupon_type" NOT NULL,
    "value" numeric(10,2) NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "variant_id" "uuid" NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "reserved_stock" integer DEFAULT 0 NOT NULL,
    "low_stock_threshold" integer DEFAULT 5 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "sku" character varying(100) NOT NULL,
    "color" character varying(100) NOT NULL,
    "size" character varying(20) NOT NULL,
    "price_override" numeric(10,2),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "base_price" numeric(10,2) NOT NULL,
    "status" "public"."product_status" DEFAULT 'live'::"public"."product_status",
    "featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."inventory_status" AS
 SELECT "i"."variant_id",
    "i"."stock",
    "i"."reserved_stock",
    "i"."low_stock_threshold",
    "i"."updated_at",
    "pv"."product_id",
    "pv"."sku",
    "pv"."color",
    "pv"."size",
    "pr"."name" AS "product_name",
    ("i"."stock" - "i"."reserved_stock") AS "available_stock",
        CASE
            WHEN ("i"."stock" = 0) THEN 'out_of_stock'::"text"
            WHEN (("i"."stock" - "i"."reserved_stock") <= "i"."low_stock_threshold") THEN 'low_stock'::"text"
            ELSE 'in_stock'::"text"
        END AS "status"
   FROM (("public"."inventory" "i"
     JOIN "public"."product_variants" "pv" ON (("pv"."id" = "i"."variant_id")))
     JOIN "public"."products" "pr" ON (("pr"."id" = "pv"."product_id")));


ALTER VIEW "public"."inventory_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_coupons" (
    "order_id" "uuid" NOT NULL,
    "coupon_id" "uuid" NOT NULL
);


ALTER TABLE "public"."order_coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "product_name_snapshot" character varying(255) NOT NULL,
    "sku_snapshot" character varying(100) NOT NULL,
    "price_snapshot" numeric(10,2) NOT NULL,
    "quantity" integer NOT NULL,
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_status_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" "public"."order_status" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."order_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_number" character varying(50) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status",
    "subtotal" numeric(10,2) NOT NULL,
    "tax" numeric(10,2) DEFAULT 0.00,
    "shipping" numeric(10,2) DEFAULT 0.00,
    "total" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "gateway" character varying(50) NOT NULL,
    "gateway_txn_id" character varying(255),
    "raw_response" "jsonb",
    "status" "public"."transaction_status" DEFAULT 'pending'::"public"."transaction_status",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "method" character varying(50) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "product_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."products_with_ratings" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::character varying(255) AS "name",
    NULL::"text" AS "description",
    NULL::numeric(10,2) AS "base_price",
    NULL::"public"."product_status" AS "status",
    NULL::boolean AS "featured",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::numeric AS "avg_rating",
    NULL::bigint AS "review_count";


ALTER VIEW "public"."products_with_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "public"."role_type" NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schema_migrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "migration_name" character varying(255) NOT NULL,
    "executed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "executed_by" character varying(255),
    "execution_time_ms" integer,
    "status" "public"."migration_status" DEFAULT 'success'::"public"."migration_status",
    "error_message" "text",
    "sql_content" "text"
);


ALTER TABLE "public"."schema_migrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."schema_migrations" IS 'Tracks executed database migrations to prevent duplicate execution';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(255),
    "phone" character varying(20),
    "is_phone_verified" boolean DEFAULT false,
    "is_email_verified" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."variant_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "image_url" character varying(500) NOT NULL,
    "display_order" integer DEFAULT 0
);


ALTER TABLE "public"."variant_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist" (
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL
);


ALTER TABLE "public"."wishlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("user_id", "variant_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("variant_id");



ALTER TABLE ONLY "public"."order_coupons"
    ADD CONSTRAINT "order_coupons_pkey" PRIMARY KEY ("order_id", "coupon_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id", "category_id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_color_size_key" UNIQUE ("product_id", "color", "size");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_product_id_user_id_key" UNIQUE ("product_id", "user_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_migration_name_key" UNIQUE ("migration_name");



ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."variant_images"
    ADD CONSTRAINT "variant_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_pkey" PRIMARY KEY ("user_id", "product_id");



CREATE INDEX "idx_addresses_is_default" ON "public"."addresses" USING "btree" ("is_default");



CREATE INDEX "idx_addresses_user_id" ON "public"."addresses" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_actor_id" ON "public"."audit_logs" USING "btree" ("actor_id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_entity_entity_id" ON "public"."audit_logs" USING "btree" ("entity", "entity_id");



CREATE INDEX "idx_cart_items_user_id" ON "public"."cart_items" USING "btree" ("user_id");



CREATE INDEX "idx_categories_name" ON "public"."categories" USING "btree" ("name");



CREATE INDEX "idx_categories_parent_id" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_coupons_code" ON "public"."coupons" USING "btree" ("code");



CREATE INDEX "idx_coupons_expires_at" ON "public"."coupons" USING "btree" ("expires_at");



CREATE INDEX "idx_order_coupons_coupon_id" ON "public"."order_coupons" USING "btree" ("coupon_id");



CREATE INDEX "idx_order_coupons_order_id" ON "public"."order_coupons" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_status_history_changed_at" ON "public"."order_status_history" USING "btree" ("changed_at");



CREATE INDEX "idx_order_status_history_order_id" ON "public"."order_status_history" USING "btree" ("order_id");



CREATE INDEX "idx_orders_order_number" ON "public"."orders" USING "btree" ("order_number");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_user_id_created_at" ON "public"."orders" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_payment_transactions_gateway_txn_id" ON "public"."payment_transactions" USING "btree" ("gateway_txn_id");



CREATE INDEX "idx_payment_transactions_payment_id" ON "public"."payment_transactions" USING "btree" ("payment_id");



CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_product_categories_category_id" ON "public"."product_categories" USING "btree" ("category_id");



CREATE INDEX "idx_product_categories_product_id" ON "public"."product_categories" USING "btree" ("product_id");



CREATE INDEX "idx_product_variants_is_active" ON "public"."product_variants" USING "btree" ("is_active");



CREATE INDEX "idx_product_variants_product_id" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "idx_product_variants_sku" ON "public"."product_variants" USING "btree" ("sku");



CREATE INDEX "idx_products_featured" ON "public"."products" USING "btree" ("featured");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");



CREATE INDEX "idx_reviews_product_id" ON "public"."reviews" USING "btree" ("product_id");



CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_roles_name" ON "public"."roles" USING "btree" ("name");



CREATE INDEX "idx_schema_migrations_executed_at" ON "public"."schema_migrations" USING "btree" ("executed_at");



CREATE INDEX "idx_schema_migrations_name" ON "public"."schema_migrations" USING "btree" ("migration_name");



CREATE INDEX "idx_schema_migrations_status" ON "public"."schema_migrations" USING "btree" ("status");



CREATE INDEX "idx_user_roles_role_id" ON "public"."user_roles" USING "btree" ("role_id");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_phone" ON "public"."users" USING "btree" ("phone");



CREATE INDEX "idx_variant_images_display_order" ON "public"."variant_images" USING "btree" ("display_order");



CREATE INDEX "idx_variant_images_variant_id" ON "public"."variant_images" USING "btree" ("variant_id");



CREATE INDEX "idx_wishlist_product_id" ON "public"."wishlist" USING "btree" ("product_id");



CREATE INDEX "idx_wishlist_user_id" ON "public"."wishlist" USING "btree" ("user_id");



CREATE OR REPLACE VIEW "public"."products_with_ratings" AS
 SELECT "p"."id",
    "p"."name",
    "p"."description",
    "p"."base_price",
    "p"."status",
    "p"."featured",
    "p"."created_at",
    "p"."updated_at",
    COALESCE("avg"("r"."rating"), (0)::numeric) AS "avg_rating",
    "count"("r"."id") AS "review_count"
   FROM ("public"."products" "p"
     LEFT JOIN "public"."reviews" "r" ON (("r"."product_id" = "p"."id")))
  GROUP BY "p"."id";



CREATE OR REPLACE TRIGGER "set_order_number" BEFORE INSERT ON "public"."orders" FOR EACH ROW WHEN ((("new"."order_number" IS NULL) OR (("new"."order_number")::"text" = ''::"text"))) EXECUTE FUNCTION "public"."generate_order_number"();



CREATE OR REPLACE TRIGGER "update_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_inventory_updated_at" BEFORE UPDATE ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_coupons"
    ADD CONSTRAINT "order_coupons_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_coupons"
    ADD CONSTRAINT "order_coupons_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."variant_images"
    ADD CONSTRAINT "variant_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all reviews" ON "public"."reviews" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage all roles" ON "public"."user_roles" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage categories" ON "public"."categories" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage coupons" ON "public"."coupons" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage inventory" ON "public"."inventory" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage order coupons" ON "public"."order_coupons" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage order items" ON "public"."order_items" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage order status history" ON "public"."order_status_history" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage orders" ON "public"."orders" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage payment transactions" ON "public"."payment_transactions" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage payments" ON "public"."payments" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage product categories" ON "public"."product_categories" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage products" ON "public"."products" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage variant images" ON "public"."variant_images" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can manage variants" ON "public"."product_variants" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can update all users" ON "public"."users" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all orders" ON "public"."orders" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all products" ON "public"."products" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all users" ON "public"."users" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view all variants" ON "public"."product_variants" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Admins can view audit logs" ON "public"."audit_logs" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Anyone can view active variants" ON "public"."product_variants" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view inventory" ON "public"."inventory" FOR SELECT USING (true);



CREATE POLICY "Anyone can view live products" ON "public"."products" FOR SELECT USING (("status" = 'live'::"public"."product_status"));



CREATE POLICY "Anyone can view product categories" ON "public"."product_categories" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Anyone can view valid coupons" ON "public"."coupons" FOR SELECT USING ((("expires_at" IS NULL) OR ("expires_at" > CURRENT_TIMESTAMP)));



CREATE POLICY "Anyone can view variant images" ON "public"."variant_images" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "System can create audit logs" ON "public"."audit_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create own orders" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own reviews" ON "public"."reviews" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own addresses" ON "public"."addresses" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own cart" ON "public"."cart_items" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own wishlist" ON "public"."wishlist" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own reviews" ON "public"."reviews" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own addresses" ON "public"."addresses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own cart" ON "public"."cart_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own order coupons" ON "public"."order_coupons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_coupons"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own order history" ON "public"."order_status_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_status_history"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own payments" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "payments"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own transactions" ON "public"."payment_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."payments" "p"
     JOIN "public"."orders" "o" ON (("o"."id" = "p"."order_id")))
  WHERE (("p"."id" = "payment_transactions"."payment_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own wishlist" ON "public"."wishlist" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."variant_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlist" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."commit_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."commit_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."commit_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."release_reserved_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."release_reserved_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_reserved_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_inventory"("p_variant_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_status" TO "anon";
GRANT ALL ON TABLE "public"."inventory_status" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_status" TO "service_role";



GRANT ALL ON TABLE "public"."order_coupons" TO "anon";
GRANT ALL ON TABLE "public"."order_coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."order_coupons" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_status_history" TO "anon";
GRANT ALL ON TABLE "public"."order_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "anon";
GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON TABLE "public"."products_with_ratings" TO "anon";
GRANT ALL ON TABLE "public"."products_with_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."products_with_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."schema_migrations" TO "anon";
GRANT ALL ON TABLE "public"."schema_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."variant_images" TO "anon";
GRANT ALL ON TABLE "public"."variant_images" TO "authenticated";
GRANT ALL ON TABLE "public"."variant_images" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist" TO "anon";
GRANT ALL ON TABLE "public"."wishlist" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







