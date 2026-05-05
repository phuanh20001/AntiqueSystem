/**
 * Test MongoDB Atlas Connection
 * Run this to verify the database connection works
 */
require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');

const testConnection = async () => {
  console.log('Testing MongoDB Atlas connection...');
  console.log('Connection string:', process.env.MONGO_URI ? 'Found' : 'Missing');
  
  try {
    await connectDB();
    console.log('✓ Connection successful!');
    console.log('✓ Database is ready to use');
    
    await disconnectDB();
    console.log('✓ Disconnected successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();
