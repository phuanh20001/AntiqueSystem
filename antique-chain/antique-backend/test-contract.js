require('dotenv').config();
const { ethers } = require('ethers');

const contractABI = [
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
  }
];

async function testContract() {
  const providerUrl = process.env.ALCHEMY_SEPOLIA_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

  console.log('=== Contract Debug Test ===');
  console.log('Provider URL:', providerUrl ? '✓ set' : '✗ not set');
  console.log('Contract Address:', contractAddress);
  console.log('Deployer Key:', deployerPrivateKey ? '✓ set' : '✗ not set');

  if (!providerUrl || !contractAddress || !deployerPrivateKey) {
    console.error('Missing configuration. Please check .env');
    process.exit(1);
  }

  try {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    console.log('\n=== Testing contract connection ===');
    console.log('Contract address resolved:', contractAddress);

    // Test 1: Try to fetch code at address
    const code = await provider.getCode(contractAddress);
    console.log('Contract bytecode present:', code !== '0x' ? '✓ Yes' : '✗ No (empty address)');

    // Test 2: Try a simple read
    console.log('\n=== Attempting to read contract method ===');
    const testItemId = '69f7dea80c7d36e3ef523049';
    console.log(`Calling getRecord("${testItemId}")...`);

    try {
      const record = await contract.getRecord(testItemId);
      console.log('✓ Record found:', record);
    } catch (err) {
      console.log('✗ Error calling getRecord:', err.message);
      console.log('   Reason:', err.reason || err.code || 'unknown');
      
      if (err.message.includes('No record found')) {
        console.log('\n→ This is expected: the item has not been verified on-chain yet.');
      } else if (code === '0x') {
        console.log('\n→ ERROR: No contract code at this address. Did you deploy it?');
        console.log('→ Check CONTRACT_ADDRESS in .env');
      } else {
        console.log('\n→ RPC/ABI mismatch. Check CONTRACT_ADDRESS and ABI.');
      }
    }

    // Test 3: Check verifier status
    console.log('\n=== Checking verifier status ===');
    try {
      const isVerifier = await contract.approvedVerifiers(wallet.address);
      console.log(`Wallet ${wallet.address} is verifier:`, isVerifier);
    } catch (err) {
      console.log('✗ Error checking verifier:', err.message);
    }

  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

testContract();
