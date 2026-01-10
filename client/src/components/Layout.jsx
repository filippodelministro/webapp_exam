
import { Row, Col, Button, Spinner, Alert, Toast, Card, ProgressBar, Modal, Form } from 'react-bootstrap';
import { Outlet, Link, useParams, Navigate, useLocation, useNavigate } from 'react-router';

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

function ConfirmDialog({
  show,
  title = "Confirm action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {message}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>

        <Button variant={variant} onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" /> : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function NewOrderLayout({ computationData, storageData, datatransferData, onOrderChange, selectedRam, setSelectedRam, selectedStorage, setSelectedStorage, selectedData, setSelectedData
}) {
  const ramGb = selectedRam;
  const storageTb = selectedStorage;
  const dataGb = selectedData;
  const setRamGb = setSelectedRam;
  const setStorageTb = setSelectedStorage;
  const setDataGb = setSelectedData;

  const [numMonths, setNumMonths] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [minStorage, setMinStorage] = useState(1);
  const [minData, setMinData] = useState(1);


  // --- Set default values when data arrives ---
  useEffect(() => {
    if (computationData && computationData.length > 0 && !ramGb) {
      const firstComp = computationData[0];
      setRamGb(firstComp.ramTier1);
    }

    if (storageData && storageData.length > 0 && !storageTb) {
      const firstStorage = storageData[0];
      setStorageTb(firstStorage.minStorage || 1);
    }

    if (datatransferData && datatransferData.length > 0 && !dataGb) {
      const firstData = datatransferData[0];
      setDataGb(firstData.base_tier || 1);
    }
  }, [computationData, storageData, datatransferData]);

  // --- Update minStorage based on selected RAM ---
  useEffect(() => {
    if (!ramGb || !computationData) return;

    const ramNumber = parseInt(ramGb);
    let minStor = 1;

    for (const service of computationData) {
      if (ramNumber === service.ramTier1) minStor = service.minStorageTier1 || 1;
      else if (ramNumber === service.ramTier2) minStor = service.minStorageTier2 || 1;
      else if (ramNumber === service.ramTier3) minStor = service.minStorageTier3 || 1;
    }

    setMinStorage(minStor);

    // Ensure storageTb respects minStorage
    setStorageTb(prev => {
      const current = parseInt(prev);
      if (!prev || current < minStor) return minStor;
      return prev;
    });
  }, [ramGb, computationData]);

  // --- Dynamically calculate total price ---
  useEffect(() => {
    if (!ramGb || !storageTb || !dataGb || !computationData || !storageData || !datatransferData) {
      setTotalPrice(0);
      return;
    }

    try {
      const price = computePrice(
        parseInt(ramGb),
        parseInt(storageTb),
        parseInt(dataGb),
        computationData,
        storageData,
        datatransferData
      ) * parseInt(numMonths);
      setTotalPrice(price);
    } catch (err) {
      setTotalPrice(0);
    }
  }, [ramGb, storageTb, dataGb, numMonths, computationData, storageData, datatransferData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const ram = parseInt(ramGb);
    const storage = parseInt(storageTb);
    const data = parseInt(dataGb);
    const months = parseInt(numMonths);

    if (!ram || !storage || !data || !months) {
      setError('Please fill in all fields');
      return;
    }

    if (storage < minStorage) {
      setError(`Storage must be at least ${minStorage} TB for ${ram} GB RAM`);
      return;
    }

    if (data < minData) {
      setError(`Data Transfer must be at least ${minData} GB`);
      return;
    }

    setLoading(true);
    try {
      const newOrder = { ramGb: ram, storageTb: storage, dataGb: data, numMonths: months };
      await API.createOrder(newOrder);

      setSuccess('Order created successfully!');
      setRamGb('');
      setStorageTb('');
      setDataGb('');
      setNumMonths(1);
      setTotalPrice(0);

      if (onOrderChange) onOrderChange();
    } catch (err) {
      console.error(err);
      setError('Failed to create order');
    } finally {
      setLoading(false);
    }
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
              <Form.Select value={ramGb} onChange={e => setRamGb(e.target.value)}>
                {computationData.map(service => (
                  <optgroup key={service.name} label={service.name}>
                    <option key={`tier1-${service.ramTier1}`} value={service.ramTier1}>
                      {service.ramTier1} GB - €{service.priceTier1}/month
                    </option>
                    <option key={`tier2-${service.ramTier2}`} value={service.ramTier2}>
                      {service.ramTier2} GB - €{service.priceTier2}/month
                    </option>
                    <option key={`tier3-${service.ramTier3}`} value={service.ramTier3}>
                      {service.ramTier3} GB - €{service.priceTier3}/month
                    </option>
                  </optgroup>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Storage */}
          <Col md={3}>
            <Form.Group>
              <Form.Label>Storage (TB)</Form.Label>
              <Form.Control
                type="number"
                min={minStorage}
                value={storageTb}
                onChange={e => setStorageTb(e.target.value)}
                placeholder={`Min ${minStorage} TB`}
              />
              <Form.Text className="text-muted">
                Minimum storage required: {minStorage} TB
              </Form.Text>
            </Form.Group>
          </Col>

          {/* Data Transfer */}
          <Col md={3}>
            <Form.Group>
              <Form.Label>Data Transfer (GB)</Form.Label>
              <Form.Control
                type="number"
                min={minData}
                value={dataGb}
                onChange={e => setDataGb(e.target.value)}
                placeholder={`Min ${minData} GB`}
              />
              <Form.Text className="text-muted">
                Enter the amount of data transfer in GB
              </Form.Text>
            </Form.Group>
          </Col>

          {/* Months */}
          <Col md={3}>
            <Form.Group>
              <Form.Label>Months</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={numMonths}
                onChange={e => setNumMonths(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Total Price */}
        <Row className="mb-3">
          <Col>
            <h5>Total Price: €{totalPrice.toFixed(2)}</h5>
          </Col>
        </Row>

        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Create Order'}
        </Button>
      </Form>
    </div>
  );
}


function OldOrderLayout({ user, loggedIn, loggedInTotp, computationData, storageData, datatransferData, onOrderChange }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!user?.username) return;

    API.getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders'));
  }, [user]);


const handleCancelClick = (orderId) => {
  setOrderToCancel(orderId);
  setShowConfirm(true);
};

const confirmCancel = async () => {
  setCancelLoading(true);
  try {
    await API.deleteOrder(orderToCancel);
    setOrders(prev => prev.filter(o => o.orderId !== orderToCancel));

    if (onOrderChange) {
      onOrderChange(); // 🔄 refresh cloud status
    }

    setShowConfirm(false);
  } catch (err) {
    console.error(err);
    alert("Failed to cancel order.");
  } finally {
    setCancelLoading(false);
    setOrderToCancel(null);
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
              <th>Order ID</th><th>Subscribed</th><th>Expiring</th><th>RAM (GB)</th><th>Storage (TB)</th><th>Data (GB)</th><th>Tot Price (€)</th><th>Actions</th>
            </tr>
          </thead>
         <tbody>
            {orders.map((o, index) => {
              const subscribedDate = o.timestamp ? new Date(o.timestamp) : null;
              let expiringDate = null;

              // set the expiring date based on subscribed date and numMonths
              if (subscribedDate && o.numMonths) {
                expiringDate = new Date(subscribedDate.getTime());
                expiringDate.setMonth(expiringDate.getMonth() + o.numMonths);
              }

              // Calculate the cutoff date for cancellation: 1 month before expiring
              let cancelAllowed = false;
              if (expiringDate) {
                const today = new Date();
                const cutoffDate = new Date(expiringDate.getTime());
                cutoffDate.setMonth(cutoffDate.getMonth() - 1);
                cancelAllowed = today < cutoffDate;
              }

              // Inform the user about the reason why cancel is disabled
              let hoverText = '';
              if (!loggedInTotp) {
                hoverText = "Enable 2FA to cancel orders";
              } else if (!cancelAllowed) {
                hoverText = "Cannot cancel in the last month of subscription";
              }

              return (
                <tr key={o.orderId ?? index}>
                  <td>{o.orderId}</td>
                  <td>{subscribedDate ? subscribedDate.toLocaleDateString() : '–'}</td>
                  <td>{expiringDate ? expiringDate.toLocaleDateString() : '–'}</td>
                  <td>{o.ramGb}</td>
                  <td>{o.storageTb}</td>
                  <td>{o.dataGb}</td>
                  <td>{computePrice(o.ramGb, o.storageTb, o.dataGb, computationData, storageData, datatransferData)} €</td>
                  <td>
                    <span title={hoverText}>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleCancelClick(o.orderId)}
                        disabled={!loggedInTotp || !cancelAllowed}
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
        title="Cancel order"
        message="Are you sure you want to cancel this order?"
        confirmText="Yes, cancel"
        loading={cancelLoading}
        onConfirm={confirmCancel}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
    
  );
}

function ComputationCard({ service, used }) {
  const percent = service.maxInstances ? Math.round((used / service.maxInstances) * 100): 0;

  return (
    <div className="serviceCard">
      <h4 className="serviceCardTitle">{service.name}</h4>

      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      <p>{used}/{service.maxInstances} used</p>

      <table className="service-table">
        <thead>
          <tr><th>RAM</th><th>Price</th><th>Min Storage</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>{service.ramTier1}GB</td><td>{service.priceTier1}€/month</td><td>{service.minStorageTier1 != null ? `${service.minStorageTier1} TB` : '-'}</td></tr>
          <tr><td>{service.ramTier2}GB</td><td>{service.priceTier2}€/month</td><td>{service.minStorageTier2 != null ? `${service.minStorageTier2} TB` : '-'}</td></tr>
          <tr><td>{service.ramTier3}GB</td><td>{service.priceTier3}€/month</td><td>{service.minStorageTier3 != null ? `${service.minStorageTier3} TB` : '-'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function StorageCard({ service, used = 0 }) {
  const percent = service.maxGlobalStorage ? Math.round((used / service.maxGlobalStorage) * 100): 0;

  return (
    <div className="serviceCard">
      <h4 className="serviceCardTitle">{service.name}</h4>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
      </div>

      <p>{used}/{service.maxGlobalStorage} TB used</p>
      <p><strong>Min Storage per order:</strong> {service.minStorageTbPerOrder} TB</p>
      <p><strong>Price:</strong> €{service.price}/TB/month</p>
    </div>
  );
}

function DataTransferCard({ service, used = 0 }) {
  const percent = service.tier1 ? Math.round((used / service.tier1) * 100) : 0;

  const basePrice = service.base_price;
  const tier1Price = (service.base_price * service.tier1_multiplier).toFixed(2);
  const tier2Price = (service.base_price * service.tier2_multiplier).toFixed(2);

  return (
    <div className="serviceCard">
      <h4 className="serviceCardTitle">{service.name}</h4>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
      </div>

      <p>{used} GB used</p>

      <p><strong>Up to {service.base_tier} GB:</strong> €{basePrice}</p>
      <p><strong>Up to {service.tier1} GB:</strong> €{tier1Price}/GB</p>
      <p><strong>Above {service.tier1} GB:</strong> €{tier2Price}/GB</p>
    </div>
  );
}

function CloudStatusLayout({ computationData, storageData, datatransferData, cloudStatus, selectedRam, selectedStorage, selectedData }) {

  if (!computationData || !storageData || !datatransferData || !cloudStatus) {
    return <p>Loading cloud services info...</p>;
  }

  return (
    <div className="servicesGrid">
      {computationData.map(service => {
        const used = Math.min(service.maxInstances, cloudStatus?.usedComputation || 0);
        const ramSelected = parseInt(selectedRam) || 0;
        const isSelected = ramSelected === service.ramTier1 || ramSelected === service.ramTier2 || ramSelected === service.ramTier3;
        return (
          <ComputationCard 
            key={`computation-${service.id}`} 
            service={service} 
            used={used + (isSelected ? 1 : 0)} // highlight as "reserved" by new order
          />
        );
      })}

      {storageData.map(service => {
        const used = Math.min(service.maxGlobalStorage, cloudStatus?.usedStorage || 0);
        const storageSelected = parseInt(selectedStorage) || 0;
        return (
          <StorageCard
            key={`storage-${service.id}`}
            service={service}
            used={used + storageSelected} // dynamically reflect selected storage
          />
        );
      })}

      {datatransferData.map(service => {
        const used = cloudStatus?.usedData || 0;
        const dataSelected = parseInt(selectedData) || 0;
        return (
          <DataTransferCard
            key={`datatransfer-${service.id}`}
            service={service}
            used={used + dataSelected} // dynamically reflect selected data
          />
        );
      })}
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
const [selectedRam, setSelectedRam] = useState(null);
const [selectedStorage, setSelectedStorage] = useState(null);
const [selectedData, setSelectedData] = useState(null);

  const fetchCloudData = async () => {
      try {
        const [computation, storage, datatransfer, status] = await Promise.all([
          API.getComputationInfo(),
          API.getStorageInfo(),
          API.getDatatransferInfo(),
          API.getCloudStatus(),
        ]);

        setComputationData(computation);
        setStorageData(storage);
        setDatatransferData(datatransfer);
        setCloudStatus(status[0]);
      } catch (err) {
        console.error(err);
        setError('Failed to load cloud services info');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchCloudData();
  }, []);

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
  computationData={computationData}
  storageData={storageData}
  datatransferData={datatransferData}
  cloudStatus={cloudStatus}
  selectedRam={selectedRam}
  selectedStorage={selectedStorage}
  selectedData={selectedData}
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
  setSelectedRam={setSelectedRam}
  selectedStorage={selectedStorage}
  setSelectedStorage={setSelectedStorage}
  selectedData={selectedData}
  setSelectedData={setSelectedData}
  onOrderChange={fetchCloudData}
/>
            <OldOrderLayout
              loggedIn={props.loggedIn}
              user={props.user}
              loggedInTotp={props.loggedInTotp}
              computationData={computationData}
              storageData={storageData}
              datatransferData={datatransferData}
              onOrderChange={fetchCloudData}
            />
          </Col>
        </Row>
      )}
    </>
  );
}


export { CloudStatusLayout, GenericLayout, NotFoundLayout, LoginLayout, TotpLayout };