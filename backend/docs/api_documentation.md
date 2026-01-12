# API Documentation - SaaS Gestion Commerciale

## Authentication & Security
All protected routes require a valid JWT in the `Authorization` header (`Bearer <token>`) or as an HTTP-only cookie.

## Standard Response Format
All API responses follow this structure:
```json
{
  "status": "success", // or "error"
  "code": 200,         // HTTP Status Code
  "message": "Operation successful",
  "content": { ... }   // Data payload or error details
}
```

**2FA Flow**:
1. Login normally. If 2FA is enabled, server returns `{ require2FA: true, userId: "..." }`.
2. Call Login again with `{ ..., "twoFactorToken": "123456" }`.

---

## 1. Authentication (`/api/auth`)

### Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Payload**:
  ```json
  {
    "email": "director@techstore.com",
    "password": "password123",
    "twoFactorToken": "123456" // Optional, required if 2FA enabled
  }
  ```
- **Response**: 
  ```json
  {
    "status": "success",
    "code": 200,
    "message": "Login successful",
    "content": { "user": { ... }, "accessToken": "..." }
  }
  ```

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Authenticated
- **Response**: 
  ```json
  {
    "status": "success",
    "code": 200,
    "message": "Logged out successfully",
    "content": {}
  }
  ```

### Setup 2FA
- **Endpoint**: `POST /api/auth/2fa/setup`
- **Access**: Authenticated
- **Response**: 
  ```json
  {
    "status": "success",
    "code": 200,
    "message": "2FA setup initiated",
    "content": { "secret": "...", "qrCode": "..." }
  }
  ```

### Verify 2FA
- **Endpoint**: `POST /api/auth/2fa/verify`
- **Access**: Authenticated
- **Payload**: `{ "token": "123456" }`
- **Response**: 
  ```json
  {
    "status": "success",
    "code": 200,
    "message": "2FA enabled successfully",
    "content": {}
  }
  ```

---

## 2. Tenants (`/api/tenants`)

### Create Tenant (and Director)
- **Endpoint**: `POST /api/tenants/create`
- **Access**: SUPERADMIN
- **Payload**:
  ```json
  {
    "name": "TechStore Paris",
    "slug": "techstore-paris",
    "adminEmail": "director@techstore.com",
    "adminPassword": "password123",
    "adminName": "Jean Directeur"
  }
  ```

### List Tenants
- **Endpoint**: `GET /api/tenants/list`
- **Access**: SUPERADMIN
- **Response**: Returns list of tenants, including their Director (with `imagePath`) and counts of users/products/sales.

---

## 3. Users (`/api/users`)

### Create User (Team Member)
- **Endpoint**: `POST /api/users/create`
- **Access**: DIRECTEUR
- **Payload**:
  ```json
  {
    "email": "vendeur@techstore.com",
    "password": "password123",
    "name": "Paul Vendeur",
    "role": "VENDEUR", // VENDEUR, GERANT, MAGASINIER
    "imagePath": "..." // Optional
  }
  ```

### List Users
- **Endpoint**: `GET /api/users/list`
- **Access**: DIRECTEUR
- **Response**: Returns list of users including `imagePath`.

### Delete User
- **Endpoint**: `DELETE /api/users/delete/:id`
- **Access**: DIRECTEUR

---

## 4. Products (`/api/products`)

### Create Product
- **Endpoint**: `POST /api/products/create`
- **Access**: MAGASINIER, DIRECTEUR
- **Payload**:
  ```json
  {
    "name": "iPhone 15",
    "sku": "IPHONE-15",
    "price": 999.99,
    "stock": 50,
    "imagePath": "..." // Optional
  }
  ```

### List Products
- **Endpoint**: `GET /api/products/list`
- **Access**: Authenticated (Tenant Scope)

### Update Product
- **Endpoint**: `PUT /api/products/update/:id`
- **Access**: MAGASINIER, DIRECTEUR
- **Payload**: `{ "name": "...", "price": ... }`

---

## 5. Sales (`/api/sales`)

### Create Sale (Atomic)
- **Endpoint**: `POST /api/sales/create`
- **Access**: VENDEUR, DIRECTEUR
- **Payload**:
  ```json
  {
    "items": [
      { "productId": "uuid-...", "quantity": 1 },
      { "productId": "uuid-...", "quantity": 2 }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "id": "...",
    "totalAmount": 150.00,
    "items": [
      {
        "id": "...",
        "quantity": 2,
        "unitPrice": 75.00,
        "productId": "...",
        "remainingStock": 48 // Updated stock level
      }
    ]
  }
  ```

### List Sales
- **Endpoint**: `GET /api/sales/list`
- **Access**: VENDEUR, DIRECTEUR

---

## 6. Stats (`/api/stats`)

### Dashboard
- **Endpoint**: `GET /api/stats/dashboard`
- **Access**: SUPERADMIN, DIRECTEUR
- **Response**:
  ```json
  {
    "status": "success",
    "code": 200,
    "message": "Director stats retrieved",
    "content": {
      "revenue": 1000,
      "salesCount": 5,
      "lowStock": [],
      "recentSales": []
    }
  }
  ```
