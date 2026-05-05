# Database Setup Guide

## MongoDB Atlas Configuration

The backend is now configured to use MongoDB Atlas cloud database instead of localhost.

### Connection Details
- **Database**: MongoDB Atlas
- **Cluster**: cluster0.8f9kntz.mongodb.net
- **Database Name**: antiquchain
- **User**: baralaadesh78_db_user

### Environment Configuration

The `.env` file has been configured with the MongoDB Atlas connection string:

```
MONGO_URI=mongodb+srv://baralaadesh78_db_user:8iRwIY8WdxBSgsOX@cluster0.8f9kntz.mongodb.net/antiquchain?retryWrites=true&w=majority
```

### Testing the Connection

To verify the database connection works:

```bash
cd antique-backend
npm run test:db
```

Expected output:
```
Testing MongoDB Atlas connection...
Connection string: Found
MongoDB Connected: cluster0-shard-00-00.8f9kntz.mongodb.net
Database: antiquchain
✓ Connection successful!
✓ Database is ready to use
✓ Disconnected successfully
```

### Starting the Server

```bash
cd antique-backend
npm start
```

The server will automatically connect to MongoDB Atlas on startup.

### Database Collections

The following collections will be created automatically:
- `users` - User accounts (collectors, verifiers, admins)
- `items` - Antique items submitted for verification
- `verificationrecords` - Verification records for items

### Troubleshooting

**Connection Timeout:**
- Check your internet connection
- Verify the MongoDB Atlas cluster is running
- Check if your IP address is whitelisted in MongoDB Atlas

**Authentication Failed:**
- Verify the username and password in MONGO_URI
- Check if the database user has proper permissions

**Database Not Found:**
- The database will be created automatically on first connection
- Ensure the database name in the connection string is correct

### Security Notes

- The `.env` file is in `.gitignore` and won't be committed to git
- Never share your database credentials publicly
- Consider rotating the password periodically
- Use IP whitelisting in MongoDB Atlas for additional security

### Switching Back to Localhost

If you need to use localhost MongoDB instead:

1. Install MongoDB locally
2. Update `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/antiquchain
   ```
3. Restart the server
