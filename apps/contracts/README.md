# learnaws-miniapp - Smart Contracts

This directory contains the smart contracts for learnaws-miniapp, built with
Hardhat and optimized for the Celo blockchain.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm compile

# Run tests
pnpm test

# Deploy to Sepolia testnet (test)
pnpm deploy:sepolia

# Deploy to Celo mainnet (live)
pnpm deploy:celo
```

## 📜 Available Scripts

- `pnpm compile` - Compile smart contracts
- `pnpm test` - Run contract tests
- `pnpm deploy:sepolia` - Deploy to Celo Sepolia testnet (test)
- `pnpm deploy:celo` - Deploy to Celo mainnet (live)
- `pnpm verify` - Verify contracts on Celoscan
- `pnpm clean` - Clean artifacts and cache

## 🌐 Networks

### Celo Mainnet (Live)

- **Chain ID**: 42220
- **RPC URL**: https://forno.celo.org
- **Explorer**: https://celoscan.io

### Celo Sepolia Testnet (Test)

- **Chain ID**: 11142220
- **RPC URL**: https://forno.celo-sepolia.celo-testnet.org
- **Explorer**: https://celo-sepolia.blockscout.com
- **Faucet**: https://faucet.celo.org/celo-sepolia

## 🔧 Environment Setup

1. Create a `.env` file in the `apps/contracts` directory:
   ```bash
   cd apps/contracts
   touch .env
   ```

2. Fill in your private key and API keys:
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   CELOSCAN_API_KEY=your_celoscan_api_key
   ```

3. **Optional: Use Custom RPC URLs** - If you experience connection timeouts
   with the default public RPC endpoints, you can use alternative providers:
   ```env
   # Use Infura, Alchemy, or QuickNode for better reliability
   SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
   CELO_RPC_URL=https://forno.celo.org
   ```

4. **Optional: Skip Deployment Confirmation** - Deployments automatically skip
   confirmation prompts. If you want to enable prompts, you can remove the
   `HARDHAT_IGNITION_CONFIRM_DEPLOYMENT=false` from the deployment scripts or
   set it to `true` in your `.env` file.

## 🐛 Troubleshooting

### Connection Timeout Issues

If deployments are timing out or hanging:

1. **Use Alternative RPC Providers**: The public RPC endpoints can be slow.
   Consider using:
   - **Infura**: Sign up at https://infura.io and use their Celo endpoints
   - **Alchemy**: Sign up at https://alchemy.com and use their Celo endpoints
   - **QuickNode**: Sign up at https://quicknode.com and use their Celo
     endpoints

2. **Check Network Connectivity**: Ensure your firewall isn't blocking
   connections

3. **Increase Timeout**: Timeouts are set to 120 seconds by default. If needed,
   you can modify `hardhat.config.ts`

4. **Verify RPC Endpoint**: Test the RPC endpoint directly:
   ```bash
   curl -X POST https://forno.celo-sepolia.celo-testnet.org \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

## 📁 Project Structure

```
contracts/          # Smart contract source files
├── Lock.sol        # Sample timelock contract

test/              # Contract tests
├── Lock.ts        # Tests for Lock contract

ignition/          # Deployment scripts
└── modules/
    └── Lock.ts    # Lock contract deployment

hardhat.config.ts  # Hardhat configuration
tsconfig.json      # TypeScript configuration
```

## 🔐 Security Notes

- Never commit your `.env` file with real private keys
- Use a dedicated wallet for development/testing
- Test thoroughly on Sepolia testnet before mainnet deployment
- Consider using a hardware wallet for mainnet deployments

## 📚 Learn More

- [Hardhat Documentation](https://hardhat.org/docs)
- [Celo Developer Documentation](https://docs.celo.org)
- [Celo Smart Contract Best Practices](https://docs.celo.org/developer/contractkit)
- [Viem Documentation](https://viem.sh) (Ethereum library used by Hardhat)
