# Web App Environment Variables

This document lists all environment variables needed for the web application.

## Quick Setup

Create a `.env.local` file in `apps/web/` directory with the following variables:

```bash
# Copy this template to apps/web/.env.local
```

## Required Environment Variables

### Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_BASE_URL` | Base URL of your application | `http://localhost:3000` | No (has default) |
| `NEXT_PUBLIC_APP_ENV` | Application environment | `development` | No (has default) |
| `NEXT_PUBLIC_VERCEL_ENV` | Vercel environment (auto-set by Vercel) | `development` | No (has default) |

### Blockchain Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_CHAIN` | Blockchain network to use | Auto-detected | No |
| | Options: `"celo"` or `"sepolia"` | | |
| | If not set: | | |
| | - Uses `celo` when `NEXT_PUBLIC_VERCEL_ENV=production` | | |
| | - Uses `sepolia` for all other environments | | |

### Farcaster Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_FARCASTER_HEADER` | Farcaster account association header | `build-time-placeholder` | Production: Yes |
| `NEXT_PUBLIC_FARCASTER_PAYLOAD` | Farcaster account association payload | `build-time-placeholder` | Production: Yes |
| `NEXT_PUBLIC_FARCASTER_SIGNATURE` | Farcaster account association signature | `build-time-placeholder` | Production: Yes |
| `NEXT_PUBLIC_FARCASTER_ASSOCIATION_JSON` | Alternative: JSON format of all three above | `""` | No (use individual vars) |

**How to get Farcaster values:**
1. Go to: https://farcaster.xyz/~/developers/mini-apps/manifest?domain=YOUR_DOMAIN
2. Sign in with your Farcaster account
3. Sign the manifest
4. Copy the `header`, `payload`, and `signature` values

### Security & Authentication

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret for signing session tokens | None | Yes (for production) |

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

### Development/Demo

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_ALLOWED_DEMO_WALLET` | Allowed demo wallet address for testing | `0xc95df660001358c0bAf8D778c913eef9612f59F5` | No (has default) |

## Example `.env.local` File

```env
# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Blockchain
NEXT_PUBLIC_CHAIN=sepolia

# Farcaster (for production)
NEXT_PUBLIC_FARCASTER_HEADER=your-header-here
NEXT_PUBLIC_FARCASTER_PAYLOAD=your-payload-here
NEXT_PUBLIC_FARCASTER_SIGNATURE=your-signature-here

# Security
JWT_SECRET=your-secure-jwt-secret-here
```

## Production Setup

For production deployments (e.g., Vercel):

1. **Set all required variables** in your deployment platform
2. **Generate Farcaster account association** for your production domain
3. **Use a secure JWT_SECRET** (generate with `openssl rand -base64 32`)
4. **Set NEXT_PUBLIC_CHAIN=celo** for mainnet, or leave unset (auto-detects from VERCEL_ENV)

## Development with ngrok

If using ngrok for local development:

1. Start ngrok: `ngrok http 3000`
2. Copy the ngrok URL (e.g., `https://abc123.ngrok-free.app`)
3. Set `NEXT_PUBLIC_BASE_URL=https://abc123.ngrok-free.app`
4. Generate Farcaster association for the ngrok domain
5. Update Farcaster env variables

## Chain Selection Logic

The app automatically selects the chain based on:

1. **First priority**: `NEXT_PUBLIC_CHAIN` (if explicitly set)
2. **Second priority**: `NEXT_PUBLIC_VERCEL_ENV`:
   - `production` → uses `celo` (mainnet)
   - `preview` or `development` → uses `sepolia` (testnet)
3. **Default**: `sepolia` (testnet)

## Contract Addresses

Contract addresses are hardcoded in `src/lib/constants.ts` and automatically selected based on the chain. No environment variables needed for contract addresses.

## Related Documentation

- [Farcaster Setup Guide](../../docs/FARCASTER_SETUP.md)
- [Quick Auth Setup](../../docs/QUICK_AUTH_SETUP.md)

