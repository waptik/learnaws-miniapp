import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

// Support custom RPC URLs via environment variables for better reliability
// Example: Use Infura, Alchemy, or QuickNode endpoints
// SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
const networkConfig = {
  celo: {
    url: process.env.CELO_RPC_URL || "https://forno.celo.org",
    chainId: 42220,
  },
  sepolia: {
    url:
      process.env.SEPOLIA_RPC_URL ||
      "https://forno.celo-sepolia.celo-testnet.org",
    chainId: 11142220,
  },
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Celo Mainnet (Live)
    celo: {
      url: networkConfig.celo.url,
      accounts,
      chainId: networkConfig.celo.chainId,
      timeout: 120000, // 120 seconds
    },
    // Celo Sepolia Testnet (Test)
    sepolia: {
      url: networkConfig.sepolia.url,
      accounts,
      chainId: networkConfig.sepolia.chainId,
      timeout: 120000, // 120 seconds
    },
  },
  etherscan: {
    apiKey: {
      celo: process.env.CELOSCAN_API_KEY || "",
      sepolia: process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://celo.blockscout.com/api",
          browserURL: "https://celo.blockscout.com",
        },
      },
      {
        network: "sepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://celo-sepolia.blockscout.com/api",
          browserURL: "https://celo-sepolia.blockscout.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;
