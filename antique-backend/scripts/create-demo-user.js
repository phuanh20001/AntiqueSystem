const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

const createDemoUser = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/antiquechain';
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB Connected successfully\n');

    const demoUsers = [
      {
        username: 'Sagar Collector',
        email: 'sagar@example.com',
        password: 'sagar123',
        role: 'user'
      },
      {
        username: 'Expert Verifier',
        email: 'expert@example.com',
        password: 'expert123',
        role: 'admin'
      }
    ];

    for (const demoUser of demoUsers) {
      console.log(`Creating user: ${demoUser.username}`);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: demoUser.email });
      if (existingUser) {
        console.log(`  ⚠ User ${demoUser.email} already exists, skipping...\n`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(demoUser.password, salt);

      // Create user
      const user = await User.create({
        username: demoUser.username,
        email: demoUser.email,
        password: hashedPassword,
        role: demoUser.role
      });

      console.log(`  ✓ Created successfully!`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: ${demoUser.password}`);
      console.log(`    Role: ${user.role}\n`);
    }

    await mongoose.disconnect();
    console.log('✓ Done! Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

createDemoUser();
