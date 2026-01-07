BEGIN TRANSACTION;

--------------------------------------------------
-- USERS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
    "user_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "secret" TEXT
);

--------------------------------------------------
-- SERVICES
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "services" (
    "service_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL UNIQUE,
    "global_value" INTEGER NOT NULL
);

INSERT INTO "services" ("name","global_value") VALUES
('computation', 6),
('storage', 100),
('data_transfer', 10);

--------------------------------------------------
-- COMPUTATION SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "computation" (
    "service_id" INTEGER NOT NULL,
    "ram_gb" INTEGER PRIMARY KEY,
    "price_per_month" INTEGER,
    "min_storage_tb" INTEGER,
    FOREIGN KEY ("service_id")
        REFERENCES "services"("service_id")
        ON DELETE CASCADE
);

INSERT INTO "computation" ("service_id","ram_gb","price_per_month","min_storage_tb") VALUES
(1, 16, 10, 10),
(1, 32, 20, 20),
(1, 128, 40, NULL);

--------------------------------------------------
-- STORAGE SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "storage" (
    "service_id" INTEGER NOT NULL,
    "price_eur_per_tb_per_month" INTEGER NOT NULL,
    FOREIGN KEY ("service_id")
        REFERENCES "services"("service_id")
        ON DELETE CASCADE
);

INSERT INTO "storage" ("service_id","price_eur_per_tb_per_month")
VALUES (2, 10);

--------------------------------------------------
-- DATA TRANSFER SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "datatransfer" (
    "service_id" INTEGER NOT NULL,
    "min_gb" INTEGER NOT NULL,
    "max_gb" INTEGER,
    "price_per_gb" REAL NOT NULL,
    FOREIGN KEY ("service_id")
        REFERENCES "services"("service_id")
        ON DELETE CASCADE
);

INSERT INTO "datatransfer" ("service_id","min_gb","max_gb","price_per_gb") VALUES
(3, 0, 10, 0.10),
(3, 11, 1000, 0.08),
(3, 1001, NULL, 0.05);

--------------------------------------------------
-- ORDERS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "orders" (
    "order_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "num_months" INTEGER NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    "ram_gb" INTEGER NOT NULL,
    "storage_tb" INTEGER NOT NULL,
    "data_gb" INTEGER NOT NULL,

    FOREIGN KEY ("user_id") REFERENCES "users"("user_id"),
    FOREIGN KEY ("service_id") REFERENCES "services"("service_id"),
    FOREIGN KEY ("ram_gb") REFERENCES "computation"("ram_gb")
);

COMMIT;