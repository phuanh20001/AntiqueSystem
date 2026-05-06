require('dotenv').config();

module.exports = {
  solidity: '0.8.28',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    sepolia:
      process.env.ALCHEMY_SEPOLIA_URL && process.env.DEPLOYER_PRIVATE_KEY
        ? {
            url: process.env.ALCHEMY_SEPOLIA_URL,
            accounts: [process.env.DEPLOYER_PRIVATE_KEY],
          }
        : undefined,
  },
};