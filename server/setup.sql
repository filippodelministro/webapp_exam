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

-- todo: change hash and salt for user4
INSERT INTO "users" VALUES 
(1,'u1@p.it','John','15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288','72e4eeb14def3b21','LXBSMDTMSP2I5XFXIYRGFVWSFI'),
(2,'u2@p.it','Alice','1d22239e62539d26ccdb1d114c0f27d8870f70d622f35de0ae2ad651840ee58a','a8b618c717683608',''),
(3,'u3@p.it','George','61ed132df8733b14ae5210457df8f95b987a7d4b8cdf3daf2b5541679e7a0622','e818f0647b4e1fe0','LXBSMDTMSP2I5XFXIYRGFVWSFI'),
(4,'u4@p.it','David','61ed132df8733b14ae5210457df8f95b987a7d4b8cdf3daf2b5541679e7a0622','e818f0647b4e1fe0','LXBSMDTMSP2I5XFXIYRGFVWSFI');

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
INSERT INTO "orders" ("user_id", "service_id", "num_months", "ram_gb", "storage_tb", "data_gb") VALUES
(1, 1, 1, 32, 10, 10),
(1, 1, 1, 128, 25, 50),
(2, 1, 1, 32, 15, 100),
(2, 1, 1, 128, 20, 100);

COMMIT;