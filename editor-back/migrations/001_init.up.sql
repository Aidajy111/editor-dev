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