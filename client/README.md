# Exam #4: "Cloud Service"
## Student: s332087 FILIPPO DEL MINISTRO

## React Client Application Routes


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
            "orderId": 1,
            "timestamp":  "DD/MM/YYYY"
            "ramGb": 1
            "storageTb": 10
            "dataGb": 10
            "total_price": 121
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


<!-- todo -->
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