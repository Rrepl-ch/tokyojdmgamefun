const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const farcasterConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjMxNzQyOSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDBCOTNlZDBDRjg3ZTdEQWI5N0E2MTEwOGNFNTRkZGU4ZDAzNDVFNEMifQ",
    payload: "eyJkb21haW4iOiJjcmF6eS1yYWNlci52ZXJjZWwuYXBwIn0",
    signature: "njFaoiNZLfvrh34VGu9HyFLl+s3giJbQcqzb9SqNU8xCbA3Zip+WpX56gDks3415QEBBV5oVajLv1z6+XG/0URw="
  },
  miniapp: {
    version: "1",
    name: "Tokyo JDM",
    subtitle: "Tunnel racer on Base",
    description: "Top-down tunnel racer. Distance = score, dodge cars and obstacles.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/cars/icon.png`,
    splashImageUrl: `${ROOT_URL}/cars/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["marketing", "ads", "quickstart", "waitlist"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`, 
    tagline: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;

