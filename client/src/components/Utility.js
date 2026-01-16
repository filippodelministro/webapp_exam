// ------- Some Utility functions and variables

// Upper limit for data transfer not inserted in DB as not esplicitely specified in requirments;
// Uses common-sense value to prevent excessively high DB insertions.
const MAX_DATATRANSFER_GB = 5000;

const SHOW_MESSAGE_TIME = 2000;


// -- Pricing functions for each service
function computeComputationPrice(ramGb, computationData) {
  const cd = computationData[0];
  if (!cd) return;

  let compPrice = 0;
  let minStorageRequired = 0;

  switch (ramGb) {
    case cd.ramTier1:
      compPrice = cd.priceTier1;
      minStorageRequired = cd.minStorageTier1 || 0;
      break;
    case cd.ramTier2:
      compPrice = cd.priceTier2;
      minStorageRequired = cd.minStorageTier2 || 0;
      break;
    case cd.ramTier3:
      compPrice = cd.priceTier3;
      minStorageRequired = cd.minStorageTier3 || 0;
      break;
    default:
      throw new Error(`Invalid RAM size ${ramGb} for computation service`);
  }

  return { compPrice, minStorageRequired };
}

function computeStoragePrice(storageTb, storageData) {
  const sd = storageData[0];
  if (!sd) return;

  return storageTb * sd.price;
}

function computeDataTransferPrice(dataGb, datatransferData) {
  const dtd = datatransferData[0];
  if (!dtd) return;

  const base_price = dtd.base_price;
  const base_tier = dtd.base_tier;
  const tier1 = dtd.tier1;
  const tier_mul1 = dtd.tier1_multiplier;
  const tier_mul2 = dtd.tier2_multiplier;
  let dataPrice = base_price;

  // Upper limit for data transfer not inserted in DB as not esplicitely specified in requirments;
  // Hard-coded check inserted solely to to prevent excessively high DB insertions.
  if (dataGb > MAX_DATATRANSFER_GB) return 0;

  if (dataGb > base_tier && dataGb - base_tier <= tier1) {
    dataPrice += ((dataGb - base_tier) / base_tier) * (base_price * tier_mul1);
  }
  else if (dataGb - base_tier > tier1) {
    dataPrice += (tier1 / base_tier) * (base_price * tier_mul1);
    dataPrice += ((dataGb - base_tier - tier1) / base_tier) * (base_price * tier_mul2);
  }

  return dataPrice;
}

// compute Total price given the selected amount for each services and configuration of the cloud (prices, minStorage, ecc.)
function computePrice(ramGb, storageTb, dataGb, computationData, storageData, datatransferData) {
  const { compPrice, minStorageRequired } = computeComputationPrice(ramGb, computationData);
  if (storageTb < minStorageRequired)
    throw new Error(`Storage too low for selected RAM (${ramGb} GB requires at least ${minStorageRequired} TB)`);
  
  const storagePrice = computeStoragePrice(storageTb, storageData);
  const dataPrice = computeDataTransferPrice(dataGb, datatransferData);

  const totalPrice = compPrice + storagePrice + dataPrice;
  return totalPrice;
}

export { computePrice, computeComputationPrice, computeStoragePrice, computeDataTransferPrice, SHOW_MESSAGE_TIME, MAX_DATATRANSFER_GB };
