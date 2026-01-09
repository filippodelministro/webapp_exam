/*
 * Web Applications
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import dayjs from 'dayjs';

import { React, useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Routes, Route, Outlet, Link, useParams, Navigate, useNavigate } from 'react-router';

import { GenericLayout, NotFoundLayout, LoginLayout, TotpLayout } from './components/Layout';
import API from './API.js';

function App() {

  const navigate = useNavigate();  // To be able to call useNavigate, the component must already be in BrowserRouter, done in main.jsx

  // This state keeps track if the user is currently logged-in.
  const [loggedIn, setLoggedIn] = useState(false);
  // This state contains the user's info.
  const [user, setUser] = useState(null);
  const [loggedInTotp, setLoggedInTotp] = useState(false);

  // If an error occurs, the error message will be shown using a state.
  const handleErrors = (err) => {
    //console.log('DEBUG: err: '+JSON.stringify(err));
    let msg = '';
    if (err.error)
      msg = err.error;
    else if (err.errors) {
      if (err.errors[0].msg)
        msg = err.errors[0].msg + " : " + err.errors[0].path;
    } else if (Array.isArray(err))
      msg = err[0].msg + " : " + err[0].path;
    else if (typeof err === "string") msg = String(err);
    else msg = "Unknown Error";

    setMessage(msg); // WARNING: a more complex application requires a queue of messages. In this example only the last error is shown.

    if (msg === 'Not authenticated')
      setTimeout(() => {  // do logout in the app state
        setUser(undefined); setLoggedIn(false); setLoggedInTotp(false); setDirty(true);
      }, 2000);
    else
      setTimeout(()=>setDirty(true), 2000);  // Fetch the current version from server, after a while
  }

  useEffect(()=> {
    const checkAuth = async() => {
      try {
        // here you have the user info, if already logged in
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
        if (user.isTotp)
          setLoggedInTotp(true);
      } catch(err) {
        // NO need to do anything: user is simply not yet authenticated
        //handleError(err);
      }
    };
    checkAuth();
  }, []);  // The useEffect callback is called only the first time the component is mounted.


 /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      // error is handled and visualized in the login form, do not manage error, throw it
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */ 
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setLoggedInTotp(false);
    // clean up everything
    setUser(null);
  };

  return (
    <Container fluid>
      <Routes>
        <Route path="/" element={<GenericLayout loggedIn={loggedIn} loggedInTotp={loggedInTotp} user={user} logout={handleLogout} />} />
        <Route path='/login' element={ <LoginWithTotp loggedIn={loggedIn} login={handleLogin}user={user} setLoggedInTotp={setLoggedInTotp} /> } />

        <Route path="*" element={<NotFoundLayout />} />
      </Routes>
    </Container>
  );
}

function LoginWithTotp(props) {
  if (props.loggedIn) {
    if (props.user.canDoTotp) {
      if (props.loggedInTotp) {
        return <Navigate replace to='/' />;
      } else {
        return <TotpLayout totpSuccessful={() => props.setLoggedInTotp(true)} />;
      }
    } else {
      return <Navigate replace to='/' />;
    }
  } else {
    return <LoginLayout login={props.login} />;
  }
}

export default App;
