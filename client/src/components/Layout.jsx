
import { Row, Col, Button, Spinner, Alert, Toast, Card, ProgressBar } from 'react-bootstrap';
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
  
function NewOrderLayout(props) {
    return (
    <>
      <h2>New order Layout</h2>
    </>
  );
}

function OldOrderLayout({ user, loggedIn, loggedInTotp }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.username) return;
    API.getOrders()
    .then(setOrders)
      .catch(() => setError('Failed to load orders'));
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await API.cancelOrder(orderId);
      setOrders(prev => prev.filter(o => o.orderId !== orderId));
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order.");
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
                  <td>da calcolare prezzi</td>
                  <td>
                    <span title={hoverText}>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleCancel(o.orderId)}
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

function CloudStatusLayout() {
  const [computationData, setComputationData] = useState([]);
  const [storageData, setStorageData] = useState([]);
  const [datatransferData, setDatatransferData] = useState([]);
  const [cloudStatus, setCloudStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, []);

  if (loading) return <p>Loading cloud services info...</p>;
  if (error) return <p>{error}</p>;

  // Calculate totals
  const totalComputation = computationData.reduce((acc, svc) => acc + svc.maxInstances, 0);
  const usedComputation = cloudStatus?.usedComputation || 0;
  // const computationPercent = totalComputation ? Math.round((usedComputation / totalComputation) * 100) : 0;

  const totalStorage = storageData.reduce((acc, svc) => acc + svc.maxGlobalStorage, 0);
  const usedStorage = cloudStatus?.usedStorage || 0;
  // const storagePercent = totalStorage ? Math.round((usedStorage / totalStorage) * 100) : 0;

  const totalData = datatransferData.reduce((acc, svc) => acc + svc.tier1, 0); 
  const usedData = cloudStatus?.usedData || 0;
  // const dataPercent = totalData ? Math.round((usedData / totalData) * 100) : 0;

  return (
    <div>

      {/* Service cards */}
        <div className="servicesGrid">
          {computationData.map(service => {
            const used = Math.min(service.maxInstances, cloudStatus?.usedComputation || 0);
            return (
              <ComputationCard 
                key={`computation-${service.id}`} 
                service={service} 
                used={used} 
              />
            );
          })}

          {storageData.map(service => {
            const used = Math.min(service.maxGlobalStorage, cloudStatus?.usedStorage || 0);
            return (
              <StorageCard
                key={`storage-${service.id}`}
                service={service}
                used={used}
              />
            );
          })}

          {datatransferData.map(service => {
            const used = cloudStatus?.usedData || 0;
            return (
              <DataTransferCard
                key={`datatransfer-${service.id}`}
                service={service}
                used={used}
              />
            );
          })}
        </div>
    </div>
  );
}


function GenericLayout(props) {

  return (
    <>
      <Row>
        <Col>
          <Navigation loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout} />
        </Col>
      </Row>

    {/* Cloud Status always visible */}
    <Row className="g-4 mt-4">
      <Col>
        <CloudStatusLayout />
      </Col>
    </Row>

    {/* Orders visible only if logged in */}
    {props.loggedIn && (
      <Row className="g-4 mt-5">
        <Col>
          <h3>Orders</h3>
          <NewOrderLayout loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout} />
          <OldOrderLayout loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout} />
        </Col>
      </Row>
    )}
  </>
);
}


export { CloudStatusLayout, GenericLayout, NotFoundLayout, LoginLayout, TotpLayout };
