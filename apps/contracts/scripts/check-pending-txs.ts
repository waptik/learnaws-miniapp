import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const CELO_RPC_URL = process.env.CELO_RPC_URL || "https://forno.celo.org";
const ACCOUNT_ADDRESS = "0xa7e4fb151d97b2f9baef5bf3253e4484db0e1c4d";

async function checkPendingTransactions() {
  console.log("🔍 Checking pending transactions...\n");
  console.log(`Account: ${ACCOUNT_ADDRESS}`);
  console.log(`Network: Celo Mainnet (${CELO_RPC_URL})\n`);

  try {
    const provider = new ethers.JsonRpcProvider(CELO_RPC_URL);

    // Get current nonce (includes pending transactions)
    const pendingNonce = await provider.getTransactionCount(
      ACCOUNT_ADDRESS,
      "pending"
    );
    const latestNonce = await provider.getTransactionCount(
      ACCOUNT_ADDRESS,
      "latest"
    );

    console.log(`📊 Nonce Status:`);
    console.log(`   Latest block nonce: ${latestNonce}`);
    console.log(`   Pending nonce: ${pendingNonce}`);
    console.log(`   Pending transactions: ${pendingNonce - latestNonce}\n`);

    if (pendingNonce > latestNonce) {
      console.log(
        `⚠️  Found ${pendingNonce - latestNonce} pending transaction(s)!`
      );
      console.log(`\n💡 Solutions:`);
      console.log(`   1. Wait for transactions to get 5 confirmations`);
      console.log(`   2. Check transaction status on Celo Explorer:`);
      console.log(`      https://celoscan.io/address/${ACCOUNT_ADDRESS}`);
      console.log(
        `   3. If transactions are stuck, you may need to wait or cancel them`
      );
      console.log(`\n⏳ You can check again by running: pnpm check:pending`);
    } else {
      console.log(`✅ No pending transactions found!`);
      console.log(`   You should be able to deploy now.`);
    }

    // Try to get the latest block to show confirmations needed
    const latestBlock = await provider.getBlockNumber();
    console.log(`\n📦 Latest block: ${latestBlock}`);
    console.log(
      `   Hardhat Ignition requires 5 confirmations before proceeding.`
    );
  } catch (error) {
    console.error("❌ Error checking transactions:", error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
  }
}

checkPendingTransactions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
