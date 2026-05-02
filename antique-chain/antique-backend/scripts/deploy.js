require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  console.log("Deploying AntiqueVerification contract to Sepolia...");

  const artifactPath = path.join(
    __dirname,
    '..',
    'artifacts',
    'contracts',
    'AntiqueVerification.sol',
    'AntiqueVerification.json'
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error('Missing contract artifact. Run `npm run compile` first.');
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const providerUrl = process.env.ALCHEMY_SEPOLIA_URL;
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!providerUrl || !deployerPrivateKey) {
    throw new Error('ALCHEMY_SEPOLIA_URL and DEPLOYER_PRIVATE_KEY must be set in .env');
  }

  const provider = new ethers.JsonRpcProvider(providerUrl);
  const wallet = new ethers.Wallet(deployerPrivateKey, provider);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  // Deploy the contract to Sepolia using the configured wallet.
  const contract = await factory.deploy();

  // Wait until the transaction is mined
  await contract.waitForDeployment();

  // Get the contract's permanent address
  const address = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📋 Contract address:", address);
  if (process.env.ALCHEMY_SEPOLIA_URL) {
    console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + address);
  }
  console.log("");
  console.log("⚠️  IMPORTANT: Copy the contract address above and paste it");
  console.log("    into your .env file as CONTRACT_ADDRESS=", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});