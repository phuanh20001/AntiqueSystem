const router = require('express').Router();
const Item = require('../models/Item');
const VerificationRecord = require('../models/VerificationRecord');
const blockchainService = require('../services/blockchainService');

// POST /api/verifications — legacy compatibility route for frontend
router.post('/', async (req, res) => {
  try {
    const { itemId, verifiedBy, decision, notes, authenticityScore } = req.body;

    if (!itemId || !decision) {
      return res.status(400).json({ error: 'itemId and decision are required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const status = decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'pending';

    const verification = await VerificationRecord.create({
      item: itemId,
      verifier: verifiedBy || null,
      status,
      verificationMethod: 'manual',
      authenticationScore: authenticityScore || null,
      verificationDetails: {
        notes: notes || '',
      },
      timeline: [
        {
          event: 'created',
          description: `Legacy verification record ${status}`,
          performedBy: verifiedBy || null,
          timestamp: new Date(),
        },
      ],
      metadata: {
        notes: notes || '',
      },
    });

    await Item.findByIdAndUpdate(itemId, {
      verificationStatus: status,
      verificationRecord: verification._id,
    });

    res.status(201).json({
      verification,
      txHash: null,
      metadataHash: null,
      certificate: null,
    });
  } catch (err) {
    console.error('Legacy verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/verifications/chain/:itemId — read record directly from blockchain
router.get('/chain/:itemId', async (req, res) => {
  try {
    if (!req.params.itemId || !req.params.itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    if (!blockchainService.contract) {
      return res.status(503).json({ error: 'Blockchain service is not configured' });
    }

    const record = await blockchainService.getVerificationFromChain(req.params.itemId);
    res.json(record);
  } catch (err) {
    console.error('Legacy blockchain lookup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/verifications/:itemId — get verification from MongoDB
router.get('/:itemId', async (req, res) => {
  try {
    if (!req.params.itemId || !req.params.itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const verification = await VerificationRecord.findOne({ item: req.params.itemId })
      .populate('verifier', 'username email');

    if (!verification) {
      return res.status(404).json({ error: 'No verification found' });
    }

    res.json(verification);
  } catch (err) {
    console.error('Legacy verification lookup error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;