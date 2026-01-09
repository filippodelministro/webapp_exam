
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

// function CloudStatusLayout(props) {
//   const [serviceStatus, setServiceStatus] = useState({
//     computational: { used: 0, max: 0 },
//     storage: { used: 0, max: 0 },
//     dataTransfer: { used: 0, max: 0 },
//   });

//   useEffect(() => {
//     // Fetch service usage from the server
//     API.getServiceUsage()
//       .then((data) => {
//       console.log("Raw API response:", data);
//         // Transform API response into the format we need
//         const status = {
//           computational: { used: 0, max: 0 },
//           storage: { used: 0, max: 0 },
//           dataTransfer: { used: 0, max: 0 },
//         };

//         data.forEach((service) => {
//           if (service.service_name === "computation") {
//             status.computational.used = service.used_value;
//             status.computational.max = service.total_value;
//           } else if (service.service_name === "storage") {
//             status.storage.used = service.used_value;
//             status.storage.max = service.total_value;
//           } else if (service.service_name === "data_transfer") {
//             status.dataTransfer.used = service.used_value;
//             status.dataTransfer.max = service.total_value;
//           }
//         });

//         setServiceStatus(status);
//       })
//       .catch((err) => {
//         console.error("Error fetching service usage:", err);
//       });
//   }, []);

//   return (
//     <>
//       <h2>Cloud Status</h2>
  
//       <Row className="g-4">
//         {/* Computational Service Box */}
//         <Col md={4}>
//           <Card>
//             <Card.Body>
//               <Card.Title>Computational Instances</Card.Title>
//               <Card.Text>
//                 {serviceStatus.computational.used} / {serviceStatus.computational.max} instances in use
//               </Card.Text>
//               <ProgressBar
//                 now={(serviceStatus.computational.used / serviceStatus.computational.max) * 100 || 0}
//                 label={`${Math.round((serviceStatus.computational.used / serviceStatus.computational.max) * 100) || 0}%`}
//               />
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Storage Service Box */}
//         <Col md={4}>
//           <Card>
//             <Card.Body>
//               <Card.Title>Storage</Card.Title>
//               <Card.Text>
//                 {serviceStatus.storage.used}TB / {serviceStatus.storage.max}TB used
//               </Card.Text>
//               <ProgressBar
//                 now={(serviceStatus.storage.used / serviceStatus.storage.max) * 100 || 0}
//                 label={`${Math.round((serviceStatus.storage.used / serviceStatus.storage.max) * 100) || 0}%`}
//               />
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Data Transfer Service Box */}
//         <Col md={4}>
//           <Card>
//             <Card.Body>
//               <Card.Title>Data Transfer</Card.Title>
//               <Card.Text>
//                 {serviceStatus.dataTransfer.used}TB / {serviceStatus.dataTransfer.max}TB used
//               </Card.Text>
//               <ProgressBar
//                 now={(serviceStatus.dataTransfer.used / serviceStatus.dataTransfer.max) * 100 || 0}
//                 label={`${Math.round((serviceStatus.dataTransfer.used / serviceStatus.dataTransfer.max) * 100) || 0}%`}
//               />
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </>
//   );
// }


function CloudStatusLayout() {
const [storageValue, setStorageValue] = useState(null);

useEffect(() => {
  async function getUsage() {
    const data = await API.getServiceUsage();
    if (data && data.length > 0) {
      setStorageValue(data[0].global_value);
    }
  }

  getUsage();
}, []);

return (
  <div>
    <h2>Cloud Status</h2>
    <p>Storage available: {storageValue !== null ? storageValue : 'Loading...'}</p>
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
