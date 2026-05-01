const router             = require('express').Router();
const VerificationRecord = require('../models/VerificationRecord');
const AntiqueItem        = require('../models/AntiqueItem');
const Certificate        = require('../models/Certificate');
const blockchainService  = require('../services/blockchainService');

// POST /api/verifications — verifier submits a decision
router.post('/', async (req, res) => {
  try {
    const { itemId, verifiedBy, decision, notes, authenticityScore } = req.body;

    // ── STEP 1: Hash the full MongoDB verification data
    const dataToHash = {
      itemId,
      decision,
      notes,
      authenticityScore,
      timestamp: new Date().toISOString()
    };
    const metadataHash = blockchainService.generateMetadataHash(dataToHash);

    // ── STEP 2: Submit to blockchain
    const blockchainResult = await blockchainService.submitVerificationToBlockchain(
      itemId,
      decision === 'approved',
      metadataHash
    );
    const txHash = blockchainResult.txHash;

    // ── STEP 3: Save verification record to MongoDB
    const verification = await VerificationRecord.create({
      itemId,
      verifiedBy,
      decision,
      notes,
      authenticityScore,
      blockchainRef: txHash  // real Ethereum transaction hash
    });

    // ── STEP 4: Update the antique item status
    await AntiqueItem.findByIdAndUpdate(itemId, {
      status: decision === 'approved' ? 'verified' : 'rejected'
    });

    // ── STEP 5: Generate certificate if approved
    let certificate = null;
    if (decision === 'approved') {
      const item = await AntiqueItem.findById(itemId);
      const certNumber = 'CERT-' + new Date().getFullYear() + '-' +
                          String(Math.floor(Math.random() * 99999)).padStart(5, '0');
      certificate = await Certificate.create({
        itemId,
        verificationId: verification._id,
        certificateNumber: certNumber,
        blockHash: txHash,
        issuedTo: item.submittedBy
      });
    }

    // ── STEP 6: Return everything to the frontend
    res.status(201).json({
      verification,
      txHash,
      metadataHash,
      etherscanUrl: blockchainService.getEtherscanUrl(txHash),
      certificate
    });

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/verifications/chain/:itemId — read record directly from blockchain
router.get('/chain/:itemId', async (req, res) => {
  try {
    const record = await blockchainService.getVerificationFromChain(req.params.itemId);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/verifications/:itemId — get verification from MongoDB
router.get('/:itemId', async (req, res) => {
  try {
    const verification = await VerificationRecord
      .findOne({ itemId: req.params.itemId })
      .populate('verifiedBy', 'name email');
    if (!verification) return res.status(404).json({ error: 'No verification found' });
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;