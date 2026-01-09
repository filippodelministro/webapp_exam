'use strict';

/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');  // logging middleware
const { check, validationResult, oneOf } = require('express-validator'); // validation middleware
const cors = require('cors');

const cloudDao = require('./dao-cloud'); // module for accessing the films table in the DB
const userDao = require('./dao-users'); // module for accessing the user table in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use(express.json());


/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)


const base32 = require('thirty-two');
const TotpStrategy = require('passport-totp').Strategy; // totp


/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if(!user)
    return callback(null, false, 'Incorrect username or password');  
    
  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + username + name 
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name 
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));

  return callback(null, user); // this will be available in req.user
});

/** Creating the session */
const session = require('express-session');

app.use(session({
  secret: "shhhhh... it's a secret! - change it for the exam!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


passport.use(new TotpStrategy(
  function (user, done) {
    // In case .secret does not exist, decode() will return an empty buffer
    return done(null, base32.decode(user.secret), 30);  // 30 = period of key validity
  })
);

/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

function isTotp(req, res, next) {
  if(req.session.method === 'totp')
    return next();
  return res.status(401).json({ error: 'Missing TOTP authentication'});
}



/*** Utility Functions ***/

// Make sure to set a reasonable value (not too small!) depending on the application constraints
// It is recommended (but NOT strictly required) to have a limit here or in the DB constraints
// to avoid malicious requests waste space in DB and network bandwidth.
const maxTitleLength = 160;


// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};


/*** Cloud Service APIs ***/

// todo: da cambiare 
// GET /api/services-usage
// Returns usage statistics for storage, computation, and data_transfer services.
app.get('/api/services-usage', (req, res) => {
  cloudDao.getServiceUsage()
    .then((data) => res.json(data))
    .catch((err) => res.status(500).json({ error: 'Errore nel recupero delle squadre' }));
});


// GET /api/computation-info
// Returns usage statistics for storage, computation, and data_transfer services.
app.get('/api/computation-info', (req, res) => {
  cloudDao.getComputationInfo()
    .then((data) => res.json(data))
    .catch((err) => res.status(500).json({ error: 'Errore nel recupero delle squadre' }));
});


/*** Users APIs ***/

function clientUserInfo(req) {
  const user=req.user;
	return {id: user.id, username: user.username, name: user.name, canDoTotp: user.secret? true: false, isTotp: req.session.method === 'totp'};
}

// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json({ error: info});
      }
      // success, perform the login and extablish a login session
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from userDao.getUser() in LocalStratecy Verify Fn
        return res.json(clientUserInfo(req));
      });
  })(req, res, next);
});

app.post('/api/login-totp', isLoggedIn,
  // DEBUG: function(req,res,next){ console.log('DEBUG2: '+JSON.stringify(req.user)); next();},
  passport.authenticate('totp'),   // passport expect the totp value to be in: body.code
  function(req, res) {
    //console.log('DEBUG1: '+JSON.stringify(req.user));
    req.session.method = 'totp';
    res.json({otp: 'authorized'});
  }
);

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(clientUserInfo(req));}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});



// Activating the server
const PORT = 3001;
// Activate the server
app.listen(PORT, (err) => {
  if (err)
    console.log(err);
  else 
    console.log(`Server listening at http://localhost:${PORT}`);
}); 
