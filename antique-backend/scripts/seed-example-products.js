const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../config/db');
const Item = require('../models/Item');
const User = require('../models/User');

const EXAMPLE_PRODUCTS = [
  { category: 'furniture', title: 'Victorian Mahogany Writing Desk', estimatedPeriod: 'Victorian Era', material: 'Mahogany wood', estimatedYear: 1880 },
  { category: 'artwork', title: '19th Century Landscape Oil Painting', estimatedPeriod: 'Late 1800s', material: 'Oil on canvas', estimatedYear: 1890 },
  { category: 'jewelry', title: 'Edwardian Sapphire Brooch', estimatedPeriod: 'Edwardian Period', material: 'Gold and sapphire', estimatedYear: 1910 },
  { category: 'collectibles', title: 'Colonial Silver Coin Collection', estimatedPeriod: '1700s', material: 'Silver', estimatedYear: 1750 },
  { category: 'ceramics', title: 'Hand-Painted Porcelain Tea Set', estimatedPeriod: 'Qing Dynasty style', material: 'Porcelain', estimatedYear: 1820 },
  { category: 'textiles', title: 'Antique Persian Silk Rug', estimatedPeriod: 'Early 1900s', material: 'Silk and wool', estimatedYear: 1905 },
  { category: 'metalware', title: 'Bronze Ritual Bowl', estimatedPeriod: 'Classical period', material: 'Bronze', estimatedYear: 500 },
  { category: 'timepieces', title: 'Swiss Mechanical Pocket Watch', estimatedPeriod: '1920s', material: 'Steel and brass', estimatedYear: 1925 },
  { category: 'books', title: 'First Edition Historical Manuscript', estimatedPeriod: '1800s', material: 'Paper and leather', estimatedYear: 1850 },
  { category: 'other', title: 'Antique Carved Stone Figurine', estimatedPeriod: 'Unknown period', material: 'Stone', estimatedYear: null },
];

async function runSeed() {
  try {
    await connectDB();

    const collectorOwner =
      await User.findOne({ email: 'collector@example.com' }) ||
      await User.findOne({ role: 'user' }) ||
      await User.findOne({});

    if (!collectorOwner) {
      throw new Error('No user found. Please create at least one account first.');
    }

    // Remove legacy / pre-chain items (no on-chain tx recorded)
    const deletePreBlockchain = await Item.deleteMany({
      $or: [
        { blockchainTransactionHash: null },
        { blockchainTransactionHash: { $exists: false } },
        { blockchainTransactionHash: '' },
      ],
    });
    console.log(`Deleted ${deletePreBlockchain.deletedCount} items with no transaction hash.`);

    let createdCount = 0;

    for (const product of EXAMPLE_PRODUCTS) {
      const payload = {
        owner: collectorOwner._id,
        submittedBy: collectorOwner._id,
        title: product.title,
        description: `${product.title} submitted for expert verification. Sample item for verifier testing.`,
        category: product.category,
        estimatedPeriod: product.estimatedPeriod,
        estimatedYear: product.estimatedYear,
        estimatedAge: product.estimatedYear ? new Date().getFullYear() - product.estimatedYear : null,
        material: product.material,
        condition: 'good',
        provenance: 'Sample item for verifier testing and demonstration.',
        estimatedValue: Math.floor(500 + Math.random() * 4500),
        images: [],
        verificationStatus: 'pending',
        isSold: false,
        soldAt: null,
      };

      await Item.create(payload);
      createdCount += 1;
    }

    console.log(`Seed complete. Created ${createdCount} pending items for verification.`);
  } catch (error) {
    console.error('Failed to seed example products:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

runSeed();
