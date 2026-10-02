# Electrical Stock Monitoring and Management System — API Documentation

This document specifies the complete REST API for the Electrical Stock Monitoring and Management System, developed with Node.js, Express, MongoDB, Mongoose, and JWT.

---

## 1. Authentication & Users

### 1.1 Login User
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Authentication**: None
- **Role**: Public
- **Purpose**: Authenticates a user and issues a JWT token.
- **Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66dd8f12a3b4c5d6e7f8091a",
    "username": "admin",
    "name": "Maintenance Admin",
    "role": "ADMIN",
    "department": "Maintenance Dept.",
    "avatarText": "AD"
  }
}
```

### 1.2 Get Current User
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Authentication**: `Bearer <token>`
- **Role**: All authenticated (`ADMIN`, `STAFF`, `VIEWER`, `FACULTY`)
- **Purpose**: Retrieves current authenticated profile.

### 1.3 Get All Users
- **Method**: `GET`
- **Endpoint**: `/api/auth/users`
- **Authentication**: `Bearer <token>`
- **Role**: `ADMIN`
- **Purpose**: Retrieves all users in the system.

---

## 2. Product Management

### 2.1 Get All Products
- **Method**: `GET`
- **Endpoint**: `/api/products`
- **Query Parameters**:
  - `search`: Filter by name, code, or category
  - `category`: Filter by category name
  - `register`: Filter by stock sheet (e.g. `SR1`, `SR2`, `SR3`, `CSSR1`)
  - `status`: `ACTIVE`, `INACTIVE`, or `ALL`
  - `lowStock`: `true` or `false`
  - `page`: Page number (default: 1)
  - `limit`: Page size (default: 50)
- **Authentication**: `Bearer <token>`
- **Role**: All authenticated
- **Response (200 OK)**:
```json
{
  "success": true,
  "count": 10,
  "total": 10,
  "products": [
    {
      "_id": "66dd8f12a3b4c5d6e7f80920",
      "productCode": "EL-BULB-001",
      "productName": "LED Bulb 10W (B22)",
      "category": "Lighting",
      "unit": "Pieces",
      "currentQuantity": 25,
      "minimumQuantity": 10,
      "stockRegister": "SR1",
      "pageNumber": 15,
      "stockStatus": "AVAILABLE",
      "active": true,
      "registerRefs": [
        { "sheet": "SR1", "page": 15, "note": "Primary stock entry" },
        { "sheet": "SR3", "page": 42, "note": "Secondary distribution log" }
      ]
    }
  ]
}
```

### 2.2 Get Product By ID
- **Method**: `GET`
- **Endpoint**: `/api/products/:id`
- **Authentication**: `Bearer <token>`
- **Role**: All authenticated

### 2.3 Get Product Details
- **Method**: `GET`
- **Endpoint**: `/api/products/:id/details`
- **Authentication**: `Bearer <token>`
- **Role**: All authenticated
- **Purpose**: Retrieves product metadata, real-time stock status, SR register references, movement history, and technical remarks for `product-details.html`.
- **Response (200 OK)**:
```json
{
  "success": true,
  "product": {
    "_id": "66dd8f12a3b4c5d6e7f80920",
    "productCode": "EL-BULB-001",
    "productName": "LED Bulb 10W (B22)",
    "currentQuantity": 25,
    "minimumQuantity": 10,
    "unit": "Pieces"
  },
  "stockStatus": "AVAILABLE",
  "references": [
    { "sheet": "SR1", "page": 15 },
    { "sheet": "SR3", "page": 42 }
  ],
  "history": [
    {
      "date": "2026-09-01",
      "transactionType": "IN",
      "quantity": 50,
      "department": "Store",
      "remarks": "New procurement received"
    }
  ],
  "remarks": [
    {
      "author": "E. Ramesh",
      "date": "2026-09-05",
      "text": "Stock placed in Rack L-2"
    }
  ]
}
```

### 2.4 Create Product
- **Method**: `POST`
- **Endpoint**: `/api/products`
- **Authentication**: `Bearer <token>`
- **Role**: `ADMIN`
- **Request Body**:
```json
{
  "productCode": "EL-SW-002",
  "productName": "Switch (2-pin, 16A)",
  "category": "Electrical Accessories",
  "unit": "Pieces",
  "currentQuantity": 20,
  "minimumQuantity": 5,
  "stockRegister": "SR2",
  "pageNumber": 31,
  "registerRefs": [
    { "sheet": "SR2", "page": 31 }
  ],
  "description": "16A Heavy Duty Power Switch",
  "initialRemark": "Initial batch"
}
```

### 2.5 Update Product
- **Method**: `PUT`
- **Endpoint**: `/api/products/:id`
- **Authentication**: `Bearer <token>`
- **Role**: `ADMIN`
- **Note**: `currentQuantity` cannot be edited directly via this endpoint. Stock adjustments must proceed through Incoming/Outgoing APIs to preserve audit integrity.

### 2.6 Soft Delete / Deactivate Product
- **Method**: `DELETE`
- **Endpoint**: `/api/products/:id`
- **Authentication**: `Bearer <token>`
- **Role**: `ADMIN`
- **Purpose**: Soft deletes (sets `active: false`, `status: "INACTIVE"`) without destroying past transaction history.

---

## 3. SR Sheet References (Register Master & Mappings)

### 3.1 Get All Stock Registers
- **Method**: `GET`
- **Endpoint**: `/api/stock-documents`
- **Authentication**: `Bearer <token>`
- **Role**: All authenticated
- **Returns**: Master registers (`CSSR1`, `SR1`, `SR2`, `SR3`).

### 3.2 Get Product References
- **Method**: `GET`
- **Endpoint**: `/api/products/:id/references`

### 3.3 Add Product Reference
- **Method**: `POST`
- **Endpoint**: `/api/products/:id/references`
- **Authentication**: `Bearer <token>`
- **Role**: `ADMIN`
- **Request Body**:
```json
{
  "stockDocumentName": "SR3",
  "pageNumber": 42,
  "referenceNote": "Secondary appliance ledger"
}
```

### 3.4 Delete Product Reference
- **Method**: `DELETE`
- **Endpoint**: `/api/products/:id/references/:referenceId`

---

## 4. Stock In / Out Operations & History

### 4.1 Record Incoming Stock (Stock IN)
- **Method**: `POST`
- **Endpoint**: `/api/stock/incoming`
- **Authentication**: `Bearer <token>`
- **Role**: `ADMIN`, `STAFF`
- **Request Body**:
```json
{
  "productId": "66dd8f12a3b4c5d6e7f80920",
  "quantity": 50,
  "date": "2026-09-09",
  "remarks": "New delivery from Sri Balaji Electricals"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Stock updated successfully.",
  "previousQuantity": 25,
  "addedQuantity": 50,
  "currentQuantity": 75,
  "stockStatus": "AVAILABLE"
}
```

### 4.2 Record Outgoing Stock (Stock OUT)
- **Method**: `POST`
- **Endpoint**: `/api/stock/outgoing`
- **Authentication**: `Bearer <token>`
- **Role**: `ADMIN`, `STAFF`
- **Request Body**:
```json
{
  "productId": "66dd8f12a3b4c5d6e7f80920",
  "quantity": 10,
  "department": "Computer Science & Engineering",
  "date": "2026-09-09",
  "remarks": "Classroom 104 lighting requirement"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Stock issued successfully.",
  "previousQuantity": 75,
  "issuedQuantity": 10,
  "currentQuantity": 65,
  "isLowStock": false,
  "stockStatus": "AVAILABLE"
}
```

### 4.3 Get Stock Movement History
- **Method**: `GET`
- **Endpoint**: `/api/stock/history` (or `/api/history`)
- **Query Parameters**:
  - `productId`: Filter by product ID or Code
  - `department`: Filter by receiving department
  - `transactionType`: `IN`, `OUT`, or `ALL`
  - `fromDate`, `toDate`: Date range
  - `search`: Keyword search
  - `page`, `limit`: Pagination parameters
- **Authentication**: `Bearer <token>`
- **Role**: All authenticated

### 4.4 Get Low Stock Items
- **Method**: `GET`
- **Endpoint**: `/api/stock/low-stock`
- **Authentication**: `Bearer <token>`
- **Role**: All authenticated
- **Condition**: `currentQuantity <= minimumQuantity`
- **Response (200 OK)**:
```json
{
  "success": true,
  "count": 2,
  "lowStockItems": [
    {
      "productCode": "EL-SW-001",
      "productName": "Switch (2-pin, 6A)",
      "currentQuantity": 7,
      "minimumQuantity": 10,
      "difference": -3,
      "status": "LOW_STOCK"
    }
  ]
}
```

---

## 5. Master Data (Departments, Categories, Units)

### 5.1 Get Departments
- **Method**: `GET`
- **Endpoint**: `/api/departments`
- **Returns**: CSE, EEE, ECE, Mechanical, Civil, IT, Administration, Maintenance Dept.

### 5.2 Get Categories
- **Method**: `GET`
- **Endpoint**: `/api/categories`
- **Returns**: Lighting, Wiring, Switchgear, Electrical Accessories, Appliances, Consumables.

### 5.3 Get Units
- **Method**: `GET`
- **Endpoint**: `/api/units`
- **Returns**: Pieces, Meter, Roll, Box, Coil, Set.

---

## 6. Product Technical Remarks

### 6.1 Get Remarks
- **Method**: `GET`
- **Endpoint**: `/api/products/:id/remarks`

### 6.2 Add Remark
- **Method**: `POST`
- **Endpoint**: `/api/products/:id/remarks`
- **Authentication**: `Bearer <token>`
- **Role**: `ADMIN`, `STAFF`
- **Request Body**:
```json
{
  "remark": "Inspected batch against IS-3854 specifications; approved for installation."
}
```

---

## 7. Indent Workflow Management

### Workflow Lifecycle:
```
DRAFT -> SUBMITTED -> RECOMMENDED -> APPROVED -> ISSUED / PARTIALLY_ISSUED
                          |              |
                          V              V
                       REJECTED       REJECTED
```

### 7.1 Get Indents
- **Method**: `GET`
- **Endpoint**: `/api/indents`
- **Query Parameters**: `status`, `department`, `search`, `page`, `limit`

### 7.2 Create Indent
- **Method**: `POST`
- **Endpoint**: `/api/indents`
- **Authentication**: `Bearer <token>`
- **Role**: `STAFF`, `FACULTY`, `ADMIN`
- **Request Body**:
```json
{
  "department": "Computer Science & Engineering",
  "purpose": "Lab-4 Switchboard Upgrades",
  "requiredDate": "2026-09-15",
  "remarks": "Urgent practical exam readiness",
  "items": [
    {
      "productId": "66dd8f12a3b4c5d6e7f80921",
      "quantityRequired": 10,
      "lineRemarks": "For terminal desks"
    }
  ]
}
```

### 7.3 Submit Indent
- **Method**: `POST`
- **Endpoint**: `/api/indents/:id/submit`

### 7.4 Recommend Indent
- **Method**: `POST`
- **Endpoint**: `/api/indents/:id/recommend`

### 7.5 Approve Indent
- **Method**: `POST`
- **Endpoint**: `/api/indents/:id/approve`
- **Role**: `ADMIN`
- **Note**: Approving an indent records authorization but does **NOT** deduct stock until issued.

### 7.6 Issue Stock Against Indent
- **Method**: `POST`
- **Endpoint**: `/api/indents/:id/issue`
- **Role**: `ADMIN`
- **Action**: Validates stock availability, deducts inventory, records `OUT` StockTransaction entries, updates `quantityIssued`, and transitions indent status to `ISSUED` or `PARTIALLY_ISSUED`.

---

## 8. Dashboard & Analytics

### 8.1 Dashboard Overview
- **Method**: `GET`
- **Endpoint**: `/api/dashboard` (or `/api/analytics/dashboard`)
- **Authentication**: `Bearer <token>`
- **Role**: All authenticated
- **Response**:
```json
{
  "success": true,
  "totalProducts": 10,
  "totalCurrentStock": 440,
  "lowStockCount": 3,
  "pendingIndentCount": 1,
  "recentTransactions": [ ... ],
  "lowStockProducts": [ ... ]
}
```

---

## 9. Standard Error Handling & Status Codes

| Status Code | Description | Scenario |
|---|---|---|
| **200 OK** | Success | Fetch / Update successful |
| **201 Created** | Resource Created | Product, Transaction, Indent created |
| **400 Bad Request** | Validation Failure | Missing field, negative quantity, insufficient stock |
| **401 Unauthorized** | Authentication Error | Missing or expired JWT token |
| **403 Forbidden** | Authorization Error | Role not permitted for requested endpoint |
| **404 Not Found** | Resource Not Found | Product/Indent ID not found |
| **409 Conflict** | Duplicate Resource | Product code already exists in catalog |
| **500 Internal Error**| Server Failure | Unhandled server or database error |

All error responses follow this standard JSON envelope:
```json
{
  "success": false,
  "message": "Human readable error description."
}
```
