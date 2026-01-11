BEGIN TRANSACTION;

DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "computation";
DROP TABLE IF EXISTS "storage";
DROP TABLE IF EXISTS "datatransfer";
DROP TABLE IF EXISTS "orders";

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
(2,'u2@p.it','Alice','1d22239e62539d26ccdb1d114c0f27d8870f70d622f35de0ae2ad651840ee58a','a8b618c717683608','LXBSMDTMSP2I5XFXIYRGFVWSFI'),
(3,'u3@p.it','George','61ed132df8733b14ae5210457df8f95b987a7d4b8cdf3daf2b5541679e7a0622','e818f0647b4e1fe0',''),
(4,'u4@p.it','David','61ed132df8733b14ae5210457df8f95b987a7d4b8cdf3daf2b5541679e7a0622','e818f0647b4e1fe0','LXBSMDTMSP2I5XFXIYRGFVWSFI');

--------------------------------------------------
-- COMPUTATION SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "computation" (
    "service_id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL,
    "max_instances" INTEGER NOT NULL,
    "ram_tier1" INTEGER NOT NULL,
    "ram_tier2" INTEGER NOT NULL,
    "ram_tier3" INTEGER NOT NULL,
    "min_storage_tier1" INTEGER,
    "min_storage_tier2" INTEGER,
    "min_storage_tier3" INTEGER,
    "price_tier1" REAL NOT NULL,
    "price_tier2" REAL NOT NULL,
    "price_tier3" REAL NOT NULL
);

INSERT INTO "computation" VALUES
(1, 'computation', 6, 16, 32, 128, NULL, 10, 20, 10, 20, 40);

--------------------------------------------------
-- STORAGE SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "storage" (
    "service_id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price_eur_per_tb_per_month" INTEGER NOT NULL,
    "min_storage_tb_per_order" INTEGER DEFAULT 1,
    "max_gloabl_storage" INTEGER NOT NULL DEFAULT 100
);

INSERT INTO "storage" VALUES
(2, 'storage', 10, 1, 100);

--------------------------------------------------
-- DATA TRANSFER SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "datatransfer" (
    "service_id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL,
    "base_tier" INTEGER NOT NULL,
    "tier1" INTEGER,
    "base_price" REAL NOT NULL,
    "tier1_multiplier" REAL NOT NULL,
    "tier2_multiplier" REAL NOT NULL
);

INSERT INTO "datatransfer" VALUES
(3, 'datatransfer', 10, 1000, 1, 0.8, 0.5);

--------------------------------------------------
-- ORDERS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "orders" (
    "order_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "num_months" INTEGER NOT NULL DEFAULT 1,
    "timestamp" TEXT DEFAULT CURRENT_TIMESTAMP,
    "ram_gb" INTEGER NOT NULL,
    "storage_tb" INTEGER NOT NULL,
    "data_gb" INTEGER NOT NULL,
    "total_price" REAL NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id")
);

INSERT INTO "orders" ("user_id","num_months","ram_gb","storage_tb","data_gb", "total_price") VALUES
(1, 1, 32, 10, 10, 121);
-- (1, 2, 128, 25, 50, 294.20),
-- (2, 3, 32, 15, 100, 178.20),
-- (2, 1, 128, 20, 100, 248.20);

COMMIT;