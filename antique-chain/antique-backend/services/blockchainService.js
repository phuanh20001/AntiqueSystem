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

    console.log(`[blockchainService] Fetching record for itemId: ${itemId}`);
    console.log(`[blockchainService] Contract address: ${await contract.getAddress()}`);

    const record = await contract.getRecord(itemId);
    
    console.log(`[blockchainService] Record retrieved successfully:`, record);
    
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
    console.error('[blockchainService] Error retrieving from chain:', error);
    
    // Check if this is a "record not found" error (require() failed)
    const isNotFound = error.message && (
      error.message.includes('No record found') ||
      error.message.includes('execution reverted') ||
      error.reason === 'No record found for this item'
    );
    
    if (isNotFound) {
      console.log(`[blockchainService] Record not found for itemId: ${itemId}`);
      throw new Error(`No verification record found on-chain for this item`);
    }
    
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
 * Generate Etherscan URL for a transaction
 * @param {string} txHash - Transaction hash
 * @returns {string} - Etherscan URL
 */
function getEtherscanUrl(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

module.exports = {
  generateMetadataHash,
  submitVerificationToBlockchain,
  getVerificationFromChain,
  isItemVerifiedOnChain,
  getEtherscanUrl,
  contract,
  provider
};
