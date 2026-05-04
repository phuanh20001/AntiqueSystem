/**
 * AntiqChain Server
 * Main entry point for the backend application
 */
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const healthCheckTimeoutMs = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const { connectDB } = require('./config/db');
const { provider, contract } = require('./services/blockchainService');

// Routes
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const verificationRoutes = require('./routes/verification');
const verificationRecordRoutes = require('./routes/verificationRecordRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/verification-records', verificationRecordRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("AntiqChain backend is running");
});

app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let blockchainStatus = 'unavailable';

  try {
    if (provider) {
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), healthCheckTimeoutMs)),
      ]);

      blockchainStatus = `reachable (latest block ${blockNumber})`;
    }
  } catch (error) {
    blockchainStatus = `error (${error.message})`;
  }

  const ok = mongoStatus === 'connected' && blockchainStatus.startsWith('reachable');

  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    mongo: mongoStatus,
    blockchain: blockchainStatus,
    timestamp: new Date().toISOString(),
  });
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Initialize and start the server
const startServer = async () => {
  console.log('Starting AntiqueChain backend...');
  console.log(`Blockchain provider: ${provider ? 'configured' : 'not configured'}`);
  console.log(`Blockchain contract: ${contract ? 'configured' : 'not configured'}`);

  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});