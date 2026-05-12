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