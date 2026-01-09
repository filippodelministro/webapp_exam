
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

function OldOrderLayout(props) {
    return (
    <>
      <h2>Old order Layout</h2>
    </>
  );
}

function computationCard(service, used = 0) {
  const percent = service.maxInstances ? Math.round((used / service.maxInstances) * 100) : 0;

  return (
    <div key={service.id} className="serviceCard">
      <h4 className="serviceCardTitle">{service.name}</h4>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
      </div>
      <p>{used}/{service.maxInstances} used</p>

      <p><strong>RAM:</strong> {service.ramTier1}/{service.ramTier2}/{service.ramTier3} GB</p>
      <p><strong>MinStorage:</strong> {service.minStorageTier1 ?? '–'}/{service.minStorageTier2 ?? '–'}/{service.minStorageTier3 ?? '–'} GB</p>
      <p><strong>Price:</strong> €{service.priceTier1}/€{service.priceTier2}/€{service.priceTier3}</p>
    </div>
  );
}

function storageCard(service, used = 0) {
  const percent = service.maxGlobalStorage ? Math.round((used / service.maxGlobalStorage) * 100) : 0;

  return (
    <div key={service.id} className="serviceCard">
      <h4 className="serviceCardTitle">{service.name}</h4>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
      </div>
      <p>{used}/{service.maxGlobalStorage} TB used</p>

      <p><strong>MinStorage per order:</strong> {service.minStorageTbPerOrder}TB</p>
      <p><strong>Price:</strong> €{service.price}/TB/month</p>
    </div>
  );
}

function datatransferCard(service, used = 0) {
  const percent = service.tier1 ? Math.round((used / service.tier1) * 100) : 0;

  const basePrice = service.base_price;
  const tier1Price = (service.base_price * service.tier1_multiplier).toFixed(2);
  const tier2Price = (service.base_price * service.tier2_multiplier).toFixed(2);

  return (
    <div key={service.id} className="serviceCard">
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
  const computationPercent = totalComputation ? Math.round((usedComputation / totalComputation) * 100) : 0;

  const totalStorage = storageData.reduce((acc, svc) => acc + svc.maxGlobalStorage, 0);
  const usedStorage = cloudStatus?.usedStorage || 0;
  const storagePercent = totalStorage ? Math.round((usedStorage / totalStorage) * 100) : 0;

  const totalData = datatransferData.reduce((acc, svc) => acc + svc.tier1, 0); 
  const usedData = cloudStatus?.usedData || 0;
  const dataPercent = totalData ? Math.round((usedData / totalData) * 100) : 0;

  return (
    <div>

      {/* Service cards */}
        <div className="servicesGrid">
          {/* Computation cards */}
          {computationData.map(service => {
            const used = Math.min(service.maxInstances, cloudStatus?.usedComputation || 0);
            return computationCard(service, used);
          })}

          {/* Storage cards */}
          {storageData.map(service => {
            const used = Math.min(service.maxGlobalStorage, cloudStatus?.usedStorage || 0);
            return storageCard(service, used);
          })}

          {/* Data transfer cards */}
          {datatransferData.map(service => {
            const used = cloudStatus?.usedData || 0;
            return datatransferCard(service, used);
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
          <NewOrderLayout />
          <OldOrderLayout />
        </Col>
      </Row>
    )}

    {/* Cancel button only if logged in and 2FA enabled */}
    {props.loggedIn && props.loggedInTotp && (
      <Row className="mt-4">
        <Col>
          <button className="btn btn-danger">Cancel Order</button>
        </Col>
      </Row>
    )}
  </>
);
}


export { CloudStatusLayout, GenericLayout, NotFoundLayout, LoginLayout, TotpLayout };
