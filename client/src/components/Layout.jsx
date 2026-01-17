
import { Row, Col, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router';

import { useEffect, useState } from 'react';
import { Navigation } from './Navigation';
import { LoginForm, TotpForm } from './Auth';
import { computePrice, SHOW_MESSAGE_TIME, MAX_DATATRANSFER_GB } from './Utility.js';
import { ComputationCard, StorageCard, DataTransferCard, ConfirmDialog } from './Components.jsx';

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
  const { loggedIn, computationData, storageData, datatransferData, cloudStatus, selectedStorage, selectedData, availableRam, availableStorage } = props;

  if (!computationData || !storageData || !datatransferData || !cloudStatus) {
    return <p>Loading cloud services info...</p>;
  }

  return (
    <div className='-container'>
      <div className="servicesGrid">
      <ComputationCard loggedIn={loggedIn} computationData={computationData} cloudStatus={cloudStatus} availableRam={availableRam}/>
      <StorageCard loggedIn={loggedIn} storageData={storageData} cloudStatus={cloudStatus} selectedStorage={selectedStorage} availableStorage={availableStorage}/>
      <DataTransferCard loggedIn={loggedIn} datatransferData={datatransferData} cloudStatus={cloudStatus} selectedData={selectedData}/>
      </div>
    </div>
  );
}

function NewOrderLayout(props) {
  const { computationData, storageData, datatransferData, onOrderChange, selectedRam, setSelectedRam, selectedStorage, setSelectedStorage, selectedData, setSelectedData, availableRam, availableStorage, setSuccess, setError, loading, setLoading, simulateLoading } = props;
  
  const [totalPrice, setTotalPrice] = useState(0);
  const [minStorage, setMinStorage] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);

  const cd = computationData?.[0];
  const ramTier1 = cd?.ramTier1 || 16;
  const ramTier2 = cd?.ramTier2 || 32;
  const ramTier3 = cd?.ramTier3 || 128;

  // Update minStorage and price based on selected options
  useEffect(() => {
    if (selectedRam && computationData) {
      // Update minStorage based on selected RAM
      let minStor = 1;
      const ramValue = parseInt(selectedRam);
      
      switch (ramValue) {
        case ramTier1: minStor = computationData[0].minStorageTier1 ?? 1; break;
        case ramTier2: minStor = computationData[0].minStorageTier2 ?? 1; break;
        case ramTier3: minStor = computationData[0].minStorageTier3 ?? 1; break;
      }
      setMinStorage(minStor);
    }

    // Update price when all required data is available
    if (selectedRam && selectedStorage && selectedData) {
      try {
        const price = computePrice( parseInt(selectedRam), parseInt(selectedStorage), parseInt(selectedData), computationData, storageData, datatransferData);
        if(availableStorage)
          setTotalPrice(price);
      } catch (err) {
        setTotalPrice(0);
      }
    } else {
      setTotalPrice(0);
    }
  // }, [computationData, storageData, datatransferData, selectedRam, selectedStorage, selectedData]);
  }, [selectedRam, selectedStorage, selectedData]);

  // Once order is confirmed, create it via API and show success or error message
  const confirmOrder = async () => {
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
        setTimeout(() => setSuccess(null), SHOW_MESSAGE_TIME);
        // Reset form
        setSelectedRam('');
        setSelectedStorage(minStorage);
        setSelectedData(1);
        setTotalPrice(0);
        if (onOrderChange) onOrderChange();
      } else {
        setError('Not enough resources for this order!');
        setTimeout(() => setError(null), SHOW_MESSAGE_TIME);
        if (onOrderChange) onOrderChange();
      }
    } catch (err) {
      setError('Failed to create order');
      setTimeout(() => setError(null), SHOW_MESSAGE_TIME);
    } finally {
      setShowConfirm(false);
      simulateLoading();
    }
  };

  // Handle form submission: validate inputs and show confirmation dialog
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRam || !selectedStorage || !selectedData) {
      setError('Please fill in all fields');
      return;
    }

    if (selectedStorage < minStorage) {
      setError(`Storage must be at least ${minStorage} TB for ${selectedRam} GB RAM`);
      return;
    }

    if(selectedData > MAX_DATATRANSFER_GB){
      setError(`Data must be ${MAX_DATATRANSFER_GB} GB maximum`);
      return;
    }

    setLoading(true);
    setShowConfirm(true);
  };

  return (
    <div className="newOrder-container">
      <h4>Create New Order</h4>

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
              <Form.Control type="number" min={1} value={selectedData} onChange={e => setSelectedData(e.target.value)} placeholder={`Min 1 GB`}/>
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

      {/* Button disabled if resources are not available, if minStorage is not satisfied or if loading */}
        <Button 
          type="submit" 
          disabled={!availableRam || !availableStorage || loading || parseInt(selectedStorage) < minStorage}
          variant="primary"  
        >
          {loading 
            ? <><Spinner size="sm" className="me-2" /></>
            : !availableRam ? 'No RAM available': 
              !availableStorage ? 'Storage limit reached'
                : (parseInt(selectedStorage) < minStorage)
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
        onCancel={() => {setShowConfirm(false); setLoading(false);}}
      />
    </div>
  );
}

function OldOrderLayout (props){
  const { loggedInTotp, orders, onOrderChange, setSuccess, setError, loading, setLoading, simulateLoading} = props;

  const [showConfirm, setShowConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // show the confirm box
  const handleCancelClick = (orderId) => {
    if(loggedInTotp){
      setOrderToCancel(orderId);
      setShowConfirm(true);
      setLoading(true);
    }
  };

  // actually perform the deletion of the order if properly logged in
  const confirmCancel = async () => {
    if(loggedInTotp){
      setLoading(true);
      try {
        await API.deleteOrder(orderToCancel);
        setSuccess("Deleted order successfully")
        if (onOrderChange) onOrderChange(); 
        setShowConfirm(false);
      } catch (err) {
        setError("Failed to cancel order.");
      } finally {
        setShowConfirm(false);
        simulateLoading();
        setOrderToCancel(null);
      }
    }
  };

  return (
    <div className="oldOrder-container">
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
                        disabled={!loggedInTotp || loading}  
                        title={hoverText}
                      >
                        {loading ? (
                          <Spinner size="sm" className="me-1" />  
                        ) : (
                          <i className='bi bi-trash'></i>
                        )}
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
        onConfirm={confirmCancel}
        onCancel={() => { setShowConfirm(false); setLoading(false); }} 
      />
    </div>
  );
}

function GenericLayout(props) {
  const [computationData, setComputationData] = useState([]);
  const [storageData, setStorageData] = useState([]);
  const [datatransferData, setDatatransferData] = useState([]);
  const [cloudStatus, setCloudStatus] = useState(null);
  const [genericLoading, setGenericLoading] = useState(true);

  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  
  const [availableRam, setAvailableRam] = useState(true);
  const [availableStorage, setAvailableStorage] = useState(true);

  // permit dynamic changes in OldOrderLayout while the user add (via NewOrderLayout) or delete orders (via OldOrderLayout)
  const [orders, setOrders] = useState([]);

  // permit dynamic changes in CloudStatusLayout while user changes value via NewOrderLayout
  const [selectedRam, setSelectedRam] = useState(""); 
  const [selectedStorage, setSelectedStorage] = useState(1); 
  const [selectedData, setSelectedData] = useState(""); 

  
  const simulateLoading = () => {
    setTimeout(() => {setLoading(false);}, SHOW_MESSAGE_TIME);
  };
  
  // Errors and Success show for 2 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), SHOW_MESSAGE_TIME);
      return () => clearTimeout(timer);
    }

    if (error) {
      const timer = setTimeout(() => setError(null), SHOW_MESSAGE_TIME);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // get all the cloud data: not only CloudStatus, but also services configurations/options (prices, minStorage, ecc.)
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
      
      // for NewOrderLayout 
      if(props.loggedIn || props.loggedInTotp){
        setSelectedRam(computation[0]?.ramTier1 ?? "");
        setSelectedStorage(storage[0]?.minStorageTbPerOrder ?? 1);
        setSelectedData(datatransfer[0]?.base_tier ?? 1);
      }
      
    } catch (err) {
      setError('Failed to load cloud services info');
    } finally {
      setGenericLoading(false);
    }
  };

  // get all the orders
  const fetchOrders = async () => {
    try {
      const fetched = await API.getOrders();
      setOrders(fetched);
    } 
    catch (err) {
      setError('Failed to fetch orders');
    }
  };

  // prepare data after login/logout
  useEffect(() => {
    fetchCloudData()

    if (!props.loggedIn && !props.loggedInTotp) {
      setSelectedRam("");
      setSelectedStorage("");
      setSelectedData("");
    }

    if (props.loggedIn)
      fetchOrders();
    
  }, [props.loggedIn, props.loggedInTotp]);
  
  // Check for check for RAM and storage availability based on used resources
  // (used + selected <= max + RAM min requirements)
  useEffect(() => {
    if(cloudStatus?.usedComputation && computationData?.[0].maxInstances)
      setAvailableRam(cloudStatus.usedComputation < computationData[0].maxInstances);

    // Check global storage limit based on overall used + selected storage
    let isStorageAvailable = true;
    if (cloudStatus?.usedStorage && storageData?.[0]?.maxGlobalStorage) {
      const tot = cloudStatus.usedStorage + parseInt(selectedStorage || 1);
      isStorageAvailable = (tot <= storageData[0].maxGlobalStorage);
    }
    setAvailableStorage(isStorageAvailable);
  }, [cloudStatus, computationData, storageData, selectedStorage]);


  if (genericLoading) return <p>Loading cloud services info...</p>;

  return (
    <>
      <Row> 
        <Col>
          <Navigation loggedIn={props.loggedIn} user={props.user} loggedInTotp={props.loggedInTotp} logout={props.logout} />
        </Col>
      </Row>

      <Row>
        <Col>
          <CloudStatusLayout
            loggedIn={props.loggedIn}
            computationData={computationData}
            storageData={storageData}
            datatransferData={datatransferData}
            cloudStatus={cloudStatus}
            selectedStorage={selectedStorage}
            selectedData={selectedData}
            availableRam={availableRam}
            availableStorage={availableStorage}
          />
        </Col>
      </Row>

      <Row className='message-container'>
          {error && <Alert variant="danger">{error}</Alert>}  
          {success && <Alert variant="success">{success}</Alert>}  
      </Row>
      
      {props.loggedIn && (
        <Row>
          <Col md={6}>
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
              availableRam={availableRam}
              availableStorage={availableStorage}
              success={success}
              setSuccess={setSuccess}
              error={error}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
              simulateLoading={simulateLoading}
              onOrderChange={() => {
                fetchCloudData();
                fetchOrders();
              }}
            />
          </Col>
          <Col md={6}>
            <OldOrderLayout
              loggedIn={props.loggedIn}
              loggedInTotp={props.loggedInTotp}
              orders={orders}
              setSuccess={setSuccess}
              setError={setError}
              loading={loading}
              setLoading={setLoading}
              simulateLoading={simulateLoading}
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