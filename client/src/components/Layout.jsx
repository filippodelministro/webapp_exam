
import { Row, Col, Button, Spinner, Alert, Toast, Card, ProgressBar, Modal } from 'react-bootstrap';
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

function CloudStatusLayout(props) {
  return (
    <Row>
      <Col>
        <h2>cloudStatus</h2>
      </Col>
    </Row>
  );
}

function NewOrderLayout(props) {
  return (
    <Row>
      <Col>
        <h2>new order</h2>
      </Col>
    </Row>
  );
}

// confirmf Dialog get properties to be showed from the caller
function ConfirmDialog({ show, title, message, confirmText, cancelText, variant, loading, onConfirm, onCancel,}) {
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

function OldOrderLayout({ user, loggedIn, loggedInTotp, computationData, storageData, datatransferData, onOrderChange }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!user?.username && loggedIn) return;

    API.getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders'));
  }, [user]);

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
        setOrders(prev => prev.filter(o => o.orderId !== orderToCancel));

        if (onOrderChange) {
          onOrderChange(); 
        }

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
                  {/* <td>{computePrice(o.ramGb, o.storageTb, o.dataGb, computationData, storageData, datatransferData)} €</td> */}
                  <td>{o.total_price}€</td>
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
          title="Delete order"
          confirmText="Yes, delete"
          cancelText="Cancel"
          variant="danger"
          message="Are you sure you want to delete this order?"
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

      <Row className="g-4 mt-4">
        <Col>
          <CloudStatusLayout 
          loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout}
          computationData={computationData} storageData={storageData} datatransferData={datatransferData} cloudStatus={cloudStatus}
          />
        </Col>
      </Row>

      {props.loggedIn && (
        <Row className="g-4 mt-5">
          <Col>
            <h3>Orders</h3>
            <NewOrderLayout 
              // loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout}
              // computationData={computationData} storageData={storageData} datatransferData={datatransferData} cloudStatus={cloudStatus}
            />
            <OldOrderLayout 
              loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout}
              computationData={computationData} storageData={storageData} datatransferData={datatransferData} cloudStatus={cloudStatus}
            />  
          </Col>
        </Row>
      )}
    </>
  );
}



export { GenericLayout, NotFoundLayout, LoginLayout, TotpLayout };
