'use strict';

/* Data Access Object (DAO) module for accessing films data */

const db = require('./db');
const dayjs = require("dayjs");

// This function retrieves service usage values for 'storage', 'computation', and 'data_transfer'.
const convertDataFromDbRecord = (dbRecord) => {
  const status = {};
  status.serviceId = dbRecord.service_id;
  status.serviceName = dbRecord.service_name;
  status.totalValue = dbRecord.total_value;
  status.usedValue = dbRecord.used_value;
  return status;
}
exports.getServiceUsage = () => {
    return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        ser.service_id,
        ser.name AS service_name,
        ser.global_value AS total_value,
        CASE 
        WHEN ser.name = 'computation' THEN (SELECT COUNT(*) FROM orders)
            WHEN ser.name = 'storage' THEN (SELECT (SUM(storage_tb)) FROM orders)
            WHEN ser.name = 'data_transfer' THEN (SELECT (SUM(data_gb)) FROM orders)
            ELSE ser.global_value
        END AS used_value
        FROM services ser
        WHERE ser.name IN ('storage', 'computation', 'data_transfer');
      `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const data = rows.map(convertDataFromDbRecord);
                resolve(data);
            }
        });
    });
};


const convertComputationInfoFromDbRecord = (dbRecord) => {
  const computationInfo = {};
  computationInfo.id = dbRecord.id;
  computationInfo.name = dbRecord.name;
  computationInfo.maxInstances = dbRecord.max_instances;
  computationInfo.ramTier1 = dbRecord.ram_tier1;
  computationInfo.ramTier2 = dbRecord.ram_tier2;
  computationInfo.ramTier3 = dbRecord.ram_tier3;
  computationInfo.minStorageTier1 = dbRecord.min_storage_tier1;
  computationInfo.minStorageTier2 = dbRecord.min_storage_tier2;
  computationInfo.minStorageTier3 = dbRecord.min_storage_tier3;
  computationInfo.priceTier1 = dbRecord.price_tier1;
  computationInfo.priceTier2 = dbRecord.price_tier2;
  computationInfo.priceTier3 = dbRecord.price_tier3;

  return computationInfo;
}
exports.getComputationInfo = () => {
    return new Promise((resolve, reject) => {
    const sql = `
      select *
      from computation;
      `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const data = rows.map(convertComputationInfoFromDbRecord);
                resolve(data);
            }
        });
    });
};



const convertStorageInfoFromDbRecord = (dbRecord) => {
  const storageInfo = {};
  storageInfo.id = dbRecord.id;
  storageInfo.name = dbRecord.name;
  storageInfo.price = dbRecord.price_eur_per_tb_per_month;
  storageInfo.minStorageTbPerOrder = dbRecord.min_storage_tb_per_order;
  storageInfo.maxGlobalStorage = dbRecord.max_gloabl_storage;

  return storageInfo;
}
exports.getStorageInfo = () => {
    return new Promise((resolve, reject) => {
    const sql = `
      select *
      from storage;
      `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const data = rows.map(convertStorageInfoFromDbRecord);
                resolve(data);
            }
        });
    });
};
