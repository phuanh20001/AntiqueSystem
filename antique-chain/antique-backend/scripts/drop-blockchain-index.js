const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dropIndex = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI is not defined in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('items');

    try {
      await collection.dropIndex('blockchainHash_1');
      console.log('✓ Dropped blockchainHash_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ Index blockchainHash_1 does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    await mongoose.disconnect();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

dropIndex();
