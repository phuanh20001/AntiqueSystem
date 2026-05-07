const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../config/db');
const Item = require('../models/Item');
const User = require('../models/User');

const EXAMPLE_PRODUCTS = [
  { category: 'furniture', title: 'Victorian Mahogany Writing Desk', estimatedPeriod: 'Victorian Era', material: 'Mahogany wood' },
  { category: 'artwork', title: '19th Century Landscape Oil Painting', estimatedPeriod: 'Late 1800s', material: 'Oil on canvas' },
  { category: 'jewelry', title: 'Edwardian Sapphire Brooch', estimatedPeriod: 'Edwardian Period', material: 'Gold and sapphire' },
  { category: 'collectibles', title: 'Colonial Silver Coin Collection', estimatedPeriod: '1700s', material: 'Silver' },
  { category: 'ceramics', title: 'Hand-Painted Porcelain Tea Set', estimatedPeriod: 'Qing Dynasty style', material: 'Porcelain' },
  { category: 'textiles', title: 'Antique Persian Silk Rug', estimatedPeriod: 'Early 1900s', material: 'Silk and wool' },
  { category: 'metalware', title: 'Bronze Ritual Bowl', estimatedPeriod: 'Classical period', material: 'Bronze' },
  { category: 'timepieces', title: 'Swiss Mechanical Pocket Watch', estimatedPeriod: '1920s', material: 'Steel and brass' },
  { category: 'books', title: 'First Edition Historical Manuscript', estimatedPeriod: '1800s', material: 'Paper and leather' },
  { category: 'other', title: 'Antique Carved Stone Figurine', estimatedPeriod: 'Unknown period', material: 'Stone' },
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

    let createdCount = 0;
    let updatedCount = 0;

    for (const product of EXAMPLE_PRODUCTS) {
      const existing = await Item.findOne({ title: product.title });
      const payload = {
        owner: collectorOwner._id,
        title: product.title,
        description: `${product.title} verified by expert review and available in the marketplace.`,
        category: product.category,
        estimatedPeriod: product.estimatedPeriod,
        estimatedYear: null,
        material: product.material,
        condition: 'good',
        provenance: 'Curated sample listing for catalog demonstration.',
        estimatedValue: Math.floor(500 + Math.random() * 4500),
        images: [],
        verificationStatus: 'verified',
        isSold: false,
        soldAt: null,
      };

      if (existing) {
        await Item.updateOne({ _id: existing._id }, { $set: payload });
        updatedCount += 1;
      } else {
        await Item.create(payload);
        createdCount += 1;
      }
    }

    console.log(`Seed complete. Created: ${createdCount}, Updated: ${updatedCount}`);
  } catch (error) {
    console.error('Failed to seed example products:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

runSeed();
