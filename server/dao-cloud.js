'use strict';

/* Data Access Object (DAO) module for accessing films data */

const db = require('./db');
const dayjs = require("dayjs");

// This function retrieves service usage values for 'storage', 'computation', and 'data_transfer'.
const convertDataFromDbRecord = (dbRecord) => {
  return {
    global_value: dbRecord.global_value,
  };
}
exports.getServiceUsage = () => {
    return new Promise((resolve, reject) => {
    const sql = `
      select global_value
      from services
      where name = "storage"
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


