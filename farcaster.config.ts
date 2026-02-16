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
    payload: "eyJkb21haW4iOiJ0b2t5b2pkbS52ZXJjZWwuYXBwIn0",
    signature: "bPE+uXQ9hJZox+GXeUjz8OX63QdfjjiAcTUx5aAmL3NHV9E1q9hMre87ZEgMDDbfdu5cizsEp2AMtrYmHnJhhBw="
  },
  miniapp: {
    version: "1",
    name: "Tokyo JDM",
    subtitle: "Tunnel racer on Base",
    description: "Top-down tunnel racer. Distance is score, dodge cars and obstacles.",
    screenshotUrls: [
      `${ROOT_URL}/screenshots/screen1.png`,
      `${ROOT_URL}/screenshots/screen2.png`,
      `${ROOT_URL}/screenshots/screen3.png`,
    ],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["marketing", "ads", "quickstart", "waitlist"],
    heroImageUrl: `${ROOT_URL}/splash.png`,
    tagline: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: `${ROOT_URL}/splash.png`,
  },
} as const;

