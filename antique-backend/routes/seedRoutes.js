const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Item = require('../models/Item');
const User = require('../models/User');
const TWENTY_SEED_PRODUCTS = require('../data/twentySeedProducts');

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

// @desc    Clean database and create fresh pending items for testing
// @route   POST /api/seed/reset-for-testing
// @access  Private (Admin only)
router.post('/reset-for-testing', protect, admin, async (req, res) => {
  try {
    const collectorOwner =
      await User.findOne({ email: 'collector@example.com' }) ||
      await User.findOne({ role: 'user' }) ||
      await User.findOne({});

    if (!collectorOwner) {
      return res.status(400).json({
        success: false,
        message: 'No user found. Please create at least one account first.',
      });
    }

    // Delete all items without blockchain transaction hash (pre-blockchain items)
    const deletePreBlockchain = await Item.deleteMany({
      $or: [
        { blockchainTransactionHash: null },
        { blockchainTransactionHash: { $exists: false } },
        { blockchainTransactionHash: '' }
      ]
    });

    // Delete all existing example items by title
    const deleteExamples = await Item.deleteMany({
      title: { $in: EXAMPLE_PRODUCTS.map(p => p.title) }
    });

    let createdCount = 0;

    for (const product of EXAMPLE_PRODUCTS) {
      const payload = {
        owner: collectorOwner._id,
        submittedBy: collectorOwner._id,
        title: product.title,
        description: `${product.title} submitted for expert verification. This is a test item for verifier account testing.`,
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

    res.status(200).json({
      success: true,
      message: `Database cleaned and test items created successfully.`,
      deletedPreBlockchain: deletePreBlockchain.deletedCount,
      deletedExamples: deleteExamples.deletedCount,
      created: createdCount,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset database for testing',
      error: error.message,
    });
  }
});

// @desc    Reseed example products as pending items (legacy endpoint)
// @route   POST /api/seed/reset-examples
// @access  Private (Admin only)
router.post('/reset-examples', protect, admin, async (req, res) => {
  try {
    const collectorOwner =
      await User.findOne({ email: 'collector@example.com' }) ||
      await User.findOne({ role: 'user' }) ||
      await User.findOne({});

    if (!collectorOwner) {
      return res.status(400).json({
        success: false,
        message: 'No user found. Please create at least one account first.',
      });
    }

    // Delete all existing example items
    const deleteResult = await Item.deleteMany({
      title: { $in: EXAMPLE_PRODUCTS.map(p => p.title) }
    });

    let createdCount = 0;

    for (const product of EXAMPLE_PRODUCTS) {
      const payload = {
        owner: collectorOwner._id,
        submittedBy: collectorOwner._id,
        title: product.title,
        description: `${product.title} submitted for expert verification.`,
        category: product.category,
        estimatedPeriod: product.estimatedPeriod,
        estimatedYear: product.estimatedYear,
        estimatedAge: product.estimatedYear ? new Date().getFullYear() - product.estimatedYear : null,
        material: product.material,
        condition: 'good',
        provenance: 'Curated sample listing for catalog demonstration.',
        estimatedValue: Math.floor(500 + Math.random() * 4500),
        images: [],
        verificationStatus: 'pending',
        isSold: false,
        soldAt: null,
      };

      await Item.create(payload);
      createdCount += 1;
    }

    res.status(200).json({
      success: true,
      message: `Seed complete. Deleted ${deleteResult.deletedCount} old items, created ${createdCount} pending items.`,
      deleted: deleteResult.deletedCount,
      created: createdCount,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed example products',
      error: error.message,
    });
  }
});

// @desc    Delete every item and insert 20 fresh pending items (current Item model: submittedBy, etc.)
// @route   POST /api/seed/reset-items-twenty
// @access  Private (Admin only)
router.post('/reset-items-twenty', protect, admin, async (req, res) => {
  try {
    const collectorOwner =
      (await User.findOne({ email: 'collector@example.com' })) ||
      (await User.findOne({ role: 'user' })) ||
      (await User.findOne({}));

    if (!collectorOwner) {
      return res.status(400).json({
        success: false,
        message: 'No user found. Create at least one account before seeding items.',
      });
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

    res.status(200).json({
      success: true,
      message: `Removed ${deleteResult.deletedCount} item(s) and created ${createdCount} new pending items.`,
      deletedAllItems: deleteResult.deletedCount,
      created: createdCount,
    });
  } catch (error) {
    console.error('Seed reset-items-twenty error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset items',
      error: error.message,
    });
  }
});

module.exports = router;
