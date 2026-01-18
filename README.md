# Exam #4: "Cloud Service"
## Student: s332087 FILIPPO DEL MINISTRO

## React Client Application Routes
- Route `/`
    1. When no one is logged in, it displays the navigation bar and cloud service status through the services cards (ComputationCard, StorageCard, DataTransferCard)
    2. When a user is logged in, their order history is shown via OldOrderLayout. Users can create new orders via NewOrderLayout, selecting RAM, storage, and data transfer amounts. CloudStatusLayout dinamically shows current resource usage.
- Route `/login`
    - Displays LoginLayout for email/password authentication
    - If user has 2FA enabled, redirects to TotpLayout after initial login
    - Successful login navigates to `/`
- Route `*` 
    - Displays NotFoundLayout (404 page)

## API server

* **GET `/api/computation-info`**: Retrieves all the computation info (config info, prices, options, ecc.) from the server.
  - **Response body**:
    ```
    [
        {
            "id" = 1,
            "name" = "computation", 
            "maxInstances" = 6,
            "ramTier1" = 16,
            "ramTier2" = 32,
            "ramTier3" = 128,
            "minStorageTier1" = 1, 
            "minStorageTier2" = 10,
            "minStorageTier3" = 20,
            "priceTier1" = 10,
            "priceTier2" = 20,
            "priceTier3" = 40
        }
    ]
    ```
  - Codes: `200 OK`, `500 Internal Server Error`
  * **GET `/api/storage-info`**: Retrieves all the storage info (config info, prices, options, ecc.) from the server.
    - **Response body**:
    ```
    [
        {
            "id": 2,
            "name": "storage",
            "price": 10,
            "minStorageTbPerOrder": 1,
            "maxGlobalStorage": 100
        },
    ]
    ```
  - Codes: `200 OK`, `500 Internal Server Error`

  * **GET `/api/datatransfer-info`**: Retrieves all the data transfer info (config info, prices, options, ecc.) from the server.
    - **Response body**:
    ```
    [
        {
        "id": 3,
        "name": "datatransfer",
        "base_tier": 10,
        "tier1": 1000,
        "base_price": 1,
        "tier1_multiplier": 0.8,
        "tier2_multiplier": 0.5
        }
    ]
    ```
  - Codes: `200 OK`, `500 Internal Server Error`


  * **GET `/api/cloud-info`**: Retrieves cloud status (used resources depending on the orders)
  - **Response body**:
    {
        "usedComputation": 4,
        "usedStorage": 70,
        "usedData": 260
    }
  - Codes: `200 OK`, `500 Internal Server Error`


  * **GET `/api/orders`**: Retrieve all orders for the authenticated user.
  - **Parameters**
    1. userId as an INT $\ge$ 1
    ```
      {
        "userId": 1
      }
    ```
  - **Response body**:
    [
        {
        "orderId":1,
        "timestamp": "YYYY-MM-DD HH:MM:SS",
        "ramGb":32,
        "storageTb":10,
        "dataGb":10,
        "total_price":121
        }
        ...
    ]
  - Codes: `200 OK`, `500 Internal Server Error`


* **DELETE `'/api/orders/:orderId`**: Delete a specific order by orderId.
    - **Parameters**
    1. orderId as an INT $\ge$ 1
    ```
      {
        "orderId": 1
      }
    ```
  - **Response body**: if all the reservation are inserted successfully, it returns the number of modified lines in the database.
  - Codes: `200 OK`, `422 Unprocessable Content`, `500 Internal Server Error`


* **POST `/api/new-orders`**: Create a new order for given all the order detail and userId.
  - **Request body**: 
    - ramGb: INT $\ge$ 1
    - storageTb: INT $\ge$ 1
    - dataGb: INT $\ge$ 1
    - total_price: FLOAT $\ge$ 1
    ```
      {
        "ramGb": 16
        "storageTb": 1
        "dataGb": 1 
        "total_price": 21
      }
    ```
  - **Response body**: if all the reservation are inserted successfully:
    ```
        {
            success: true
        }
    ```
  - Codes: `201 Created`, `500 Internal Server Error`


## Database Tables

- Table `users` - contains user accounts with:
     id, email, name, hash, salt, secret
- Table `computation` - contains computation service details with:
     service_id, name, max_instances, ram tiers, min storage requirements, price tiers
- Table `storage` - contains storage service pricing with:
     service_id, name, price_eur_per_tb_per_month, min/max storage limits
- Table `datatransfer` - contains data transfer pricing with:
    service_id, name, base_tier, tier1, base_price, tier multipliers
- Table `orders` - contains user orders with:
    order_id, user_id, timestamp, ram_gb, storage_tb, data_gb, total_price

## Main React Components

- `AppWithRouter` (in `App.jsx`): technically a component, takes the role of App and is rendered inside a Router to be able to use the useNavigate hook. This maintains most of the state of the app.
- `GenericLayout` (in `App.jsx`): it is the component where all the other components are.
- `CloudStatusLayout` (in `Layout.jsx`): displays current cloud resource usage and status
    - `ComputationCard` (in `Components.jsx`): shows computation instances and RAM info
    - `StorageCard` (in `Components.jsx`): displays storage allocation and info
    - `DataTransferCard` (in `Components.jsx`): shows data transfer volume and info
- `NewOrderLayout` (in `Layout.jsx`): handles new order creation form
- `OldOrderLayout` (in `Layout.jsx`): displays user's order history and deleting button (if 2FA authenticated)
- `ConfirmDialog` (in `Components.jsx`): confirmation pop-up for order and deletion submission
- `NotFoundLayout` (in `Layout.jsx`): 404 error page
- `LoginLayout` (in `Layout.jsx`): responsible for handling the login page
- `TotpLayout` (in `Layout.jsx`): responsible for handling 2FA login page
- `Navigation` (in `Navigation.jsx`): handles the navigation bar on top of the page



## Users Credentials

| email      |   name | plain-text password |
|------------|--------|---------------------|
| u1@p.it    | John   | pwd                 |
| u2@p.it    | Alice  | pwd                 |
| u3@p.it    | George | pwd                 |
| u4@p.it    | David  | pwd                 |

