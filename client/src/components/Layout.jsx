
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
    <div
      key={service.id}
      style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        width: '250px',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <h3>{service.name}</h3>
      <p><strong>Max Instances:</strong> {service.maxInstances}</p>
      <div>
        <h4>RAM (GB)</h4>
        <p>Tier 1: {service.ramTier1}</p>
        <p>Tier 2: {service.ramTier2}</p>
        <p>Tier 3: {service.ramTier3}</p>
      </div>
      <div>
        <h4>Min Storage (GB)</h4>
        <p>Tier 1: {service.minStorageTier1}</p>
        <p>Tier 2: {service.minStorageTier2}</p>
        <p>Tier 3: {service.minStorageTier3}</p>
      </div>
      <div>
        <h4>Price ($)</h4>
        <p>Tier 1: {service.priceTier1}</p>
        <p>Tier 2: {service.priceTier2}</p>
        <p>Tier 3: {service.priceTier3}</p>
      </div>
    </div>
  );
}

function CloudStatusLayout() {
  const [computationData, setComputationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await API.getComputationInfo();
        setComputationData(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load computation info');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading computation info...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {computationData.map((service) => computationCardStyle(service))}

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
