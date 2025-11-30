# Complete Setup Guide

This guide will walk you through setting up the LearnAWS Miniapp project from
scratch, including all prerequisites, environment configuration, and deployment
steps.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Smart Contract Setup](#smart-contract-setup)
- [Farcaster Integration](#farcaster-integration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18.0.0 or higher)
   ```bash
   node --version  # Should be >= 18.0.0
   ```

2. **PNPM** (v8.0.0 or higher)
   ```bash
   npm install -g pnpm@8.10.0
   pnpm --version  # Should be >= 8.0.0
   ```

3. **Git**
   ```bash
   git --version
   ```

### Optional but Recommended

- **Bun** (for running Phase 1 scripts)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

- **ngrok** (for local Farcaster development)
  ```bash
  npm install -g ngrok
  # Or download from https://ngrok.com/download
  ```

### Accounts & Services

- **GitHub Account** (for cloning the repository)
- **Farcaster Account** (for miniapp integration)
- **Celo Wallet** (for contract deployment)
- **Celoscan API Key** (optional, for contract verification)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/waptik/learnaws-miniapp.git
cd learnaws-miniapp
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for both the web app and smart contracts
using Turborepo.

### 3. Verify Installation

```bash
# Check that all packages are installed
pnpm list --depth=0

# Run type checking
pnpm type-check
```

---

## Environment Configuration

The project requires environment variables for both the web application and
smart contracts.

### Web Application Environment

1. **Create `.env.local` file** in `apps/web/`:

```bash
cd apps/web
touch .env.local
```

2. **Add required variables** (see
   [Web App Environment Setup](../apps/web/ENV_SETUP.md) for details):

```env
# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Blockchain (optional - auto-detects based on environment)
NEXT_PUBLIC_CHAIN=sepolia

# Security (required for production)
JWT_SECRET=your-secure-jwt-secret-here

# Farcaster (optional for local dev, required for production)
NEXT_PUBLIC_FARCASTER_HEADER=build-time-placeholder
NEXT_PUBLIC_FARCASTER_PAYLOAD=build-time-placeholder
NEXT_PUBLIC_FARCASTER_SIGNATURE=build-time-placeholder
```

**Generate JWT Secret:**

```bash
openssl rand -base64 32
```

**For detailed web app environment setup, see:**
[Web App ENV Setup](../apps/web/ENV_SETUP.md)

### Smart Contract Environment

1. **Create `.env` file** in `apps/contracts/`:

```bash
cd apps/contracts
touch .env
```

2. **Add required variables**:

```env
# Private keys for deployment (without 0x prefix)
# PRIVATE_KEY is used for Celo mainnet deployments
PRIVATE_KEY=your_private_key_here

# SEPOLIA_PRIVATE_KEY is used for Celo Sepolia testnet deployments
# You can use the same key or a different one for testnet
SEPOLIA_PRIVATE_KEY=your_sepolia_private_key_here

# Optional: Celoscan API key for contract verification
CELOSCAN_API_KEY=your_celoscan_api_key

# Optional: Custom RPC URLs (for better reliability)
# Use Infura, Alchemy, or QuickNode for better reliability
CELO_RPC_URL=https://forno.celo.org
SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org

# Optional: Enable gas reporting in tests
# REPORT_GAS=true
```

#### Contract Environment Variables Summary

| Variable            | Description                                    | Required For        | Default                    |
| ------------------- | ---------------------------------------------- | ------------------- | -------------------------- |
| `PRIVATE_KEY`       | Private key for Celo mainnet deployments      | Mainnet deployment  | None                       |
| `SEPOLIA_PRIVATE_KEY` | Private key for Celo Sepolia testnet deployments | Testnet deployment | None (can use PRIVATE_KEY) |
| `CELOSCAN_API_KEY`  | API key for contract verification on Celoscan  | Contract verification | None                    |
| `CELO_RPC_URL`      | Custom RPC URL for Celo mainnet                | Optional            | `https://forno.celo.org`   |
| `SEPOLIA_RPC_URL`   | Custom RPC URL for Celo Sepolia testnet        | Optional            | `https://forno.celo-sepolia...` |
| `REPORT_GAS`        | Enable gas reporting in tests                  | Optional            | undefined                  |

**⚠️ Security Note:** Never commit `.env` or `.env.local` files to version
control. They are already in `.gitignore`.

**For detailed contract environment setup, see:**
[Contracts README](../apps/contracts/README.md)

---

## Running the Application

### Development Mode

1. **Start the development server:**

```bash
# From project root
pnpm dev
```

This will start:

- Next.js web app on `http://localhost:3000`
- Hot reload enabled for both frontend and contracts

2. **Open in browser:**

```
http://localhost:3000
```

### Available Scripts

From the project root:

```bash
# Development
pnpm dev              # Start development servers
pnpm build            # Build all packages and apps
pnpm lint             # Lint all packages and apps
pnpm type-check       # Run TypeScript type checking

# Smart Contracts
pnpm contracts:compile        # Compile smart contracts
pnpm contracts:test           # Run contract tests
pnpm contracts:deploy:sepolia # Deploy to Celo Sepolia testnet
pnpm contracts:deploy:celo    # Deploy to Celo mainnet
pnpm contracts:verify        # Verify contracts on Celoscan
pnpm contracts:check:pending  # Check for pending transactions
```

---

## Smart Contract Setup

### Compile Contracts

```bash
pnpm contracts:compile
```

### Run Tests

```bash
pnpm contracts:test
```

### Deploy to Testnet (Recommended First)

1. **Ensure `SEPOLIA_PRIVATE_KEY` is set in `apps/contracts/.env`:**
   ```env
   SEPOLIA_PRIVATE_KEY=your_sepolia_private_key_without_0x_prefix
   ```
   > **Note:** You can use the same private key as `PRIVATE_KEY` or use a different wallet for testnet.

2. **Get testnet tokens:**
   - Visit [Celo Sepolia Faucet](https://faucet.celo.org/celo-sepolia)
   - Request testnet tokens for your deployment address (the address derived from `SEPOLIA_PRIVATE_KEY`)

3. **Deploy to Sepolia:**
   ```bash
   pnpm contracts:deploy:sepolia
   ```

3. **Verify deployment:**
   - Check [Celo Sepolia Explorer](https://celo-sepolia.blockscout.com)
   - Update contract addresses in `apps/web/src/lib/constants.ts` if needed

### Deploy to Mainnet

⚠️ **Warning:** Only deploy to mainnet after thorough testing on testnet!

1. **Ensure `PRIVATE_KEY` is set in `apps/contracts/.env`:**
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ```
   > **Note:** Make sure this wallet has sufficient CELO for gas fees.

2. **Check for pending transactions:**
   ```bash
   cd apps/contracts
   pnpm check:pending
   ```

3. **Deploy to Celo mainnet:**
   ```bash
   pnpm contracts:deploy:celo
   ```

3. **Update contract addresses:**
   - Copy deployed addresses from the output
   - Update `apps/web/src/lib/constants.ts` with new addresses

4. **Verify contracts (optional):**
   ```bash
   pnpm contracts:verify --network celo
   ```

**For detailed contract setup, see:**
[Contracts README](../apps/contracts/README.md)

---

## Farcaster Integration

### For Local Development (with ngrok)

1. **Start your development server:**
   ```bash
   pnpm dev
   ```

2. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok-free.app`)

4. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_BASE_URL=https://abc123.ngrok-free.app
   ```

5. **Generate Farcaster account association:**
   - Visit:
     https://farcaster.xyz/~/developers/mini-apps/manifest?domain=abc123.ngrok-free.app
   - Sign in with your Farcaster account
   - Sign the manifest
   - Copy the `header`, `payload`, and `signature` values

6. **Update `.env.local` with Farcaster values:**
   ```env
   NEXT_PUBLIC_FARCASTER_HEADER=your-header-here
   NEXT_PUBLIC_FARCASTER_PAYLOAD=your-payload-here
   NEXT_PUBLIC_FARCASTER_SIGNATURE=your-signature-here
   ```

7. **Restart the development server:**
   ```bash
   pnpm dev
   ```

### For Production

1. **Deploy your app** to your production domain

2. **Generate account association** for your production domain:
   - Visit:
     https://farcaster.xyz/~/developers/mini-apps/manifest?domain=yourdomain.com
   - Sign the manifest with your Farcaster account

3. **Set environment variables** in your deployment platform (Vercel, etc.)

**For detailed Farcaster setup, see:**
[Farcaster Setup Guide](./FARCASTER_SETUP.md)

---

## Deployment

### Web Application Deployment

#### Vercel (Recommended)

1. **Connect your repository** to Vercel

2. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_BASE_URL` - Your production URL
   - `NEXT_PUBLIC_CHAIN` - `celo` for production
   - `JWT_SECRET` - Your secure JWT secret
   - Farcaster variables (if using Farcaster integration)

3. **Deploy:**
   - Vercel will automatically deploy on push to main branch
   - Or trigger manual deployment from dashboard

#### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- AWS Amplify
- Self-hosted (Docker, etc.)

### Smart Contract Deployment

See [Smart Contract Setup](#smart-contract-setup) section above.

---

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors

```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules apps/*/node_modules
pnpm install
```

#### 2. Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

#### 3. Contract deployment fails with IGN403 error

This means there are pending transactions. Use the diagnostic tool:

```bash
cd apps/contracts
pnpm check:pending
```

Wait for transactions to get 5+ confirmations, then retry.

**For more troubleshooting, see:**
[Contracts README - Troubleshooting](../apps/contracts/README.md#-troubleshooting)

#### 4. Farcaster manifest errors

- Ensure `NEXT_PUBLIC_BASE_URL` matches your actual domain
- Verify Farcaster account association values are correct
- Check that the manifest endpoint is accessible:
  `https://yourdomain.com/.well-known/farcaster.json`

**For more Farcaster troubleshooting, see:**
[Farcaster Setup Guide - Troubleshooting](./FARCASTER_SETUP.md#troubleshooting)

#### 5. TypeScript errors

```bash
# Run type checking
pnpm type-check

# Fix common issues
pnpm lint --fix
```

#### 6. Build failures

```bash
# Clean build artifacts
pnpm clean

# Rebuild
pnpm build
```

---

## Next Steps

After completing setup:

1. **Read the Documentation:**
   - [PRD](./PRD.md) - Product Requirements
   - [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Architecture details
   - [Design System](./DESIGN_SYSTEM.md) - UI/UX guidelines

2. **Explore the Codebase:**
   - `apps/web/src/` - Web application code
   - `apps/contracts/contracts/` - Smart contracts
   - `apps/contracts/test/` - Contract tests

3. **Run Tests:**
   ```bash
   pnpm contracts:test
   ```

4. **Start Developing:**
   - Make changes to the code
   - Test locally with `pnpm dev`
   - Deploy to testnet for testing
   - Deploy to mainnet when ready

---

## Additional Resources

### Documentation

- [Web App Environment Setup](../apps/web/ENV_SETUP.md)
- [Contracts README](../apps/contracts/README.md)
- [Farcaster Setup Guide](./FARCASTER_SETUP.md)
- [Quick Auth Setup](./QUICK_AUTH_SETUP.md)

### External Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Celo Documentation](https://docs.celo.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Farcaster Mini Apps](https://miniapps.farcaster.xyz/)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the detailed documentation links above
3. Check existing GitHub issues
4. Create a new issue with:
   - Your environment (OS, Node version, etc.)
   - Steps to reproduce
   - Error messages/logs
   - What you've already tried

---

**Happy coding! 🚀**
