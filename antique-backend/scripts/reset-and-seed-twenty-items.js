/**
 * Deletes all Item documents and creates 20 pending items using the current schema
 * (owner + submittedBy, empty purchaseHistory, no blockchain fields).
 *
 * Usage: from antique-backend: npm run seed:twenty
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../config/db');
const Item = require('../models/Item');
const User = require('../models/User');
const TWENTY_SEED_PRODUCTS = require('../data/twentySeedProducts');

async function run() {
  await connectDB();

  const collectorOwner =
    (await User.findOne({ email: 'collector@example.com' })) ||
    (await User.findOne({ role: 'user' })) ||
    (await User.findOne({}));

  if (!collectorOwner) {
    throw new Error('No user found. Create at least one account before running this script.');
  }

  const deleteResult = await Item.deleteMany({});
  let createdCount = 0;

  for (const product of TWENTY_SEED_PRODUCTS) {
    await Item.create({
      owner: collectorOwner._id,
      submittedBy: collectorOwner._id,
      title: product.title,
      description: `${product.title} — seeded pending listing for verification testing (AntiqChain).`,
      category: product.category,
      estimatedPeriod: product.estimatedPeriod,
      estimatedYear: product.estimatedYear,
      estimatedAge: product.estimatedYear ? new Date().getFullYear() - product.estimatedYear : null,
      material: product.material,
      condition: 'good',
      provenance: 'Seeded catalog item; not a real consignment.',
      estimatedValue: Math.floor(400 + Math.random() * 5200),
      images: [],
      verificationStatus: 'pending',
      listedInMarketplace: false,
      isSold: false,
      soldAt: null,
      purchaseHistory: [],
    });
    createdCount += 1;
  }

  console.log(`Deleted ${deleteResult.deletedCount} item(s). Created ${createdCount} new items.`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
