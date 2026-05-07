const { ethers } = require('ethers');
const crypto = require('crypto');

// Contract ABI mirrored from contracts/AntiqueVerification.sol.
const contractABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'itemId', type: 'string' },
      { indexed: true, internalType: 'address', name: 'verifier', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'isAuthentic', type: 'bool' },
      { indexed: false, internalType: 'string', name: 'metadataHash', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }
    ],
    name: 'ItemVerified',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'verifier', type: 'address' }
    ],
    name: 'VerifierAdded',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'verifier', type: 'address' }
    ],
    name: 'VerifierRemoved',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'itemId', type: 'string' },
      { indexed: true, internalType: 'address', name: 'revokedBy', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }
    ],
    name: 'VerificationRevoked',
    type: 'event'
  },
  {
    inputs: [
      { internalType: 'address', name: 'verifier', type: 'address' }
    ],
    name: 'addVerifier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'itemId', type: 'string' }
    ],
    name: 'getRecord',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'itemId', type: 'string' },
          { internalType: 'address', name: 'verifier', type: 'address' },
          { internalType: 'bool', name: 'isAuthentic', type: 'bool' },
          { internalType: 'string', name: 'metadataHash', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bool', name: 'exists', type: 'bool' }
        ],
        internalType: 'struct AntiqueVerification.VerificationRecord',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'itemId', type: 'string' }
    ],
    name: 'isVerified',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      { internalType: 'address', name: '', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' }
    ],
    name: 'approvedVerifiers',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: '', type: 'string' }
    ],
    name: 'records',
    outputs: [
      { internalType: 'string', name: 'itemId', type: 'string' },
      { internalType: 'address', name: 'verifier', type: 'address' },
      { internalType: 'bool', name: 'isAuthentic', type: 'bool' },
      { internalType: 'string', name: 'metadataHash', type: 'string' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { internalType: 'bool', name: 'exists', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'verifier', type: 'address' }
    ],
    name: 'removeVerifier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'itemId', type: 'string' }
    ],
    name: 'revokeVerification',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'itemId', type: 'string' },
      { internalType: 'bool', name: 'isAuthentic', type: 'bool' },
      { internalType: 'string', name: 'metadataHash', type: 'string' }
    ],
    name: 'verifyItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Connect to Sepolia via Alchemy
const providerUrl = process.env.ALCHEMY_SEPOLIA_URL;
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

const provider = providerUrl ? new ethers.JsonRpcProvider(providerUrl) : null;
const signer = provider && deployerPrivateKey ? new ethers.Wallet(deployerPrivateKey, provider) : null;
const contract = provider && signer && contractAddress && contractABI ? new ethers.Contract(contractAddress, contractABI, signer) : null;

/**
 * Generate SHA-256 hash from antique data
 * @param {Object} data - The verification data to hash
 * @returns {string} - The SHA-256 hex hash
 */
function generateMetadataHash(data) {
  const dataToHash = JSON.stringify(data);
  return crypto
    .createHash('sha256')
    .update(dataToHash)
    .digest('hex');
}

/**
 * Build the canonical data object that gets hashed at verification time
 * AND at proof-check time. Both sides MUST produce byte-identical output,
 * so we explicitly list and order the fields and stringify nullables.
 *
 * Excludes `owner` on purpose — ownership transfers via purchases would
 * otherwise invalidate the hash for legitimate item flows.
 *
 * @param {Object} item - Mongoose Item document or plain object
 * @returns {Object|null} - Canonical data ready to be passed to generateMetadataHash
 */
function buildItemCanonicalData(item) {
  if (!item) return null;
  return {
    itemId: item._id ? String(item._id) : null,
    title: item.title || null,
    description: item.description || null,
    category: item.category || null,
    material: item.material || null,
    estimatedPeriod: item.estimatedPeriod || null,
    estimatedYear: item.estimatedYear ?? null,
  };
}

/**
 * Submit verification to blockchain
 * @param {string} itemId - MongoDB item ID
 * @param {boolean} isAuthentic - Authentication decision
 * @param {string} metadataHash - SHA-256 hash of verification data
 * @returns {Promise<Object>} - Transaction receipt and hash
 */
async function submitVerificationToBlockchain(itemId, isAuthentic, metadataHash) {
  try {
    if (!contract) {
      throw new Error('Blockchain contract is not configured');
    }

    console.log('Sending transaction to Sepolia...');
    const tx = await contract.verifyItem(
      itemId,
      isAuthentic,
      metadataHash
    );

    console.log('Waiting for transaction to be mined...');
    const receipt = await tx.wait();
    const txHash = receipt.hash;
    console.log('Transaction mined! Hash:', txHash);

    return {
      txHash,
      receipt,
      success: true
    };
  } catch (error) {
    console.error('Blockchain submission error:', error);
    throw new Error(`Failed to submit verification: ${error.message}`);
  }
}

/**
 * Retrieve verification record directly from blockchain
 * @param {string} itemId - MongoDB item ID
 * @returns {Promise<Object>} - Verification record from chain
 */
async function getVerificationFromChain(itemId) {
  try {
    if (!contract) {
      throw new Error('Blockchain contract is not configured');
    }

    const record = await contract.getRecord(itemId);
    return {
      itemId: record.itemId,
      verifier: record.verifier,
      isAuthentic: record.isAuthentic,
      metadataHash: record.metadataHash,
      timestamp: new Date(Number(record.timestamp) * 1000).toISOString(),
      blockHash: record.blockHash,
      exists: record.exists
    };
  } catch (error) {
    console.error('Error retrieving from chain:', error);
    throw new Error(`Failed to retrieve verification: ${error.message}`);
  }
}

/**
 * Check if an item has been verified on-chain
 * @param {string} itemId - MongoDB item ID
 * @returns {Promise<boolean>} - True if verified
 */
async function isItemVerifiedOnChain(itemId) {
  try {
    if (!contract) {
      throw new Error('Blockchain contract is not configured');
    }

    return await contract.isVerified(itemId);
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw new Error(`Failed to check verification: ${error.message}`);
  }
}

/**
 * Owner-only: clears the active on-chain record for an itemId so it can be verified again.
 * @param {string} itemId - MongoDB item ID
 * @returns {Promise<Object>} - Transaction receipt and hash
 */
async function revokeVerificationOnChain(itemId) {
  try {
    if (!contract) {
      throw new Error('Blockchain contract is not configured');
    }

    console.log('Sending revokeVerification to Sepolia...');
    const tx = await contract.revokeVerification(itemId);
    console.log('Waiting for revoke transaction to be mined...');
    const receipt = await tx.wait();
    const txHash = receipt.hash;
    console.log('Revoke mined! Hash:', txHash);

    return {
      txHash,
      receipt,
      success: true
    };
  } catch (error) {
    console.error('Blockchain revoke error:', error);
    throw new Error(`Failed to revoke verification on chain: ${error.message}`);
  }
}

/**
 * Generate Etherscan URL for a transaction
 * @param {string} txHash - Transaction hash
 * @returns {string} - Etherscan URL
 */
function getEtherscanUrl(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

module.exports = {
  generateMetadataHash,
  buildItemCanonicalData,
  submitVerificationToBlockchain,
  revokeVerificationOnChain,
  getVerificationFromChain,
  isItemVerifiedOnChain,
  getEtherscanUrl,
  contract,
  provider
};
