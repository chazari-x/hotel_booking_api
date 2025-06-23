# REST API для бронирования номеров в отеле

- Клиент может увидеть список номеров в отеле
- Клиент может увидеть список свободных номеров в отеле на определенный период времени
- Клиент может забронировать номер в отеле на определенный срок
- Клиент может отменить бронь номера в отеле
- Клиент может быть VIP а может и не быть (запрос удаленного api сервера для проверки) Необходимо фиксировать информацию в бронь
  - Сейчас запросы идут на `/clients/:id`, а полученные данные копируются в бронь
  - Никакой связи бронирования с клиентом нет, хранятся только данные клиента на момент бронирования
- 2 клиента не могут одновременно забронировать один и тот же номер в отеле на пересекающиеся периоды

---

## Инструкция по запуску проекта

---

### Вариант 1. Запуск без Docker

#### 1. Клонируйте репозиторий и установите зависимости

```bash
git clone https://github.com/chazari-x/hotel_booking_api.git
cd hotel_booking_api
npm install
```

#### 2. Создайте базу данных PostgreSQL

Запустите PostgreSQL (если ещё не запущена) и создайте базу:

```bash
createdb hotel_booking
```

#### 3. Инициализируйте базу данных

Выполните SQL-скрипт `init.sql` (находится в корне проекта):

```bash
psql -U postgres -d hotel_booking -f init.sql
```

#### 4. Создайте файл `.env` с параметрами подключения

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hotel_booking
PORT=3000
```

#### 5. Запустите сервер

- Для разработки (с авто-перезагрузкой):

```bash
npm run dev
```

- Для продакшн:

```bash
npm start
```

---

### Вариант 2. Запуск с Docker и Docker Compose

#### 1. Убедитесь, что установлен Docker и Docker Compose

#### 2. Создайте `.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hotel_booking
PORT=3000
CLIENTS_API_URL=http://localhost:3000/clients
```

#### 3. Запустите контейнеры

```bash
docker-compose up --build
```

---

# Документация API

## Клиенты

- Считается внешним API для получения данных о клиентах при бронировании

### `GET /clients`

- **Описание:** Получить список всех клиентов
- **Ответ:**

```json
[
  {
    "id": 1,
    "full_name": "Иван Иванов",
    "email": "ivan@example.com",
    "phone": "1234567890",
    "is_vip": false,
    "created_at": "2025-06-01T10:00:00Z"
  }
]
```

---

### `GET /clients/:id`

- **Описание:** Получить одного клиента по ID
- **Параметры URL:** `id` – числовой идентификатор
- **Ответ:**

```json
{
  "full_name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "1234567890",
  "is_vip": false,
  "created_at": "2025-06-01T10:00:00Z"
}
```

---

### `POST /clients`

- **Описание:** Создать нового клиента
- **Тело запроса:**

```json
{
  "full_name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "1234567890"
}
```

- **Ответ:**

```json
{
  "id": 1,
  "full_name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "1234567890",
  "is_vip": false,
  "created_at": "2025-06-01T10:00:00Z"
}
```

---

### `PUT /clients/:id`

- **Описание:** Обновить клиента. Указывать только те поля, которые нужно изменить.
- **Параметры URL:** `id` – числовой идентификатор
- **Тело запроса:**

```json
{
  "full_name": "Антон Иванов"
}
```

- **Ответ:**

```json
{
  "id": 1,
  "full_name": "Антон Иванов",
  "email": "ivan@example.com",
  "phone": "1234567890",
  "is_vip": false,
  "created_at": "2025-06-01T10:00:00Z"
}
```

---

### `DELETE /clients/:id`

- **Описание:** Удалить клиента
- **Параметры URL:** `id` – числовой идентификатор
- **Ответ:** `204 No Content`

---

## Номера

### `GET /rooms`

- **Описание:** Получить список всех номеров
- **Ответ:**

```json
[
  {
    "id": 1,
    "number": "101",
    "type": "standard",
    "capacity": 2,
    "price_per_night": 1200.0,
    "description": "Стандартный номер"
  }
]
```

---

### `GET /rooms/:id`

- **Описание:** Получить один номер по ID
- **Параметры URL:** `id` – числовой идентификатор
- **Ответ:**

```json
{
  "id": 1,
  "number": "101",
  "type": "standard",
  "capacity": 2,
  "price_per_night": 1200.0,
  "description": "Стандартный номер"
}
```

---

### `GET /rooms/available?start_date=2025-07-07&end_date=2025-07-12`

- **Описание:** Получить номера, свободные в указанный период
- **Параметры URL:**
  - `start` — дата начала
  - `end` — дата окончания
- **Ответ:**

```json
[
  {
    "id": 1,
    "number": "101",
    "type": "standard",
    "capacity": 2,
    "price_per_night": 1200.0,
    "description": "Стандартный номер"
  }
]
```

---

### `POST /rooms`

- **Описание:** Создать новый номер
- **Тело запроса:**

```json
{
  "number": "102",
  "type": "suite",
  "capacity": 4,
  "price_per_night": 2000,
  "description": "Люкс с видом"
}
```

- **Ответ:**

```json
{
  "id": 1,
  "number": "102",
  "type": "suite",
  "capacity": 4,
  "price_per_night": 2000,
  "description": "Люкс с видом"
}
```

---

### `PUT /rooms/:id`

- **Описание:** Обновить информацию о номере
- **Параметры URL:** `id` – числовой идентификатор
- **Тело запроса:**

```json
{
  "number": "102",
  "type": "suite",
  "capacity": 4,
  "price_per_night": 2000,
  "description": "Люкс с видом"
}
```

- **Ответ:**

```json
{
  "id": 1,
  "number": "102",
  "type": "suite",
  "capacity": 4,
  "price_per_night": 2000,
  "description": "Люкс с видом"
}
```

---

### `DELETE /rooms/:id`

- **Описание:** Удалить номер
- **Параметры URL:** `id` – числовой идентификатор
- **Ответ:** `204 No Content`

---

## Бронирования

### `GET /bookings`

- **Описание:** Получить список всех бронирований
- **Ответ:**

```json
[
  {
    "id": 1,
    "client_id": 1,
    "room_id": 1,
    "client_name": "Иван Иванов",
    "client_email": "ivan@example.com",
    "client_phone": "1234567890",
    "is_vip": false,
    "start_date": "2025-06-30T18:00:00.000Z",
    "end_date": "2025-07-04T18:00:00.000Z",
    "status": "PENDING",
    "created_at": "2025-06-23T06:00:45.740Z",
    "updated_at": "2025-06-23T06:00:45.740Z"
  }
]
```

---

### `GET /bookings/:id`

- **Описание:** Получить одно бронирование по ID
- **Параметры URL:** `id` – числовой идентификатор
- **Ответ:**

```json
{
  "id": 1,
  "client_id": 1,
  "room_id": 2,
  "client_name": "Иван Иванов",
  "client_email": "ivan@example.com",
  "client_phone": "1234567890",
  "start_date": "2025-07-01",
  "end_date": "2025-07-05",
  "status": "PENDING",
  "is_vip": false,
  "created_at": "2025-06-23T12:00:00Z",
  "updated_at": "2025-06-23T12:00:00Z"
}
```

---

### `POST /bookings`

- **Описание:** Создать новое бронирование
- **Тело запроса:**

```json
{
  "client_id": 1,
  "room_id": 2,
  "start_date": "2025-07-01",
  "end_date": "2025-07-05"
}
```

- **Валидации**:
  - Проверка на пересечение по дате
  - Получение данные клиента по client_id из внешнего API (сейчас запросы идут на /clients/:id)
  - Копирование данных клиента на момент брони из внешнего API в бронь
- **Ответ:**

```json
{
  "id": 1,
  "client_id": 1,
  "room_id": 2,
  "client_name": "Иван Иванов",
  "client_email": "ivan@example.com",
  "client_phone": "1234567890",
  "start_date": "2025-07-01",
  "end_date": "2025-07-05",
  "status": "PENDING",
  "is_vip": false,
  "created_at": "2025-06-23T12:00:00Z",
  "updated_at": "2025-06-23T12:00:00Z"
}
```

---

### `PUT /bookings/:id`

- **Описание:** Обновить бронирование (например, даты или статус)
- **Параметры URL:** `id` – числовой идентификатор
- **Тело запроса:**

```json
{
  "start_date": "2025-07-03",
  "end_date": "2025-07-06",
  "status": "CONFIRMED"
}
```

- **Ответ:**

```json
{
  "id": 1,
  "client_id": 1,
  "room_id": 2,
  "client_name": "Иван Иванов",
  "client_email": "ivan@example.com",
  "client_phone": "1234567890",
  "start_date": "2025-07-03",
  "end_date": "2025-07-06",
  "status": "CONFIRMED",
  "is_vip": false,
  "created_at": "2025-06-23T12:00:00Z",
  "updated_at": "2025-06-23T12:00:00Z"
}
```

---

### `DELETE /bookings/:id`

- **Описание:** Отменить бронирование
  - Меняет статус:
    - `CONFIRMED` → `CANCELLED_CONFIRMED`
    - Остальные → `CANCELLED`
- **Параметры URL:** `id` – числовой идентификатор
- **Ответ:**

```json
{
  "id": 6,
  "client_id": 1,
  "room_id": 2,
  "client_name": "Иван Иванов",
  "client_email": "ivan@example.com",
  "client_phone": "1234567890",
  "is_vip": false,
  "start_date": "2025-07-19T18:00:00.000Z",
  "end_date": "2025-07-24T18:00:00.000Z",
  "status": "CANCELLED_CONFIRMED",
  "created_at": "2025-06-23T06:00:45.740Z",
  "updated_at": "2025-06-23T08:03:33.645Z"
}
```

---

## Статусы бронирований:

| Статус                | Значение                     |
| --------------------- | ---------------------------- |
| `PENDING`             | Предварительное бронирование |
| `CONFIRMED`           | Подтверждённое (активное)    |
| `CANCELLED`           | Отменено до начала           |
| `CANCELLED_CONFIRMED` | Отменено после подтверждения |
| `TERMINATED`          | Завершено (выполнено)        |
