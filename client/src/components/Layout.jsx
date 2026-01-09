
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

function computationCardStyle(service) {
  return (
    <div key={service.id} className="serviceCard">
      <h4 className="serviceCardTitle">{service.name}</h4>
      <p><strong>Max:</strong> {service.maxInstances}</p>
      <div>
        <p><strong>RAM:</strong> {service.ramTier1}/{service.ramTier2}/{service.ramTier3} GB</p>
        <p><strong>MinStorage:</strong> {service.minStorageTier1 ?? '–'}/{service.minStorageTier2 ?? '–'}/{service.minStorageTier3 ?? '–'} GB</p>
        <p><strong>Price:</strong> €{service.priceTier1}/€{service.priceTier2}/€{service.priceTier3}</p>
      </div>
    </div>
  );
}

function storageCardStyle(service) {
  return (
    <div key={service.id} className="serviceCard">
      <h4 className="serviceCardTitle">{service.name}</h4>
      <p><strong>Max:</strong> {service.maxGlobalStorage}</p>
      <div>
        {/* <p><strong>RAM:</strong> {service.ramTier1}/{service.ramTier2}/{service.ramTier3} GB</p> */}
        <p><strong>MinStorage per order:</strong> {service.minStorageTbPerOrder}TB</p>
        <p><strong>Price:</strong> €{service.price}/TB/month</p>
      </div>
    </div>
  );
}

function CloudStatusLayout() {
  const [computationData, setComputationData] = useState([]);
  const [storageData, setStorageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [computation, storage] = await Promise.all([
          API.getComputationInfo(),
          API.getStorageInfo(),
        ]);
        setComputationData(computation);
        setStorageData(storage);
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

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {computationData.map((service) => computationCardStyle(service))}
      {storageData.map((service) => storageCardStyle(service))}
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
