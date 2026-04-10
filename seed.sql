-- Extensión necesaria para UUIDs (si no existe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enumeraciones
CREATE TYPE "currency_type_enum" AS ENUM ('FIAT', 'CRYPTO');

CREATE TYPE "transaction_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- Tabla: User
CREATE TABLE "user" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
    "name" character varying NOT NULL,
    "email" character varying NOT NULL,
    "password" character varying NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now (),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now (),
    CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_user_email" UNIQUE ("email")
);

-- Tabla: Currency
CREATE TABLE "currency" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
    "code" character varying NOT NULL,
    "type" "currency_type_enum" NOT NULL,
    "precision" integer NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now (),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now (),
    CONSTRAINT "PK_currency_id" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_currency_code" UNIQUE ("code")
);

-- Tabla: Account
CREATE TABLE "account" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
    "balance" numeric(12, 2) NOT NULL DEFAULT 0,
    "frozenBalance" numeric(12, 2) NOT NULL DEFAULT 0,
    "currency_id" uuid NOT NULL,
    "address" character varying,
    "user_id" uuid NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now (),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now (),
    CONSTRAINT "PK_account_id" PRIMARY KEY ("id"),
    CONSTRAINT "UQ_account_address" UNIQUE ("address"),
    CONSTRAINT "FK_account_currency" FOREIGN KEY ("currency_id") REFERENCES "currency" ("id") ON DELETE CASCADE,
    CONSTRAINT "FK_account_user" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
);

-- Tabla: Transaction
CREATE TABLE "transaction" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
    "amount" numeric(10, 2) NOT NULL,
    "status" "transaction_status_enum" NOT NULL DEFAULT 'PENDING',
    "user_id" uuid NOT NULL,
    "origin_address" character varying NOT NULL,
    "destination_address" character varying NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT now (),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now (),
    CONSTRAINT "PK_transaction_id" PRIMARY KEY ("id"),
    CONSTRAINT "FK_transaction_user" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE
);

-- Creamos monedas constantes
INSERT INTO
    "currency" (
        id,
        code,
        "type",
        precision,
        "createdAt",
        "updatedAt"
    )
VALUES
    (
        '11111111-aaaa-bbbb-cccc-111111111111',
        'ARS',
        'FIAT',
        2,
        NOW (),
        NOW ()
    ),
    (
        '22222222-aaaa-bbbb-cccc-222222222222',
        'BTC',
        'CRYPTO',
        8,
        NOW (),
        NOW ()
    ) ON CONFLICT (code) DO NOTHING;

-- Insertar Usuario 1 y Usuario 2
INSERT INTO
    "user" (
        id,
        name,
        email,
        password,
        "createdAt",
        "updatedAt"
    )
VALUES
    (
        '33333333-aaaa-bbbb-cccc-333333333333',
        'Juan Perez',
        'juan@test.com',
        '$2a$12$QFWpIrB6HaXT7ECuKL7MFunikV97kq/hoAOhCbKT8JTkdkIJwaMo.',
        NOW (),
        NOW ()
    ),
    (
        '44444444-aaaa-bbbb-cccc-444444444444',
        'Maria Lopez',
        'maria@test.com',
        '$2a$12$QFWpIrB6HaXT7ECuKL7MFunikV97kq/hoAOhCbKT8JTkdkIJwaMo.',
        NOW (),
        NOW ()
    ) ON CONFLICT (email) DO NOTHING;

-- Insertar Cuentas para JUÁN PEREZ 
INSERT INTO
    "account" (
        id,
        balance,
        currency_id,
        address,
        user_id,
        "createdAt",
        "updatedAt"
    )
VALUES
    (
        '55555555-aaaa-bbbb-cccc-555555555555',
        50000.00,
        '11111111-aaaa-bbbb-cccc-111111111111',
        'CVU-JUAN-ARS-1234',
        '33333333-aaaa-bbbb-cccc-333333333333',
        NOW (),
        NOW ()
    ),
    (
        '66666666-aaaa-bbbb-cccc-666666666666',
        0.15000000,
        '22222222-aaaa-bbbb-cccc-222222222222',
        'bc1q-juan-btc-address',
        '33333333-aaaa-bbbb-cccc-333333333333',
        NOW (),
        NOW ()
    );

-- Insertar Cuentas para MARÍA LOPEZ 
INSERT INTO
    "account" (
        id,
        balance,
        currency_id,
        address,
        user_id,
        "createdAt",
        "updatedAt"
    )
VALUES
    (
        '77777777-aaaa-bbbb-cccc-777777777777',
        125000.50,
        '11111111-aaaa-bbbb-cccc-111111111111',
        'CVU-MARIA-ARS-9876',
        '44444444-aaaa-bbbb-cccc-444444444444',
        NOW (),
        NOW ()
    ),
    (
        '88888888-aaaa-bbbb-cccc-888888888888',
        2.50000000,
        '22222222-aaaa-bbbb-cccc-222222222222',
        'bc1q-maria-btc-address',
        '44444444-aaaa-bbbb-cccc-444444444444',
        NOW (),
        NOW ()
    );