import "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  // Tells Hardhat which version of Solidity to use
  solidity: {
    version: "0.8.28",
  },

  networks: {
    // Local test network — runs on your computer (instant, free)
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545"
    },

    // Sepolia public testnet — real Ethereum test network
    sepolia: {
      type: "http",
      url: configVariable("ALCHEMY_SEPOLIA_URL"),
      accounts: [configVariable("METAMASK_PRIVATE_KEY")]
    }
  }
});