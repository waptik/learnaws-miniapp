# learnaws-miniapp

A CodeSignal-style assessment MiniApp for AWS certification practice (CLF-C02) built on Celo blockchain with token rewards.

**Features**:
- 🎯 Practice assessments with 50 random questions
- 🏆 Token rewards for passing (1 token per pass, max 3/day)
- 📚 Questions sourced from [AWS-Certified-Cloud-Practitioner-Notes](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes)
- 💰 Celo blockchain integration for token rewards
- 🎨 Bold, high-contrast CodeSignal-inspired UI

A modern Celo blockchain application built with Next.js, TypeScript, and Turborepo.

> 📋 **Current Phase**: PRD/Planning - See [PRD.md](./docs/PRD.md) for product requirements and [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for detailed architecture.

## 🚀 Getting Started

> **📖 New to the project?** Start with the [Complete Setup Guide](./docs/SETUP.md) for detailed installation instructions, environment configuration, and deployment steps.

### Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   - Web app: Create `apps/web/.env.local` (see [Web App ENV Setup](./apps/web/ENV_SETUP.md))
   - Contracts: Create `apps/contracts/.env` (see [Contracts README](./apps/contracts/README.md))

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

For complete setup instructions, troubleshooting, and deployment guides, see the [Complete Setup Guide](./docs/SETUP.md).

## Project Structure

This is a monorepo managed by Turborepo with the following structure:

- `apps/web` - Next.js application with embedded UI components and utilities
- `apps/hardhat` - Smart contract development environment

## Available Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages and apps
- `pnpm type-check` - Run TypeScript type checking

### Phase 1 Scripts

- `pnpm phase1:fetch` - Fetch, parse, deduplicate, and save questions from GitHub (uses Bun)

### Smart Contract Scripts

- `pnpm contracts:compile` - Compile smart contracts
- `pnpm contracts:test` - Run smart contract tests
- `pnpm contracts:deploy` - Deploy contracts to local network
- `pnpm contracts:deploy:sepolia` - Deploy to Celo Sepolia testnet (test)
- `pnpm contracts:deploy:celo` - Deploy to Celo mainnet (live)
- `pnpm contracts:verify` - Verify contracts on Celoscan

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Smart Contracts**: Hardhat with Viem
- **Monorepo**: Turborepo
- **Package Manager**: PNPM

## 📚 Documentation

### Setup & Configuration
- **[Complete Setup Guide](./docs/SETUP.md)** ⭐ - **Start here!** Complete installation, environment setup, and deployment guide
- [Web App Environment Setup](./apps/web/ENV_SETUP.md) - Web application environment variables
- [Contracts README](./apps/contracts/README.md) - Smart contract setup and deployment
- [Farcaster Setup](./docs/FARCASTER_SETUP.md) - Farcaster MiniApp integration guide
- [Quick Auth Setup](./docs/QUICK_AUTH_SETUP.md) - Quick Auth integration guide

### Product & Architecture
- [PRD](./docs/PRD.md) - Product Requirements Document
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Detailed architecture and implementation guide
- [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md) - High-level overview

### Technical Specifications
- [Design System](./docs/DESIGN_SYSTEM.md) - Celo brand design system reference
- [Design System Implementation](./docs/DESIGN_SYSTEM_IMPLEMENTATION.md) - Implementation status
- [Results Display Specification](./docs/RESULTS_DISPLAY_SPEC.md) - Assessment results format
- [Question Types](./docs/QUESTION_TYPES.md) - Multiple choice and multiple response question formats

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Celo Documentation](https://docs.celo.org/)
- [Celo Composer Kit](https://docs.celo.org/composer)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [AWS Practice Exams Source](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes)
