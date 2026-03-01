CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand (
    id BIGINT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phone_models (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    brand_id BIGINT NOT NULL,
    model_name TEXT NOT NULL,
    image TEXT NOT NULL,
    camera TEXT NOT NULL,
    edges TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (brand_id) REFERENCES brand(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cases (
    id BIGINT PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    phone_model_id BIGINT NOT NULL,
    status  TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
    admin_comment  TEXT,
    preview_url    TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- UUID с авто-генерацией
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE brand (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE phone_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL,
    model_name TEXT NOT NULL,
    image TEXT NOT NULL,
    camera TEXT NOT NULL,
    edges TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (brand_id) REFERENCES brand(id) ON DELETE CASCADE
);

CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    phone_model_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_comment TEXT,
    preview_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (phone_model_id) REFERENCES phone_models(id) ON DELETE CASCADE
);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,
    customer_comment text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'new',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    model_id int NOT NULL,
    phone_model_name text NOT NULL,
    design_json jsonb NOT NULL,
    preview_key text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_assets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    asset_id text NOT NULL,
    storage_key text NOT NULL,
    mime text NOT NULL,
    size_bytes bigint NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_assets_order_item_id ON order_assets(order_item_id);