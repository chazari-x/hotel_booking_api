-- Таблица для хранения информации о клиентах
CREATE TABLE clients
(
    id         SERIAL PRIMARY KEY,
    full_name  VARCHAR(255)        NOT NULL, -- полное имя клиента
    email      VARCHAR(255) UNIQUE NOT NULL, -- уникальный email клиента
    phone      VARCHAR(20),                  -- телефон клиента
    is_vip     BOOLEAN   DEFAULT FALSE,      -- флаг VIP клиента
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для хранения информации о комнатах
CREATE TABLE rooms
(
    id              SERIAL PRIMARY KEY,
    number          VARCHAR(10) UNIQUE NOT NULL, -- номер комнаты, например: '101', '102A'
    type            VARCHAR(50),                 -- например: 'standard', 'suite'
    capacity        INT,                         -- количество мест в комнате
    price_per_night DECIMAL(10, 2),              -- цена за ночь
    description     TEXT                         -- описание комнаты
);

-- Перечисление для статусов бронирования
CREATE TYPE booking_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'TERMINATED',
    'CANCELLED_CONFIRMED'
    );

-- Таблица для хранения бронирований
CREATE TABLE bookings
(
    id           SERIAL PRIMARY KEY,
    room_id      INT REFERENCES rooms (id),

    client_id    INT            NOT NULL,
    client_name  VARCHAR(255)   NOT NULL,
    client_email VARCHAR(255)   NOT NULL,
    client_phone VARCHAR(20),
    is_vip       BOOLEAN   DEFAULT FALSE,

    start_date   DATE           NOT NULL, -- дата начала бронирования
    end_date     DATE           NOT NULL, -- дата окончания бронирования
    status       booking_status NOT NULL, -- статус бронирования

    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Клиенты
INSERT INTO clients (full_name, email, phone, is_vip)
VALUES ('Иван Иванов', 'ivan@example.com', '1234567890', false),
       ('Петр Петров', 'petr@example.com', '0987654321', true),
       ('Анна Смирнова', 'anna@example.com', '5551234567', false),
       ('Мария Кузнецова', 'maria@example.com', '4449998888', true),
       ('Сергей Морозов', 'sergey@example.com', '7776665555', false);

-- Комнаты
INSERT INTO rooms (number, type, capacity, price_per_night, description)
VALUES ('101', 'standard', 2, 1200.00, 'Стандартный номер'),
       ('102', 'standard', 2, 1300.00, 'Номер с балконом'),
       ('201', 'suite', 4, 2500.00, 'Люкс с видом на город'),
       ('202', 'suite', 3, 2200.00, 'Угловой люкс'),
       ('301', 'deluxe', 5, 3000.00, 'Делюкс для семьи');

-- Бронирования
INSERT INTO bookings (client_id, room_id, client_name, client_email, client_phone, start_date, end_date, status, is_vip)
VALUES (1, 1, 'Иван Иванов', 'ivan@example.com', '1234567890', '2025-07-01', '2025-07-05', 'PENDING', false),
       (2, 2, 'Петр Петров', 'petr@example.com', '0987654321', '2025-07-10', '2025-07-15', 'CONFIRMED', true),
       (3, 3, 'Анна Смирнова', 'anna@example.com', '5551234567', '2025-07-01', '2025-07-03', 'CANCELLED', false),
       (4, 4, 'Мария Кузнецова', 'maria@example.com', '4449998888', '2025-07-05', '2025-07-08', 'CANCELLED_CONFIRMED',
        true),
       (5, 5, 'Сергей Морозов', 'sergey@example.com', '7776665555', '2025-06-01', '2025-06-10', 'TERMINATED', false),
       (1, 2, 'Иван Иванов', 'ivan@example.com', '1234567890', '2025-07-20', '2025-07-25', 'CONFIRMED', false);
