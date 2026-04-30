import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "@nomicfoundation/hardhat-ignition";
import "dotenv/config";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
    },
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },

    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545"
    },

    // Sepolia public testnet — real Ethereum test network
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("ALCHEMY_SEPOLIA_URL"),
      accounts: [configVariable("METAMASK_PRIVATE_KEY")]
    }
  }
});