'use strict';

/* Data Access Object (DAO) module for accessing films data */

const db = require('./db');
const dayjs = require("dayjs");


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

const convertDatatransferInfoFromDbRecord = (dbRecord) => {
  const DTInfo = {};
  DTInfo.id = dbRecord.id;
  DTInfo.name = dbRecord.name;
  DTInfo.base_tier = dbRecord.base_tier;
  DTInfo.tier1 = dbRecord.tier1;
  DTInfo.base_price = dbRecord.base_price;
  DTInfo.tier1_multiplier = dbRecord.tier1_multiplier;
  DTInfo.tier2_multiplier = dbRecord.tier2_multiplier;

  return DTInfo;
}
exports.getDatatransferInfo = () => {
    return new Promise((resolve, reject) => {
    const sql = `
      select *
      from datatransfer;
      `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const data = rows.map(convertDatatransferInfoFromDbRecord);
                resolve(data);
            }
        });
    });
};


const convertCloudStatusFromDbRecord = (dbRecord) => {
  const cloudStatus = {};
  cloudStatus.usedComputation = dbRecord.usedComputation;
  cloudStatus.usedStorage = dbRecord.usedStorage;
  cloudStatus.usedData = dbRecord.usedData;

  return cloudStatus;
}
exports.getCloudStatus = () => {
    return new Promise((resolve, reject) => {
    const sql = `
    select count(*) as usedComputation, sum(storage_tb) as usedStorage, sum(data_gb) as usedData
    from orders   
    `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const data = rows.map(convertCloudStatusFromDbRecord);
                resolve(data);
            }
        });
    });
};

const convertListOrdersFromDbRecord = (dbRecord) => {
  const listOrders = {};
  listOrders.orderId = dbRecord.order_id;
  listOrders.numMonths = dbRecord.num_months;
  listOrders.timestamp = dbRecord.timestamp;
  listOrders.ramGb = dbRecord.ram_gb;
  listOrders.storageTb = dbRecord.storage_tb;
  listOrders.dataGb = dbRecord.data_gb;
  listOrders.total_price = dbRecord.total_price;

  return listOrders;
}
exports.getOrders = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `
        select order_id, num_months, timestamp, ram_gb, storage_tb, data_gb, total_price
        from orders o inner join users u on o.user_id = u.user_id
        where u.email = ?
`;

        db.all(sql, [email], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const data = rows.map(convertListOrdersFromDbRecord);
                resolve(data);
            }
        });
    });
};


exports.deleteOrders = (orderId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      delete from orders
      where order_id = ?
    `;

    db.run(sql, [orderId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes); // number of rows deleted
      }
    });
  });
};