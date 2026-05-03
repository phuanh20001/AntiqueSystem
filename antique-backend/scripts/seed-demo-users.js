const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const DEMO_USERS = [
  {
    username: 'collector_demo',
    email: 'collector@example.com',
    password: 'demo123456',
    role: 'user'
  },
  {
    username: 'verifier_demo',
    email: 'verifier@example.com',
    password: 'demo123456',
    role: 'user'
  },
  {
    username: 'admin_demo',
    email: 'admin@example.com',
    password: 'demo123456',
    role: 'admin'
  }
];

const seedDemoUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI is not defined in .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Delete existing demo users
    const emailsToDelete = DEMO_USERS.map(u => u.email);
    const deleteResult = await User.deleteMany({ email: { $in: emailsToDelete } });
    console.log(`✓ Removed ${deleteResult.deletedCount} existing demo users`);

    // Create demo users with hashed passwords
    const hashedUsers = await Promise.all(
      DEMO_USERS.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    // Insert demo users
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✓ Created ${createdUsers.length} demo users:\n`);

    createdUsers.forEach(user => {
      console.log(`  📧 Email: ${user.email}`);
      console.log(`  🔑 Password: demo123456`);
      console.log(`  👤 Role: ${user.role}`);
      console.log('');
    });

    // Disconnect
    await mongoose.disconnect();
    console.log('✓ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedDemoUsers();
