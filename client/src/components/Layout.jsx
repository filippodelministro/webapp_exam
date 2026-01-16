
import { Row, Col, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router';

import { Navigation } from './Navigation';
import { useEffect, useState } from 'react';
import { LoginForm, TotpForm } from './Auth';

import API from '../API.js';

function NotFoundLayout(props) {
  return (
    <>
      <h2>This route is not valid!</h2>
      <Link to="/">
        <Button variant="primary">Go back to the main page!</Button>
      </Link>
    </>
  );
}

function LoginLayout(props) {
  return (
    <Row>
      <Col>
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}

function TotpLayout(props) {
  return (
    <Row>
      <Col>
        <TotpForm totpSuccessful={props.totpSuccessful} />
      </Col>
    </Row>
  );
}

// comupte price based on selected options; called in the NewOrderLayout
function computePrice(ramGb, storageTb, dataGb, computationData, storageData, datatransferData) {
  // --- Computation price ---
  let compPrice = 0;
  let minStorageRequired = 0;

  // find the computation service that matches the RAM tier
  const compService = computationData[0];
  if (!compService) throw new Error("No computation service available");

  if (ramGb === compService.ramTier1) {
    compPrice = compService.priceTier1;
    minStorageRequired = compService.minStorageTier1 || 0;
  } else if (ramGb === compService.ramTier2) {
    compPrice = compService.priceTier2;
    minStorageRequired = compService.minStorageTier2 || 0;
  } else if (ramGb === compService.ramTier3) {
    compPrice = compService.priceTier3;
    minStorageRequired = compService.minStorageTier3 || 0;
  } else {
    throw new Error(`Invalid RAM size ${ramGb} for computation service`);
  }

  if (storageTb < minStorageRequired) {
    throw new Error(`Storage too low for selected RAM (${ramGb} GB requires at least ${minStorageRequired} TB)`); 
  }

  // --- Storage price ---
  const storageService = storageData[0]; 
  if (!storageService) throw new Error("No storage service available");

  let storagePrice = storageTb * storageService.price; 

  // --- Data transfer price ---
  const dataService = datatransferData[0]; 
  if (!dataService) throw new Error("No data transfer service available");

  // const baseData = dataService.base_tier; 
  const base_price = dataService.base_price;
  const base_tier = dataService.base_tier;
  const tier1 = dataService.tier1;
  const tier_mul1 = dataService.tier1_multiplier;
  const tier_mul2 = dataService.tier2_multiplier;
  let dataPrice = base_price;

  if (dataGb > base_tier && dataGb - base_tier <= tier1) {
    // ((60-10)/10)*(1 euro*0,80 percent)
    dataPrice += ((dataGb - base_tier)/base_tier) * (base_price * tier_mul1) ;
  }
  else if (dataGb - base_tier > tier1) {
    // ((1000)/10)*(1 euro*0,80 percent) + ((1060-1000)/10)*(1 euro*0,50 percent)
    dataPrice += (tier1/base_tier) * (base_price * tier_mul1);
    dataPrice += ((dataGb - base_tier - tier1)/base_tier) * (base_price * tier_mul2);
  }

  const totalPrice = compPrice + storagePrice + dataPrice;

  return totalPrice;
}

// function ConfirmDeleteOrderDialog(props) {
//   const {show, loading, onConfirm, onCancel } = props;

//   const title = "Delete order";
//   const message = "Are you sure you want to delete this order?";
//   const confirmText = "Yes, delete";
//   const cancelText = "Cancel";
//   const variant = "danger";

//   return (
//     <Modal show={show} onHide={onCancel} centered>
//       <Modal.Header closeButton>
//         <Modal.Title>{title}</Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         {message}
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={onCancel} disabled={loading}>
//           {cancelText}
//         </Button>

//         <Button variant={variant} onClick={onConfirm} disabled={loading}>
//           {loading ? <Spinner size="sm" /> : confirmText}
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }

// function ConfirmDialog(props) {
//   const {show, type, loading, onConfirm, onCancel } = props;

//   const title = type === "delete" ? "Delete order" : "Create new order";
//   const message = type === "delete" ? "Are you sure you want to delete this order?" : "Are you sure you want to create this order?";
//   const confirmText = type === "delete" ? "Yes, delete" : "Yes, create";
//   const cancelText = type === "delete" ? "Cancel" : "Cancel";
//   const variant = "primary";

//     return (
//     <Modal show={show} onHide={onCancel} centered>
//       <Modal.Header closeButton>
//         <Modal.Title>{title}</Modal.Title>
//       </Modal.Header>

//       {/* section to show the order details if type === "create" */}

//       <Modal.Body>
//         {message}
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={onCancel} disabled={loading}>
//           {cancelText}
//         </Button>

//         <Button variant={variant} onClick={onConfirm} disabled={loading}>
//           {loading ? <Spinner size="sm" /> : confirmText}
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }


function ConfirmDialog(props) {
  const { show, type, orderDetails, setLoading, onConfirm, onCancel } = props;

  const isDelete = type === "delete";
  const title = isDelete ? "Delete order" : "Create new order";
  const message = isDelete 
    ? "Are you sure you want to delete this order?"
    : "Please confirm the order details:";
  const confirmText = isDelete ? "Yes, delete" : "Yes, create";
  const cancelText = "Cancel";
  const variant = isDelete ? "danger" : "primary";

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message}
        {!isDelete && orderDetails && (
          <div className="order-details mt-3">
            <p><strong>RAM:</strong> {orderDetails.ramGb} GB</p>
            <p><strong>Storage:</strong> {orderDetails.storageTb} TB</p>
            <p><strong>Data Transfer:</strong> {orderDetails.dataGb} GB</p>
            <p><strong>Total Price:</strong> €{orderDetails.totalPrice?.toFixed(2)}</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} >
          {confirmText}
          {/* {loading ? <Spinner size="sm" /> : confirmText} */}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}



// Component showing computation service info with static data and progress bar
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
      
      <p>
        {Math.min(used + selected, maxGlobalStorage)}/{maxGlobalStorage} TB used
      </p>
      
      <p><strong>Price:</strong> €{price}/TB</p>
      <p><small>All prices are monthly prices</small></p>

      {!availableStorage && (
        <Alert variant="warning" className="mt-2">Storage limit reached</Alert>
      )}
    </div>
  );
}

function DataTransferCard(props) {
  const {loggedIn, datatransferData, cloudStatus, selectedData} = props;

  const used = cloudStatus?.usedData || 0;
  const selected = parseInt(selectedData) || 0;
  
  const dtd = datatransferData?.[0];
  const base_tier = dtd?.base_tier || 0;
  const tier1 = dtd?.tier1;
  const basePrice = dtd?.base_price || 0;
  const tier1_multiplier = dtd?.tier1_multiplier;
  const tier2_multiplier = dtd?.tier2_multiplier;
  const tier1Price = (basePrice * tier1_multiplier).toFixed(2);
  const tier2Price = (basePrice * tier2_multiplier).toFixed(2);
  

  //todo: using 1000 as maximum value; change in all yellow if used + selected > 1000
  // calculate percentages for progress bar
  const usedPercent = 1000 ? Math.round((used / 1000) * 100) : 0;
  const selectedPercent = 1000 ? Math.round((selected / 1000) * 100) : 0;

  return (
    <div className="serviceCard">
      <h4 className="serviceCardTitle">Data Transfer</h4>
      
      {/* No need for red bar since no upper limit for data transfer */}
      <div className="progress-bar">
        <div
          className="progress-bar-fill progress-bar-fill--blue"
          style={{ width: `${usedPercent}%` }}
        ></div>
        {used + selected <= 1000 && selected > 0 && (
          <div
            className="progress-bar-fill progress-bar-fill--yellow"
            style={{
              left: `${usedPercent}%`,
              width: `${selectedPercent}%`
            }}
          ></div>
        )}
      </div>
      
      <p>{used} GB used</p>
      <p><strong>Up to {base_tier} GB:</strong> €{basePrice}/GB</p>
      <p><strong>Up to {tier1} GB:</strong> €{tier1Price}/GB</p>
      <p><strong>Above {tier1} GB:</strong> €{tier2Price}/GB</p>
      <p><small>All prices are monthly prices</small></p>

    </div>
  );
}

function CloudStatusLayout(props) {
  const { loggedIn, computationData, storageData, datatransferData, cloudStatus, selectedRam, selectedStorage, selectedData, availableRam, availableStorage } = props;

  if (!computationData || !storageData || !datatransferData || !cloudStatus) {
    return <p>Loading cloud services info...</p>;
  }

  return (
    <div className="servicesGrid">
      <ComputationCard loggedIn={loggedIn} computationData={computationData} cloudStatus={cloudStatus} availableRam={availableRam}/>
      <StorageCard loggedIn={loggedIn} storageData={storageData} cloudStatus={cloudStatus} selectedStorage={selectedStorage} availableStorage={availableStorage}/>
      <DataTransferCard loggedIn={loggedIn} datatransferData={datatransferData} cloudStatus={cloudStatus} selectedData={selectedData}/>

    </div>
  );
}

function NewOrderLayout(props) {
  const { computationData, storageData, datatransferData, onOrderChange, selectedRam, setSelectedRam, selectedStorage, setSelectedStorage, selectedData, setSelectedData, availableRam, availableStorage, cloudStatus } = props;
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [minStorage, setMinStorage] = useState(1);
  const [minData, setMinData] = useState(1);

  const [showConfirm, setShowConfirm] = useState(false);
  // const [confirmLoading, setConfirmLoading] = useState(false);

  const cd = computationData?.[0];
  const ramTier1 = cd?.ramTier1 || 0;
  const ramTier2 = cd?.ramTier2 || 0;
  const ramTier3 = cd?.ramTier3 || 0;
  const priceTier1 = cd?.priceTier1 || 0;
  const priceTier2 = cd?.priceTier2 || 0;
  const priceTier3 = cd?.priceTier3 || 0;

  const simulateLoading = () => {
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  // Set default values when data arrives
  useEffect(() => {
    if (computationData) setSelectedRam(computationData[0].ramTier1 ?? 16);
    if (storageData) setSelectedStorage(storageData[0].minStorage?? 1);
    if (datatransferData) setSelectedData(datatransferData[0].base_tier ?? 10);
  }, [computationData, storageData, datatransferData]);

  // Update minStorage based on selected RAM
  useEffect(() => {
    if (selectedRam && computationData) {
      let minStor = 1;
      const ramValue = parseInt(selectedRam);
      
      switch (ramValue) {
        case computationData[0]?.ramTier1: minStor = computationData[0].minStorageTier1 ?? 1; break;
        case computationData[0]?.ramTier2: minStor = computationData[0].minStorageTier2 ?? 1; break;
        case computationData[0]?.ramTier3: minStor = computationData[0].minStorageTier3 ?? 1; break;
      }
      
      setMinStorage(minStor);
    }
  }, [selectedRam, computationData]);

  // Update price based on selected options
  useEffect(() => {
    if (selectedRam && selectedStorage && selectedData && 
        computationData && storageData && datatransferData) {
      try {
        const price = computePrice(parseInt(selectedRam), parseInt(selectedStorage), parseInt(selectedData), 
          computationData, storageData, datatransferData);
        setTotalPrice(price);
      } catch (err) {
        setTotalPrice(0);
      }
    } else {
      setTotalPrice(0);
    }
  }, [selectedRam, selectedStorage, selectedData]);


  const confirmOrder = async () => {
    // setConfirmLoading(true);
    try {
      const newOrder = { 
        ramGb: parseInt(selectedRam), 
        storageTb: parseInt(selectedStorage), 
        dataGb: parseInt(selectedData), 
        totalPrice: totalPrice 
      };
      const result = await API.createOrder(newOrder);

      if (result.success) {
        setSuccess('Order created successfully!');
        setTimeout(() => setSuccess(null), 2000);
        // Reset form
        setSelectedRam('');
        setSelectedStorage(minStorage);
        setSelectedData(minData);
        setTotalPrice(0);
        if (onOrderChange) onOrderChange();
      } else {
        setError('Not enough resources for this order!');
        if (onOrderChange) onOrderChange();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create order');
    } finally {
      // setConfirmLoading(false);
      setShowConfirm(false);
      simulateLoading();
      // setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedRam || !selectedStorage || !selectedData) {
      setError('Please fill in all fields');
      return;
    }

    if (selectedStorage < minStorage) {
      setError(`Storage must be at least ${minStorage} TB for ${selectedRam} GB RAM`);
      return;
    }

    setLoading(true);
    setShowConfirm(true);
    // setLoading(true);
    // simulateLoading();
    // try {
    //   const newOrder = { ramGb: selectedRam, storageTb: selectedStorage, dataGb: selectedData, totalPrice: totalPrice};
    //   const result = await API.createOrder(newOrder); 

    //   // Handle different statuses
    //   if (result.success) {
    //     setSuccess('Order created successfully!');
    //     setTimeout(() => {
    //       setSuccess(null);
    //     }, 2000);

    //     setSelectedRam('');
    //     setSelectedStorage(minStorage);
    //     setSelectedData(minData);
    //     setTotalPrice(0);

    //     if (onOrderChange) 
    //       onOrderChange(); 
    //   } 
    //   else if (!result.success){
    //     setSuccess('Not enough resources for this order!');
    //     // setSuccess('Order created successfully!');
    //       if (onOrderChange) onOrderChange();
    //       setTimeout(() => {
    //         setSuccess(null);
    //       }, 2000);
    //   }
    // } catch (err) {
    //   console.error(err);
    //   setError('Failed to create order');
    // }
  };

  return (
    <div className="new-order-form">
      <h4>Create New Order</h4>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          {/* RAM */}
          <Col md={3}>
            <Form.Group>
              <Form.Label>RAM (GB)</Form.Label>
              <Form.Select value={selectedRam} onChange={e => setSelectedRam(e.target.value)}>
                  <optgroup key={"computation"} label={"Computation Service"}>
                    <option key={ramTier1} value={ramTier1}>{ramTier1} GB</option>
                    <option key={ramTier2} value={ramTier2}>{ramTier2} GB</option>
                    <option key={ramTier3} value={ramTier3}>{ramTier3} GB</option>
                  </optgroup>
              </Form.Select>
              <Form.Text className="text-muted">Select one of the RAM size</Form.Text>
            </Form.Group>
          </Col>

          {/* Storage */}
          <Col md={3}>
            <Form.Group>
              <Form.Label>Storage (TB)</Form.Label>
              <Form.Control type="number" min={minStorage} value={selectedStorage} onChange={e => setSelectedStorage(e.target.value)} placeholder={`Min ${minStorage} TB`}/>
              <Form.Text className="text-muted">Minimum storage required: {minStorage} TB</Form.Text>
            </Form.Group>
          </Col> 

          {/* Data Transfer */}
          <Col md={3}>
            <Form.Group>
              <Form.Label>Data Transfer (GB)</Form.Label>
              <Form.Control type="number" min={minData} value={selectedData} onChange={e => setSelectedData(e.target.value)} placeholder={`Min ${minData} GB`}/>
              <Form.Text className="text-muted">Amount of data transfer in GB</Form.Text>
            </Form.Group>
          </Col>

        </Row>

        {/* Total Price */}
        <Row className="mb-3">
          <Col>
            <h5>Total Price: €{totalPrice.toFixed(2)}</h5>
          </Col>
        </Row>

        <Button 
          type="submit" 
          disabled={!availableRam || !availableStorage || loading || parseInt(selectedStorage) < minStorage}
          variant="primary"  
        >
          {loading 
            ? <>
                <Spinner size="sm" className="me-2" />
                Creating Order...
              </>
            : !availableRam 
              ? 'No RAM available'
              : !availableStorage 
                ? 'Storage limit reached'
                : parseInt(selectedStorage) < minStorage
                  ? 'Storage too low'
                  : 'Create Order'
          }
        </Button>

      </Form>
        <ConfirmDialog
        show={showConfirm}
        type="create"
        orderDetails={{ 
          ramGb: selectedRam, 
          storageTb: selectedStorage, 
          dataGb: selectedData, 
          totalPrice 
        }}
        loading={loading}
        onConfirm={confirmOrder}
        onCancel={() => setShowConfirm(false)}
      />
      
    </div>
  );
}

function OldOrderLayout (props){
  const { loggedInTotp, orders, onOrderChange } = props;

  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // just show the confirm box
  const handleCancelClick = (orderId) => {
    if(loggedInTotp){
      setOrderToCancel(orderId);
      setShowConfirm(true);
    }
  };

  // actually perform the deletion of the order if properly logged in
  const confirmCancel = async () => {
    if(loggedInTotp){
      setCancelLoading(true);
      try {
        await API.deleteOrder(orderToCancel);
        if (onOrderChange) onOrderChange(); 
        setShowConfirm(false);
      } catch (err) {
        console.error(err);
        alert("Failed to cancel order.");
      } finally {
        setCancelLoading(false);
        setOrderToCancel(null);
      }
    }
  };

  if (error) return <p className="orders-error">{error}</p>;

  return (
    <div className="orders-container">
      <h2 className="orders-title">Old Orders</h2>

      {orders.length === 0 ? (
        <p className="orders-empty">No previous orders</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th><th>Subscribed</th><th>RAM (GB)</th><th>Storage (TB)</th><th>Data (GB)</th><th>Tot Price (€)</th><th>Actions</th>
            </tr>
          </thead>
         <tbody>
            {orders.map((o, index) => {
              const subscribedDate = o.timestamp ? new Date(o.timestamp) : null;

              // Inform the user about the reason why cancel is disabled
              let hoverText = '';
              if (!loggedInTotp) hoverText = "Enable 2FA to cancel orders";

              return (
                <tr key={o.orderId ?? index}>
                  <td>{o.orderId}</td>
                  <td>{subscribedDate ? subscribedDate.toLocaleDateString() : '–'}</td>
                  <td>{o.ramGb}</td>
                  <td>{o.storageTb}</td>
                  <td>{o.dataGb}</td>
                  <td>{o.total_price}€</td>
                  <td>
                    <span title={hoverText}>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleCancelClick(o.orderId)}
                        disabled={!loggedInTotp}
                        title={hoverText}
                        >
                        <i className='bi bi-trash'></i>
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <ConfirmDialog
  show={showConfirm}
  type="delete"
  loading={cancelLoading}
  onConfirm={confirmCancel}
  onCancel={() => setShowConfirm(false)}
/>
      </div>
    
  );
}

function GenericLayout(props) {
  const [computationData, setComputationData] = useState([]);
  const [storageData, setStorageData] = useState([]);
  const [datatransferData, setDatatransferData] = useState([]);
  const [cloudStatus, setCloudStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [availableRam, setAvailableRam] = useState(true);
  const [availableStorage, setAvailableStorage] = useState(true);

  // permit dynamic changes in the list of orders while the user add or delete orders
  const [orders, setOrders] = useState([]);

  // permit dynamic changes in the cloudStatus while user changes value in NewOrderLayout
  const [selectedRam, setSelectedRam] = useState(""); 
  const [selectedStorage, setSelectedStorage] = useState(1); 
  const [selectedData, setSelectedData] = useState(""); 

  const fetchCloudData = async () => {
      try {
        const [computation, storage, datatransfer, status] = await Promise.all([
          API.getComputationInfo(),
          API.getStorageInfo(),
          API.getDatatransferInfo(),
          API.getCloudStatus(),
        ]);

        //for CloudStatusLayout
        setComputationData(computation);
        setStorageData(storage);
        setDatatransferData(datatransfer);
        setCloudStatus(status[0]);
        
        if(props.loggedIn || props.loggedInTotp){
          // for NewOrderLayout 
          setSelectedRam(computation[0]?.ramTier1 ?? "");
          setSelectedStorage(storage[0]?.minStorageTbPerOrder ?? 1);
          setSelectedData(datatransfer[0]?.base_tier ?? 1);
        }
        
      } catch (err) {
        console.error(err);
        setError('Failed to load cloud services info');
      } finally {
        setLoading(false);
      }
    };


  const fetchOrders = async () => {
    try {
      const fetched = await API.getOrders();
      setOrders(fetched);
    } catch (err) {
      console.error(err);
    }
  };

  // update the cloudStatus (in any case; no need to be logged in)
  useEffect(() => {
    fetchCloudData();
  }, []); 

  // fetch orders only when logged in
  useEffect(() => {
    if (props.loggedIn) {
      fetchOrders();
    }
  }, [props.loggedIn]);
  
  // reset selected values once the user logout
  useEffect(() => {
    if (!props.loggedIn && !props.loggedInTotp) {
      setSelectedRam("");
      setSelectedStorage("");
      setSelectedData("");
    }
  }, [props.loggedIn, props.loggedInTotp]);

  // check for RAM availability based on used computation instances
  useEffect(() => {
    if (computationData?.[0]?.maxInstances && cloudStatus?.usedComputation !== undefined) {
      setAvailableRam(cloudStatus.usedComputation < computationData[0].maxInstances);
    }
    // else {
    //   setAvailableRam(true);
    // }
  }, [cloudStatus?.usedComputation, computationData]);

  // Storage availability (used + selected <= max + RAM min requirements)
  useEffect(() => {
    let isStorageAvailable = true;

    // Check global storage limit based on overall used + selected storage
    if (storageData?.[0]?.maxGlobalStorage && cloudStatus?.usedStorage !== undefined) {
      const tot = cloudStatus.usedStorage + parseInt(selectedStorage || 1);
      isStorageAvailable = (tot <= storageData[0].maxGlobalStorage);
    }
    setAvailableStorage(isStorageAvailable);
  }, [cloudStatus?.usedStorage, storageData, selectedRam, selectedStorage]);


  if (loading) return <p>Loading cloud services info...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      <Row>
        <Col>
          <Navigation loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout} />
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        <Col>
          <CloudStatusLayout
            loggedIn={props.loggedIn}
            computationData={computationData}
            storageData={storageData}
            datatransferData={datatransferData}
            cloudStatus={cloudStatus}
            selectedRam={selectedRam}
            selectedStorage={selectedStorage}
            selectedData={selectedData}
            availableRam={availableRam}
            availableStorage={availableStorage}
          />
        </Col>
      </Row>

      {props.loggedIn && (
        <Row className="g-4 mt-2">
          <Col>
          <NewOrderLayout
            computationData={computationData}
            storageData={storageData}
            datatransferData={datatransferData}
            selectedRam={selectedRam}
            cloudStatus={cloudStatus}
            setSelectedRam={setSelectedRam}
            selectedStorage={selectedStorage}
            setSelectedStorage={setSelectedStorage}
            selectedData={selectedData}
            setSelectedData={setSelectedData}
            availableRam={availableRam}
            setAvailableRam={setAvailableRam}
            availableStorage={availableStorage}
            setAvailableStorage={setAvailableStorage}
            onOrderChange={() => {
              fetchCloudData();
              fetchOrders();
            }}
          />

          <OldOrderLayout
            loggedIn={props.loggedIn}
            loggedInTotp={props.loggedInTotp}
            orders={orders}
            onOrderChange={() => {
              fetchCloudData();
              fetchOrders();
           }}
          />
          </Col>
        </Row>
      )}
    </>
  );
}


export { CloudStatusLayout, GenericLayout, NotFoundLayout, LoginLayout, TotpLayout };