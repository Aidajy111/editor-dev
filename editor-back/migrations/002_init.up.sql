-- 1. Удали старые таблицы если они есть (данные потеряются, но они пустые)
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS phone_models CASCADE;
DROP TABLE IF EXISTS brand CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Создай таблицы заново с правильными типами
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