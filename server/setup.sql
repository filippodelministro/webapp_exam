BEGIN TRANSACTION;

--------------------------------------------------
-- USERS
--------------------------------------------------
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER NOT NULL,
	"email"	TEXT NOT NULL,
	"name"	TEXT,
	"hash"	TEXT NOT NULL,
	"salt"	TEXT NOT NULL,
	"secret" TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);

INSERT INTO "users" VALUES (1,'u1@p.it','John','15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288','72e4eeb14def3b21','LXBSMDTMSP2I5XFXIYRGFVWSFI');
INSERT INTO "users" VALUES (2,'u2@p.it','Alice','1d22239e62539d26ccdb1d114c0f27d8870f70d622f35de0ae2ad651840ee58a','a8b618c717683608','');
INSERT INTO "users" VALUES (3,'u3@p.it','George','61ed132df8733b14ae5210457df8f95b987a7d4b8cdf3daf2b5541679e7a0622','e818f0647b4e1fe0','LXBSMDTMSP2I5XFXIYRGFVWSFI');
-- todo: change salt and hash for the last user
INSERT INTO "users" VALUES (4,'u4@p.it','Phil','61ed132df8733b14ae5210457df8f95b987a7d4b8cdf3daf2b5541679e7a0622','e818f0647b4e1fe0','LXBSMDTMSP2I5XFXIYRGFVWSFI');

--------------------------------------------------
-- SERVICES
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "Service" (
    "service_id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL UNIQUE
);

INSERT INTO "Service" ("name") VALUES ('computation');
INSERT INTO "Service" ("name") VALUES ('storage');
INSERT INTO "Service" ("name") VALUES ('data_transfer');

--------------------------------------------------
-- COMPUTATION SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "Computation_option" (
    "service_id" INTEGER NOT NULL,
    "ram_gb" INTEGER PRIMARY KEY,
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id") ON DELETE CASCADE
);

INSERT INTO "Computation_option" ("service_id","ram_gb") VALUES (1, 16);
INSERT INTO "Computation_option" ("service_id","ram_gb") VALUES (1, 32);
INSERT INTO "Computation_option" ("service_id","ram_gb") VALUES (1, 128);

CREATE TABLE IF NOT EXISTS "Computation_pricing" (
    "ram_gb" INTEGER PRIMARY KEY,
    "price_eur_per_month" INTEGER NOT NULL,
    FOREIGN KEY ("ram_gb") REFERENCES "Computation_option"("ram_gb") ON DELETE CASCADE
);

INSERT INTO "Computation_pricing" ("ram_gb","price_eur_per_month") VALUES (16, 10);
INSERT INTO "Computation_pricing" ("ram_gb","price_eur_per_month") VALUES (32, 20);
INSERT INTO "Computation_pricing" ("ram_gb","price_eur_per_month") VALUES (128, 40);

CREATE TABLE IF NOT EXISTS "Computation_limit" (
    "ram_gb" INTEGER PRIMARY KEY,
    "min_storage_tb" INTEGER,
    FOREIGN KEY ("ram_gb") REFERENCES "Computation_option"("ram_gb") ON DELETE CASCADE
);

INSERT INTO "Computation_limit" ("ram_gb","min_storage_tb") VALUES (32, 10);
INSERT INTO "Computation_limit" ("ram_gb","min_storage_tb") VALUES (128, 20);

CREATE TABLE IF NOT EXISTS "Computation_global_limit" (
    "service_id" INTEGER NOT NULL,
    "max_total_instances" INTEGER NOT NULL,
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id") ON DELETE CASCADE
);

INSERT INTO "Computation_global_limit" ("service_id","max_total_instances") VALUES (1, 6);

--------------------------------------------------
-- STORAGE SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "Storage_pricing" (
    "service_id" INTEGER NOT NULL,
    "price_eur_per_tb_per_month" INTEGER NOT NULL,
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id") ON DELETE CASCADE
);

INSERT INTO "Storage_pricing" ("service_id","price_eur_per_tb_per_month") VALUES (2, 10);

CREATE TABLE IF NOT EXISTS "Storage_global_limit" (
    "service_id" INTEGER NOT NULL,
    "max_total_tb" INTEGER NOT NULL,
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id") ON DELETE CASCADE
);

INSERT INTO "Storage_global_limit" ("service_id","max_total_tb") VALUES (2, 100);

--------------------------------------------------
-- DATA TRANSFER SERVICE
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "DataTransfer_option" (
    "service_id" INTEGER NOT NULL,
    "base_gb" INTEGER NOT NULL,
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id") ON DELETE CASCADE
);

INSERT INTO "DataTransfer_option" ("service_id","base_gb") VALUES (3, 10);

CREATE TABLE IF NOT EXISTS "DataTransfer_pricing" (
    "service_id" INTEGER NOT NULL,
    "min_gb" INTEGER NOT NULL,
    "max_gb" INTEGER,
    "price_per_gb" REAL NOT NULL,
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id") ON DELETE CASCADE
);

INSERT INTO "DataTransfer_pricing" ("service_id","min_gb","max_gb","price_per_gb") VALUES (3, 0, 10, 0.10);
INSERT INTO "DataTransfer_pricing" ("service_id","min_gb","max_gb","price_per_gb") VALUES (3, 11, 1000, 0.08);
INSERT INTO "DataTransfer_pricing" ("service_id","min_gb","max_gb","price_per_gb") VALUES (3, 1001, NULL, 0.05);

--------------------------------------------------
-- ORDERS
--------------------------------------------------
CREATE TABLE IF NOT EXISTS "Computation_order" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "ram_gb" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL DEFAULT 1,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ram_gb") REFERENCES "Computation_option"("ram_gb"),
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id")
);

CREATE TABLE IF NOT EXISTS "Storage_order" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "amount_tb" INTEGER NOT NULL CHECK (amount_tb >= 1),
    "service_id" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id")
);

CREATE TABLE IF NOT EXISTS "DataTransfer_order" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "amount_gb" INTEGER NOT NULL CHECK (amount_gb >= 0),
    "service_id" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("service_id") REFERENCES "Service"("service_id")
);

COMMIT;