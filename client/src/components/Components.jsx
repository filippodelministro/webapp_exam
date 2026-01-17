
import { Button, Alert, Modal } from 'react-bootstrap';

import { MAX_DATATRANSFER_GB } from './Utility';


// -------- Component showing computation service info with static data and progress bar
/* progress bar colors:
  - red if no storage available
  - blue for used storage
  - yellow for selected storage (only if available)
*/
function ComputationCard(props) {
  const { loggedIn, computationData, cloudStatus, availableRam } = props;

  const cd = computationData?.[0];

  const maxInstances = cd?.maxInstances || 0;
  const ramTier1 = cd?.ramTier1 || 0;
  const ramTier2 = cd?.ramTier2 || 0;
  const ramTier3 = cd?.ramTier3 || 0;
  const priceTier1 = cd?.priceTier1 || 0;
  const priceTier2 = cd?.priceTier2 || 0;
  const priceTier3 = cd?.priceTier3 || 0;
  const minStorageTier1 = cd?.minStorageTier1 || 0;
  const minStorageTier2 = cd?.minStorageTier2 || 0;
  const minStorageTier3 = cd?.minStorageTier3 || 0;

  const used = cloudStatus?.usedComputation || 0;
  const availableSources = maxInstances - used;
  const displayUsed = loggedIn ? used + 1 : used; // shows +1 computation card in use only when logged in
  const showNextInstance = loggedIn && availableSources >= 1; 

  return (
    <div className="serviceCard">
      <h4 className="serviceCardTitle">Computation</h4>
        <div className="progress-bar">
        <div
          className={`progress-bar-fill ${
            !availableRam 
              ? "progress-bar-fill--red" 
              : "progress-bar-fill--blue"
          }`}
          style={{ 
            width: `${Math.round((used / maxInstances) * 100)}%` 
          }}
        ></div>
        {showNextInstance && (
          <div
            className="progress-bar-fill progress-bar-fill--yellow"
            style={{ 
              left: `${Math.round((used / maxInstances) * 100)}%`,
              width: `${Math.round((1 / maxInstances) * 100)}%`
            }}
          ></div>
        )}
      </div>

      <p>{showNextInstance ? displayUsed : used}/{maxInstances} used</p>
      
      <table className="service-table">
        <thead>
          <tr><th>RAM</th><th>Price</th><th>Min Storage</th></tr>
        </thead>
        <tbody>
          <tr><td>{ramTier1}GB</td><td>{priceTier1}€/month</td><td>{minStorageTier1 != null ? `${minStorageTier1} TB` : '-'}</td></tr>
          <tr><td>{ramTier2}GB</td><td>{priceTier2}€/month</td><td>{minStorageTier2 != null ? `${minStorageTier2} TB` : '-'}</td></tr>
          <tr><td>{ramTier3}GB</td><td>{priceTier3}€/month</td><td>{minStorageTier3 != null ? `${minStorageTier3} TB` : '-'}</td></tr>
        </tbody>
      </table>

      {!availableRam && (
        <Alert variant="warning" className="mt-2">No computation instances available</Alert>
      )}

    </div>
  );
}

function StorageCard(props) {
  const { loggedIn, storageData, cloudStatus, selectedStorage, availableStorage } = props;

  const sd = storageData?.[0];
  const used = cloudStatus?.usedStorage || 0;
  const selected = parseInt(selectedStorage) || 0;
  
  const maxGlobalStorage = sd?.maxGlobalStorage || 0;
  const price = sd?.price || 0;
  
  // calculate percentages for progress bar
  const usedPercent = maxGlobalStorage ? Math.round((used / maxGlobalStorage) * 100) : 0;
  const selectedPercent = maxGlobalStorage ? Math.round((selected / maxGlobalStorage) * 100) : 0;
  const totalStoragePercent = Math.round(((used + selected) / maxGlobalStorage) * 100);
  
  return (
    <div className="serviceCard">
      <h4 className="serviceCardTitle">Storage</h4>
      

      <div className="progress-bar">
        <div
          className={`progress-bar-fill ${
            !availableStorage 
              ? "progress-bar-fill--red" 
              : "progress-bar-fill--blue"
          }`}
          style={{ 
            width: `${!availableStorage ? totalStoragePercent : usedPercent}%` 
          }}
        ></div>
        
        {availableStorage && used + selected <= maxGlobalStorage && selected > 0 && (
          <div
            className="progress-bar-fill progress-bar-fill--yellow"
            style={{
              left: `${usedPercent}%`,
              width: `${selectedPercent}%`
            }}
          ></div>
        )}
      </div>

      <p>{Math.min(used + selected, maxGlobalStorage)}/{maxGlobalStorage} TB used</p>

      <p><strong>Price:</strong> €{price}/TB</p>
      <p><small>All prices are monthly prices</small></p>

      {!availableStorage && (
        <Alert variant="warning" className="mt-2">Storage limit reached</Alert>
      )}
    </div>
  );
}

function GeneralProgressBar(props) {
  const {used, selected, usedPercent, selectedPercent} = props;
  return (
    <div>

      {/* Used (blue) + Selected (yellow) progress bar */}
      <div className="progress-bar" style={{ position: 'relative' }}>
        <div
          className="progress-bar-fill progress-bar-fill--blue"
          style={{ width: `${usedPercent}%` }}
        />
        {used + selected <= MAX_DATATRANSFER_GB && selected > 0 && (
          <div
            className="progress-bar-fill progress-bar-fill--yellow"
            style={{
              left: `${usedPercent}%`,
              width: `${selectedPercent}%`
            }}
          />
        )}
      </div>
    </div>
  );
}


function SelectedProgressBar(props) {
 const {selected, label, tier, usedPercent, colorClass = "progress-bar-fill--blue"} = props;
 
  // Calculate percentage from selected/tier
  const percent = tier > 0 ? Math.round((selected / tier) * 100) : 0;

  return (
    <div className="tier-section">
      <div className="progress-bar" style={{ position: 'relative' }}>
        <span className="tier-usage">
          {label}: {selected}/{tier} GB
        </span>
        <div
          className={`progress-bar-fill ${colorClass}`}
          style={{ width: `${usedPercent}%` }}
        />
      </div>
    </div>
  );
}


function DataTransferCard(props) {
  const { loggedIn, datatransferData, cloudStatus, selectedData } = props;

  const used = cloudStatus?.usedData || 0;
  const selected = Math.min(parseInt(selectedData) || 0, MAX_DATATRANSFER_GB);
  
  const dtd = datatransferData?.[0];

  const base_tier = dtd?.base_tier || 0;
  const tier1 = dtd?.tier1 || 0;
  const basePrice = dtd?.base_price || 0;
  const tier1_multiplier = dtd?.tier1_multiplier || 1;
  const tier2_multiplier = dtd?.tier2_multiplier || 1;
  const tier1Price = (basePrice * tier1_multiplier).toFixed(2);
  const tier2Price = (basePrice * tier2_multiplier).toFixed(2);
  
  let selectedBaseTier = 0, selectedTier1 = 0, selectedTier2 = 0;

  if (selected > 0) {
    selectedBaseTier = Math.min(selected, base_tier);
    const rem = selected - selectedBaseTier;
    selectedTier1 = Math.min(rem, tier1);
    selectedTier2 = Math.max(rem - selectedTier1, 0);
  }

  const usedPercent = MAX_DATATRANSFER_GB ? Math.round((used / MAX_DATATRANSFER_GB) * 100) : 0;
  const selectedPercent = MAX_DATATRANSFER_GB ? Math.round((selected / MAX_DATATRANSFER_GB) * 100) : 0;
  const baseTierPercent = base_tier > 0 ? Math.round((selectedBaseTier / base_tier) * 100) : 0;
  const tier1Percent = tier1 > 0 ? Math.round((selectedTier1 / tier1) * 100) : 0;
  
  return (
    <div className="serviceCard">
      <h4 className="serviceCardTitle">Data Transfer</h4>

      {/* Shows the used amount of datatransfer used in the cloud service (by all users) */}
      <GeneralProgressBar used={used} selected={selected} usedPercent={usedPercent} selectedPercent={selectedPercent}/>

      {/* if user is loggedIn, shows the amount of datatrasnfer selcted PER TIER */}
      {loggedIn && (
        <div className="tier-section">
          <SelectedProgressBar label="Base tier" selected={selectedBaseTier} tier={base_tier} usedPercent={baseTierPercent} colorClass="progress-bar-fill--darkblue"/>
        </div>
      )}

      {loggedIn && tier1 > 0 && (
        <div className="tier-section">
          <SelectedProgressBar label="Tier 1" selected={selectedTier1} tier={tier1} usedPercent={tier1Percent} colorClass="progress-bar-fill--green"/>
        </div>
      )}

      <div className="total-section" style={{marginTop:'24px',paddingTop:'16px',borderTop:'1px solid #eee'}}>
        <p>{used} GB used</p>
        <p><strong>Base tier:</strong> (up to {base_tier} GB): €{basePrice}/GB</p>
        <p><strong>Tier 1:</strong> (up to {tier1} GB): €{tier1Price}/GB</p>
        <p><strong>Tier 2:</strong> (above {tier1} GB): €{tier2Price}/GB</p>
        <p><small>All prices are monthly prices</small></p>
      </div>

    </div>
  );
}

// --------Confirmation dialog for creating or deleting an order; messages are dynamic based on type
function ConfirmDialog(props) {
  const { show, type, orderDetails, onConfirm, onCancel } = props;

  const isCreate = (type === "create");
  const title = isCreate ? "Create new order" : "Delete order";
  const message = isCreate
    ? "Please confirm the order details:"
    : "Are you sure you want to delete this order?";
  const confirmText = isCreate ? "Yes, create" : "Yes, delete";
  const cancelText = "Cancel";
  const variant = isCreate ? "primary" : "danger";

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message}
        {/* Show order details if creating an order, otherwise show delete confirmation */}
        {isCreate && orderDetails && (
          <div className="order-details mt-3">
            <p><strong>RAM:</strong> {orderDetails.ramGb} GB</p>
            <p><strong>Storage:</strong> {orderDetails.storageTb} TB</p>
            <p><strong>Data Transfer:</strong> {orderDetails.dataGb} GB</p>
            <p><strong>Total Price:</strong> €{orderDetails.totalPrice?.toFixed(2)}</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
        <Button variant={variant} onClick={onConfirm} >{confirmText}</Button>
      </Modal.Footer>
    </Modal>
  );
}

export {ComputationCard, StorageCard, DataTransferCard, ConfirmDialog}