# API Endpoints

## Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

## Items
- `POST /api/items` - Submit item (collector only)
- `GET /api/items` - Get all items
- `GET /api/items/my-items` - Get user's items
- `GET /api/items/pending` - Get pending items (verifier only)
- `PUT /api/items/:id/verification-status` - Approve/reject (verifier only)
- `PUT /api/items/:id/blockchain` - Add blockchain hash (verifier only)
