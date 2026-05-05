# Testing Guide

## Create Test Users

### Collector
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"collector1","email":"collector@test.com","password":"test123","role":"collector"}'
```

### Verifier
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"verifier1","email":"verifier@test.com","password":"test123","role":"verifier"}'
```

## Test Workflow

1. Login as collector
2. Submit an item
3. Login as verifier
4. View pending items
5. Approve the item
6. Add blockchain hash
