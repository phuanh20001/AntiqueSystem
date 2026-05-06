const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Item = require('../models/Item');
const VerificationRecord = require('../models/VerificationRecord');

/**
 * Create database indexes for performance optimization
 */
const createIndexes = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI is not defined in .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    console.log('\n📊 Creating indexes on User collection...');
    
    // User indexes
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
      console.log('  ✓ Index on email (unique)');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on email already exists');
      else throw err;
    }
    
    try {
      await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true });
      console.log('  ✓ Index on username (unique)');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on username already exists');
      else throw err;
    }
    
    try {
      await User.collection.createIndex({ role: 1 });
      console.log('  ✓ Index on role');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on role already exists');
      else throw err;
    }

    console.log('\n📊 Creating indexes on Item collection...');
    
    // Item indexes
    try {
      await Item.collection.createIndex({ owner: 1 });
      console.log('  ✓ Index on owner');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on owner already exists');
      else throw err;
    }
    
    try {
      await Item.collection.createIndex({ category: 1 });
      console.log('  ✓ Index on category');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on category already exists');
      else throw err;
    }
    
    try {
      await Item.collection.createIndex({ verificationStatus: 1 });
      console.log('  ✓ Index on verificationStatus');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on verificationStatus already exists');
      else throw err;
    }
    
    try {
      await Item.collection.createIndex({ verificationRecord: 1 }, { sparse: true });
      console.log('  ✓ Index on verificationRecord');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on verificationRecord already exists');
      else throw err;
    }
    
    try {
      await Item.collection.createIndex({ createdAt: -1 });
      console.log('  ✓ Index on createdAt (descending)');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on createdAt already exists');
      else throw err;
    }
    
    try {
      await Item.collection.createIndex({ title: 'text', description: 'text' });
      console.log('  ✓ Text index on title and description');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Text index on title and description already exists');
      else throw err;
    }
    
    // Compound indexes for common queries
    try {
      await Item.collection.createIndex({ owner: 1, verificationStatus: 1 });
      console.log('  ✓ Compound index on owner + verificationStatus');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Compound index on owner + verificationStatus already exists');
      else throw err;
    }
    
    try {
      await Item.collection.createIndex({ category: 1, verificationStatus: 1 });
      console.log('  ✓ Compound index on category + verificationStatus');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Compound index on category + verificationStatus already exists');
      else throw err;
    }
    
    try {
      await Item.collection.createIndex({ owner: 1, createdAt: -1 });
      console.log('  ✓ Compound index on owner + createdAt');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Compound index on owner + createdAt already exists');
      else throw err;
    }

    console.log('\n📊 Creating indexes on VerificationRecord collection...');
    
    // VerificationRecord indexes
    try {
      await VerificationRecord.collection.createIndex({ item: 1 });
      console.log('  ✓ Index on item');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on item already exists');
      else throw err;
    }
    
    try {
      await VerificationRecord.collection.createIndex({ verifier: 1 });
      console.log('  ✓ Index on verifier');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on verifier already exists');
      else throw err;
    }
    
    try {
      await VerificationRecord.collection.createIndex({ status: 1 });
      console.log('  ✓ Index on status');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on status already exists');
      else throw err;
    }
    
    try {
      await VerificationRecord.collection.createIndex({ verificationMethod: 1 });
      console.log('  ✓ Index on verificationMethod');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on verificationMethod already exists');
      else throw err;
    }
    
    try {
      await VerificationRecord.collection.createIndex({ createdAt: -1 });
      console.log('  ✓ Index on createdAt (descending)');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Index on createdAt already exists');
      else throw err;
    }
    
    // Compound indexes for common queries
    try {
      await VerificationRecord.collection.createIndex({ verifier: 1, status: 1 });
      console.log('  ✓ Compound index on verifier + status');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Compound index on verifier + status already exists');
      else throw err;
    }
    
    try {
      await VerificationRecord.collection.createIndex({ status: 1, createdAt: -1 });
      console.log('  ✓ Compound index on status + createdAt');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Compound index on status + createdAt already exists');
      else throw err;
    }
    
    try {
      await VerificationRecord.collection.createIndex({ item: 1, status: 1 });
      console.log('  ✓ Compound index on item + status');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ Compound index on item + status already exists');
      else throw err;
    }

    console.log('\n📊 Creating TTL index for potential future use...');
    
    // TTL index for audit logs (if added in future)
    try {
      await VerificationRecord.collection.createIndex(
        { updatedAt: 1 },
        { expireAfterSeconds: 7776000 } // 90 days
      );
      console.log('  ✓ TTL index on updatedAt (90 days expiration)');
    } catch (err) {
      if (err.code === 86) console.log('  ℹ TTL index on updatedAt already exists');
      else console.log('  ℹ TTL index not applicable');
    }

    console.log('\n✅ All indexes created successfully!\n');
    
    // Get index information
    console.log('📋 Current indexes:\n');
    
    console.log('User indexes:');
    const userIndexes = await User.collection.getIndexes();
    Object.entries(userIndexes).forEach(([name, spec]) => {
      console.log(`  - ${name}: ${JSON.stringify(spec)}`);
    });
    
    console.log('\nItem indexes:');
    const itemIndexes = await Item.collection.getIndexes();
    Object.entries(itemIndexes).forEach(([name, spec]) => {
      console.log(`  - ${name}: ${JSON.stringify(spec)}`);
    });
    
    console.log('\nVerificationRecord indexes:');
    const verIndexes = await VerificationRecord.collection.getIndexes();
    Object.entries(verIndexes).forEach(([name, spec]) => {
      console.log(`  - ${name}: ${JSON.stringify(spec)}`);
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createIndexes();
