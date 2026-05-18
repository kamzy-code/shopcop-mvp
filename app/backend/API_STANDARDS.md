# SHOPCOP API Standards

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful" // optional
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // validation errors (optional)
}
```

## Status Codes

- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Naming Conventions

- **Endpoints:** `/api/v1/resource-name` (kebab-case, plural nouns)
- **Request body:** `camelCase`
- **logs:** `camelCase`
- **Database columns:** `snake_case`
- **Response data:** `camelCase`

## Pagination


// Profile endpoints (partial updates)
PATCH /api/v1/profile/personal-info
PATCH /api/v1/profile/business-info
GET   /api/v1/profile

// Verification endpoints (submit new verification)
POST  /api/v1/verifications/nin
POST  /api/v1/verifications/cac
POST  /api/v1/verifications/address

// Admin approval (update verification status)
PATCH /api/v1/admin/verifications/:id/approve
PATCH /api/v1/admin/verifications/:id/reject

// Products (CRUD)
POST   /api/v1/products              // Create
GET    /api/v1/products              // List
GET    /api/v1/products/:id          // Read
PATCH  /api/v1/products/:id          // Update (partial)
DELETE /api/v1/products/:id          // Delete

// Transactions (create new)
POST  /api/v1/transactions
PATCH /api/v1/transactions/:id/status  // Update status

// Reviews (create new)
POST /api/v1/reviews