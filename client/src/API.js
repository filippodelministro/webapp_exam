import dayjs from 'dayjs';

const SERVER_URL = 'http://localhost:3001/api/';


/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj => 
              reject(obj)
              ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => 
        reject({ error: "Cannot communicate"  })
      ) // connection error
  });
}


/*** Cloud API calls ***/


const getComputationInfo = async () => {
  const data = await getJson(
    fetch(SERVER_URL + 'computation-info', { credentials: 'include' })
  );
  return data;
};

const getStorageInfo = async () => {
  const data = await getJson(
    fetch(SERVER_URL + 'storage-info', { credentials: 'include' })
  );
  return data;
};

const getDatatransferInfo = async () => {
  const data = await getJson(
    fetch(SERVER_URL + 'datatransfer-info', { credentials: 'include' })
  );
  return data;
};

const getCloudStatus = async () => {
  const data = await getJson(
    fetch(SERVER_URL + 'cloud-info', { credentials: 'include' })
  );
  return data;
};

/*** Authentication functions ***/

/**
 * This function wants the TOTP code
 * It executes the 2FA.
 */
const totpVerify = async (totpCode) => {
  return getJson(fetch(SERVER_URL + 'login-totp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
    body: JSON.stringify({code: totpCode}),
  })
  )
};


/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
 */
const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
    body: JSON.stringify(credentials),
  })
  )
};

/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    // this parameter specifies that authentication cookie must be forwarded
    credentials: 'include'
  })
  )
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async() => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
  })
  )
}

const API = { getComputationInfo, getStorageInfo, getDatatransferInfo, getCloudStatus,
              logIn, getUserInfo, logOut, totpVerify };
export default API;
