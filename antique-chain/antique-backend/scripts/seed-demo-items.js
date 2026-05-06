const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Item = require('../models/Item');

const DEMO_ITEMS = [
  {
    title: 'Victorian Mahogany Writing Desk',
    description: 'Exquisite Victorian-era mahogany writing desk with ornate carved details and brass hardware. Features multiple drawers and a leather-lined top surface. Excellent condition with original finish.',
    category: 'furniture',
    estimatedAge: 150,
    estimatedYear: 1870,
    estimatedPeriod: 'Victorian Era (1837-1901)',
    material: 'Mahogany wood, brass hardware, leather',
    dimensions: { length: 120, width: 60, height: 75 },
    condition: 'excellent',
    provenance: 'Estate collection, UK',
    estimatedValue: 2500,
    images: [
      { url: 'desk1.jpg', filename: 'desk1.jpg' },
      { url: 'desk2.jpg', filename: 'desk2.jpg' }
    ]
  },
  {
    title: 'Porcelain Chinese Vase - Ming Dynasty',
    description: 'Hand-painted porcelain vase with blue and white traditional Chinese motifs. Features dragons and floral patterns characteristic of Ming Dynasty craftsmanship. Minor age-related wear.',
    category: 'ceramics',
    estimatedAge: 400,
    estimatedYear: 1620,
    estimatedPeriod: 'Ming Dynasty (1368-1644)',
    material: 'Porcelain',
    dimensions: { height: 35, diameter: 20 },
    condition: 'good',
    provenance: 'Acquired at Christie\'s auction, London',
    estimatedValue: 5000,
    images: [
      { url: 'vase1.jpg', filename: 'vase1.jpg' },
      { url: 'vase2.jpg', filename: 'vase2.jpg' }
    ]
  },
  {
    title: 'Gold Pocket Watch - Elgin Watch Company',
    description: 'Exquisite 14K gold pocket watch by Elgin Watch Company. Open face with Roman numerals and ornate case. Fully functional and keeps excellent time. Original chain included.',
    category: 'timepieces',
    estimatedAge: 110,
    estimatedYear: 1910,
    estimatedPeriod: 'Edwardian Era (1901-1910)',
    material: '14K Gold, sapphire crystal',
    condition: 'excellent',
    provenance: 'Family heirloom, authenticated',
    estimatedValue: 3500,
    images: [
      { url: 'watch1.jpg', filename: 'watch1.jpg' },
      { url: 'watch2.jpg', filename: 'watch2.jpg' }
    ]
  },
  {
    title: 'Art Deco Emerald and Diamond Brooch',
    description: 'Stunning Art Deco brooch featuring a 2-carat emerald surrounded by brilliant-cut diamonds set in platinum. Expertly crafted with geometric design elements typical of the Art Deco period.',
    category: 'jewelry',
    estimatedAge: 90,
    estimatedYear: 1930,
    estimatedPeriod: 'Art Deco (1920s-1930s)',
    material: 'Platinum, emerald, diamonds',
    condition: 'excellent',
    provenance: 'Museum deaccession',
    estimatedValue: 8000,
    images: [
      { url: 'brooch1.jpg', filename: 'brooch1.jpg' },
      { url: 'brooch2.jpg', filename: 'brooch2.jpg' }
    ]
  },
  {
    title: 'First Edition - The Great Gatsby',
    description: 'First edition, first printing of F. Scott Fitzgerald\'s "The Great Gatsby" (1925). Original dust jacket present in good condition. Signed by the author on the title page.',
    category: 'books',
    estimatedAge: 99,
    estimatedYear: 1925,
    estimatedPeriod: 'Roaring Twenties (1920s)',
    material: 'Paper, cloth binding',
    condition: 'good',
    provenance: 'Acquired from antiquarian dealer',
    estimatedValue: 15000,
    images: [
      { url: 'book1.jpg', filename: 'book1.jpg' }
    ]
  },
  {
    title: 'Persian Hand-Knotted Wool Carpet',
    description: 'Authentic Persian Tabriz carpet, hand-knotted with traditional patterns. Rich red and navy blue colorwork with intricate floral and geometric designs. High knot density ensures durability.',
    category: 'textiles',
    estimatedAge: 60,
    estimatedYear: 1960,
    estimatedPeriod: 'Mid-20th Century',
    material: 'Wool, natural dyes',
    dimensions: { length: 300, width: 200 },
    condition: 'good',
    provenance: 'Purchased in Tehran, Iran',
    estimatedValue: 4000,
    images: [
      { url: 'carpet1.jpg', filename: 'carpet1.jpg' },
      { url: 'carpet2.jpg', filename: 'carpet2.jpg' }
    ]
  },
  {
    title: 'Bronze Sculpture - Auguste Rodin Style',
    description: 'Bronze sculpture in the style of Auguste Rodin. Abstract figure representing contemplation. Cast using lost-wax process. Mounted on marble base.',
    category: 'artwork',
    estimatedAge: 80,
    estimatedYear: 1940,
    estimatedPeriod: 'Modern Art (1940s)',
    material: 'Bronze, marble',
    dimensions: { height: 45 },
    condition: 'excellent',
    provenance: 'Estate sale, Paris',
    estimatedValue: 6000,
    images: [
      { url: 'sculpture1.jpg', filename: 'sculpture1.jpg' }
    ]
  },
  {
    title: 'Antique Silver Flatware Set',
    description: 'Complete 12-piece sterling silver flatware set with ornate handles and monogrammed bowls. Hallmarked and verified authentic. Includes service for 6 with dinner and dessert forks, knives, and spoons.',
    category: 'metalware',
    estimatedAge: 130,
    estimatedYear: 1890,
    estimatedPeriod: 'Late Victorian (1880s-1890s)',
    material: 'Sterling silver',
    condition: 'good',
    provenance: 'Estate inheritance',
    estimatedValue: 2000,
    images: [
      { url: 'silver1.jpg', filename: 'silver1.jpg' },
      { url: 'silver2.jpg', filename: 'silver2.jpg' }
    ]
  }
];

const seedDemoItems = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI is not defined in .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Get demo users
    const collectorUser = await User.findOne({ email: 'collector@example.com' });
    const verifierUser = await User.findOne({ email: 'verifier@example.com' });

    if (!collectorUser || !verifierUser) {
      console.error('❌ Error: Demo users not found. Run seed-demo-users.js first');
      process.exit(1);
    }

    console.log('✓ Found demo users');

    // Delete existing demo items
    const deleteResult = await Item.deleteMany({
      owner: { $in: [collectorUser._id, verifierUser._id] }
    });
    console.log(`✓ Removed ${deleteResult.deletedCount} existing demo items`);

    // Clear the blockchainHash index to prevent duplicate key errors
    try {
      await Item.collection.dropIndex('blockchainHash_1');
      console.log('✓ Dropped blockchainHash index');
    } catch (err) {
      // Index might not exist, that's fine
    }

    // Create demo items, alternating between collector and verifier as owner
    const createdItems = [];
    for (let i = 0; i < DEMO_ITEMS.length; i++) {
      const owner = i % 2 === 0 ? collectorUser._id : verifierUser._id;
      const item = new Item({
        ...DEMO_ITEMS[i],
        owner,
        createdAt: new Date()
      });
      await item.save();
      createdItems.push(item);
    }

    console.log(`✓ Created ${createdItems.length} demo items:\n`);
    createdItems.forEach((item, index) => {
      const owner = item.owner.equals(collectorUser._id) ? 'collector@example.com' : 'verifier@example.com';
      console.log(`  ${index + 1}. ${item.title}`);
      console.log(`     Category: ${item.category}`);
      console.log(`     Owner: ${owner}`);
      console.log(`     Estimated Value: $${item.estimatedValue}`);
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

seedDemoItems();
