const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const verificationRoutes = require('./routes/verification');

// Health check endpoint
app.get("/", (req, res) => {
  res.send("AntiqChain backend is running");
});

// Mount verification routes
app.use('/api/verifications', verificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});