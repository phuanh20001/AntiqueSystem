const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

const createTestUser = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/antiquechain';
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB Connected successfully');

    // Generate unique test user data
    const timestamp = Date.now();
    const testUser = {
      username: `testuser_${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      password: 'test123456',
      role: 'user'
    };

    console.log('\nCreating test user with data:');
    console.log(`  Username: ${testUser.username}`);
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Password: ${testUser.password}`);
    console.log(`  Role: ${testUser.role}`);

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('\n⚠ User with this email already exists');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, salt);

    // Create user
    const user = await User.create({
      username: testUser.username,
      email: testUser.email,
      password: hashedPassword,
      role: testUser.role
    });

    console.log('\n✓ Test user created successfully!');
    console.log(`  User ID: ${user._id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Created At: ${user.createdAt}`);

    // Verify user was saved
    const savedUser = await User.findById(user._id);
    if (savedUser) {
      console.log('\n✓ User verified in database!');
    } else {
      console.log('\n✗ User not found in database after creation');
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    
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

createTestUser();
