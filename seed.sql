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
        '$2b$10$EP0M/V4K6A.6.l75wRO6eONJOWbStR/VqC3K/G/uK0.UOhsItiB5i',
        NOW (),
        NOW ()
    ),
    (
        '44444444-aaaa-bbbb-cccc-444444444444',
        'Maria Lopez',
        'maria@test.com',
        '$2b$10$EP0M/V4K6A.6.l75wRO6eONJOWbStR/VqC3K/G/uK0.UOhsItiB5i',
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