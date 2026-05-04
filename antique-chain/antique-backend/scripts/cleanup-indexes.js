const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Drop the blockchainHash unique index to allow multiple null values
 */
const cleanupDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI is not defined in .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Drop the problematic index
    try {
      await mongoose.connection.collection('items').dropIndex('blockchainHash_1');
      console.log('✓ Dropped blockchainHash_1 index');
    } catch (err) {
      if (err.code === 27) {
        // Index does not exist - that's fine
        console.log('✓ blockchainHash_1 index does not exist (no need to drop)');
      } else {
        console.error('❌ Error dropping index:', err.message);
      }
    }

    // Recreate index as non-unique sparse index
    try {
      await mongoose.connection.collection('items').createIndex(
        { blockchainHash: 1 },
        { sparse: true }
      );
      console.log('✓ Created non-unique sparse blockchainHash index');
    } catch (err) {
      console.error('❌ Error creating index:', err.message);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✓ Database cleanup complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

cleanupDatabase();
