const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Item = require('../models/Item');
const VerificationRecord = require('../models/VerificationRecord');

/**
 * Generate random authentication score between 75-100
 */
const generateAuthenticationScore = () => {
  return Math.floor(Math.random() * 26) + 75; // 75-100
};

/**
 * Generate a mock blockchain transaction hash
 */
const generateTxHash = () => {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

/**
 * Generate a mock blockchain contract address
 */
const generateContractAddress = () => {
  return '0x' + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

/**
 * Generate a mock metadata hash
 */
const generateMetadataHash = () => {
  return 'Qm' + Array.from({ length: 44 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
      Math.floor(Math.random() * 62)
    ]
  ).join('');
};

const seedVerifications = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI is not defined in .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Get verifier user
    const verifierUser = await User.findOne({ email: 'verifier@example.com' });
    if (!verifierUser) {
      console.error('❌ Error: Verifier user not found. Run seed-demo-users.js first');
      process.exit(1);
    }
    console.log('✓ Found verifier user');

    // Get all items
    const items = await Item.find();
    if (items.length === 0) {
      console.error('❌ Error: No items found. Run seed-demo-items.js first');
      process.exit(1);
    }
    console.log(`✓ Found ${items.length} items`);

    // Delete existing verification records
    const deleteResult = await VerificationRecord.deleteMany({});
    console.log(`✓ Removed ${deleteResult.deletedCount} existing verification records`);

    // Create verification records for each item
    const verificationStatuses = ['pending', 'approved', 'rejected'];
    const verificationMethods = ['blockchain', 'manual', 'expert_review', 'ai_analysis'];
    const createdVerifications = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const status = verificationStatuses[i % verificationStatuses.length];
      const method = verificationMethods[Math.floor(i / verificationStatuses.length) % verificationMethods.length];
      
      const verificationData = {
        item: item._id,
        verifier: verifierUser._id,
        status: status,
        verificationMethod: method,
        authenticationScore: status === 'rejected' ? null : generateAuthenticationScore(),
        authenticityCertificate: status === 'approved' ? {
          certificateNumber: `ANTIQ-${Date.now()}-${i}`,
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          url: `https://antiqchain.example.com/cert/${i}`
        } : null,
        blockchainDetails: {
          transactionHash: generateTxHash(),
          blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
          contractAddress: generateContractAddress(),
          metadataHash: generateMetadataHash(),
          network: 'ethereum',
          timestamp: new Date(),
          gasUsed: (Math.random() * 100000 + 20000).toFixed(0),
          status: status === 'pending' ? 'pending' : 'confirmed'
        },
        notes: generateNotes(status),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        updatedAt: new Date()
      };

      const verification = new VerificationRecord(verificationData);
      await verification.save();
      createdVerifications.push(verification);

      // Update item with verification record reference
      item.verificationRecord = verification._id;
      item.verificationStatus = status === 'approved' ? 'verified' : status === 'rejected' ? 'rejected' : 'in_progress';
      await item.save();
    }

    console.log(`✓ Created ${createdVerifications.length} verification records:\n`);
    createdVerifications.forEach((ver, index) => {
      console.log(`  ${index + 1}. Item Verification`);
      console.log(`     Status: ${ver.status}`);
      console.log(`     Method: ${ver.verificationMethod}`);
      console.log(`     Auth Score: ${ver.authenticationScore || 'N/A'}`);
      console.log(`     Verifier: ${verifierUser.username}`);
      if (ver.authenticityCertificate) {
        console.log(`     Certificate: ${ver.authenticityCertificate.certificateNumber}`);
      }
      console.log();
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

/**
 * Generate notes based on verification status
 */
function generateNotes(status) {
  const notesByStatus = {
    pending: 'Awaiting expert review and blockchain confirmation. Item details have been logged on the blockchain.',
    approved: 'Item has been successfully verified. Authenticity confirmed through expert analysis and blockchain validation.',
    rejected: 'Item failed authentication checks. Possible indicators of reproduction or significant alteration detected.',
    resubmitted: 'Item previously rejected, now resubmitted for verification with additional documentation.'
  };
  
  return notesByStatus[status] || notesByStatus.pending;
}

seedVerifications();
