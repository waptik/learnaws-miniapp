import { env } from "@/lib/env";
import { APP_FULL_NAME } from "./constants";

/**
 * Get the farcaster manifest for the frame, generate yours from Warpcast Mobile
 *  On your phone to Settings > Developer > Domains > insert website hostname > Generate domain manifest
 * @returns The farcaster manifest for the frame
 */
export async function getFarcasterManifest() {
  const frameName = APP_FULL_NAME;
  const appUrl = env.NEXT_PUBLIC_BASE_URL;
  const noindex =
    appUrl.includes("localhost") ||
    appUrl.includes("ngrok") ||
    appUrl.includes("https://dev.") ||
    appUrl.startsWith("https://dev-");

  // Parse account association from JSON if provided, otherwise use individual variables
  let accountAssociation: {
    header: string;
    payload: string;
    signature: string;
  } | null = null;

  // Try to parse from JSON first (preferred method)
  if (env.NEXT_PUBLIC_FARCASTER_ASSOCIATION_JSON) {
    try {
      const parsed = JSON.parse(env.NEXT_PUBLIC_FARCASTER_ASSOCIATION_JSON);
      if (
        parsed.header &&
        parsed.payload &&
        parsed.signature &&
        parsed.header !== "build-time-placeholder" &&
        parsed.payload !== "build-time-placeholder" &&
        parsed.signature !== "build-time-placeholder"
      ) {
        accountAssociation = {
          header: parsed.header,
          payload: parsed.payload,
          signature: parsed.signature,
        };
      }
    } catch (e) {
      console.error(
        "[getFarcasterManifest] >> Failed to parse NEXT_PUBLIC_FARCASTER_ASSOCIATION_JSON:",
        e
      );
    }
  }

  // Fall back to individual variables if JSON not provided or invalid
  if (!accountAssociation) {
    const hasValidAccountAssociation =
      env.NEXT_PUBLIC_FARCASTER_HEADER !== "build-time-placeholder" &&
      env.NEXT_PUBLIC_FARCASTER_PAYLOAD !== "build-time-placeholder" &&
      env.NEXT_PUBLIC_FARCASTER_SIGNATURE !== "build-time-placeholder";

    if (hasValidAccountAssociation) {
      accountAssociation = {
        header: env.NEXT_PUBLIC_FARCASTER_HEADER,
        payload: env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
        signature: env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
      };
    }
  }

  // In development mode, allow placeholder values for testing
  const isDevelopment =
    env.NEXT_PUBLIC_APP_ENV === "development" || appUrl.includes("localhost");

  console.log("[getFarcasterManifest] >> isDevelopment", isDevelopment);
  console.log(
    "[getFarcasterManifest] >> hasValidAccountAssociation",
    !!accountAssociation
  );

  if (!accountAssociation && !isDevelopment) {
    throw new Error(
      "Account association not configured. Please generate your account association at: https://farcaster.xyz/~/developers/mini-apps/manifest?domain=" +
        new URL(appUrl).hostname +
        " and set either NEXT_PUBLIC_FARCASTER_ASSOCIATION_JSON (JSON format) or NEXT_PUBLIC_FARCASTER_HEADER, NEXT_PUBLIC_FARCASTER_PAYLOAD, and NEXT_PUBLIC_FARCASTER_SIGNATURE environment variables."
    );
  }

  // Use development fallback values if in development mode and no real values are set
  if (!accountAssociation) {
    accountAssociation = {
      // Development fallback - these are placeholder values for local testing
      header:
        "eyJmaWQiOjI2MDgxMiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweEE3ZTRmYjE1MWQ5N0IyRjliYUVmNWJGMzI1M2U0NDg0RGIwRTFDNGQifQ",
      payload: "eyJkb21haW4iOiJjZWxvLndhcHRpay54eXoifQ",
      signature:
        "s/GvbH88TjkAykVtBgfzgdUzsH6xMsMY1SFSZ+sBPq0rZonW6fy/jUnaUr6AJd5H0shIlLTa84WQCdfQBZg5MRs=",
    };
  }

  let name = frameName;

  if (isDevelopment) {
    name = `${frameName} (Dev)`;
  }

  return {
    accountAssociation,
    miniapp: {
      version: "1",
      name,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/opengraph-image.png`,
      buttonTitle: `Launch App`,
      splashImageUrl: `${appUrl}/opengraph-image.png`,
      splashBackgroundColor: "#FFFFFF",
      webhookUrl: `${appUrl}/api/webhook`,
      // Metadata https://github.com/farcasterxyz/miniapps/discussions/191
      subtitle: "Practice for AWS Certs", // 30 characters, no emojis or special characters, short description under app name
      description: "A miniapp to prepare yourself for aws certifications", // 170 characters, no emojis or special characters, promotional message displayed on Mini App Page
      primaryCategory: "social",
      tags: ["mini-app", "celo"], // up to 5 tags, filtering/search tags
      tagline: "Built on Celo", // 30 characters, marketing tagline should be punchy and descriptive
      ogTitle: `${frameName}`, // 30 characters, app name + short tag, Title case, no emojis
      ogDescription: "A miniapp to prepare yourself for aws certifications", // 100 characters, summarize core benefits in 1-2 lines
      screenshotUrls: [
        // 1284 x 2778, visual previews of the app, max 3 screenshots
        `${appUrl}/opengraph-image.png`,
      ],
      heroImageUrl: `${appUrl}/opengraph-image.png`, // 1200 x 630px (1.91:1), promotional display image on top of the mini app store
      noindex,
    },
  };
}
