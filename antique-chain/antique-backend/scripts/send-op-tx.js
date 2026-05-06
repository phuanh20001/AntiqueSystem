require('dotenv').config();

const hre = require('hardhat');
const { ethers } = require('ethers');

function createHardhatBrowserProvider() {
  return new ethers.BrowserProvider({
    request: async ({ method, params }) => hre.network.provider.send(method, params || []),
  });
}

async function main() {
  console.log('Sending transaction using the configured Hardhat network');

  const provider = createHardhatBrowserProvider();
  const sender = await provider.getSigner();

  console.log('Sending 1 wei from', await sender.getAddress(), 'to itself');

  const tx = await sender.sendTransaction({
    to: await sender.getAddress(),
    value: 1n,
  });

  await tx.wait();

  console.log('Transaction sent successfully');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});