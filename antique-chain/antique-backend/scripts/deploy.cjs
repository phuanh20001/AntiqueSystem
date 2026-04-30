const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying AntiqueVerification contract to Sepolia...");

  // Get the contract factory — Hardhat uses this to deploy
  const Contract = await ethers.getContractFactory("AntiqueVerification");

  // Deploy the contract — this sends a real transaction to Sepolia
  const contract = await Contract.deploy();

  // Wait until the transaction is mined on Sepolia
  await contract.waitForDeployment();

  // Get the contract's permanent address on Sepolia
  const address = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📋 Contract address:", address);
  console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + address);
  console.log("");
  console.log("⚠️  IMPORTANT: Copy the contract address above and paste it");
  console.log("    into your .env file as CONTRACT_ADDRESS=", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
