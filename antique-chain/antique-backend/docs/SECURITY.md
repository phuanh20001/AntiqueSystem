# Security Features

## Authentication
- JWT token-based authentication
- Tokens expire after 30 days
- Passwords hashed with bcrypt (10 salt rounds)

## Authorization
- Role-based access control (RBAC)
- Collectors can only submit items
- Verifiers can only approve/reject items
- Admins have full access

## Data Protection
- Email normalization (lowercase, trimmed)
- Password minimum length: 6 characters
- Ownership validation for item updates
- Status validation for blockchain operations
