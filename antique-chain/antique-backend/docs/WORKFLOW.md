# Backend Workflow

## User Roles
- **collector**: Submit antique items
- **verifier**: Approve/reject items
- **admin**: Full access

## Workflow Steps
1. User registers with role
2. User logs in → receives JWT token
3. Collector submits item → saved as "pending"
4. Verifier views pending items
5. Verifier approves/rejects item
6. Dashboard shows updated status
7. If approved, blockchain hash added
