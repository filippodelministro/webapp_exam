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

/**
 * This function adds a new order in the database.
 * The order id is added automatically by the DB, and it is returned as this.lastID.
 */
// exports.createOrder = () => {

//   return new Promise((resolve, reject) => {
//     const sql = `
//       INSERT INTO orders (ramGb, storageTb, dataGb, numMonths, user)
//       VALUES (16, 1, 1, 1, 1)
//     `;
//     db.run(
//       sql,
//       [order.ramGb, order.storageTb, order.dataGb, order.numMonths, order.user],
//       function (err) {
//         if (err) {
//           reject(err);
//         }
//         // Returning the newly created object with the DB additional properties to the client.
//         resolve(exports.getOrder(order.user, this.lastID));
//       }
//     );
//   });
// };

// exports.createOrder = (user) => {
//   return new Promise((resolve, reject) => {
//     const getUSer = `
//       SELECT id FROM users WHERE email = ?
//     `;
//     db.get(getUSer, [user], (err, row) => {
//       if (err) {
//         reject(err);
//         return;
//       }
//       if (!row) {
//         reject(new Error('User not found'));
//         return;
//       }
//       const userId = row.id;
//       const insert = `
//         INSERT INTO orders (user_id, num_months, ram_gb, storage_tb, data_gb, total_price)
//         VALUES (?, 16, 1, 1, 1, 42)
//       `;

//       db.run(insert, [userId], function (err) {
//         if (err) {
//           reject(err);
//           return;
//         }

//         resolve({success:true});
//       });
//     });
//   });
// };

exports.createOrder = (user) => {
  return new Promise((resolve, reject) => {
    const getUser = `
      SELECT user_id FROM users WHERE email = ?
    `;

    db.get(getUser, [user], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('User not found'));

      const insert = `
        INSERT INTO orders (user_id, num_months, ram_gb, storage_tb, data_gb, total_price)
        VALUES (?, 16, 1, 1, 1, 42)
      `;

      db.run(insert, [row.user_id], function (err) {
        if (err) return reject(err);
        resolve({ success: true });
      });
    });
  });
};