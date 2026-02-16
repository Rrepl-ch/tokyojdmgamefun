import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "./components/SafeArea";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
import { WelcomePopup } from "./components/WelcomePopup";
import { farcasterConfig } from "../farcaster.config";
import { Providers } from "./providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: farcasterConfig.miniapp.name,
    description: farcasterConfig.miniapp.description,
    icons: {
      icon: '/icon.png',
      apple: '/icon.png',
    },
    other: {
      'base:app_id': '6983a406394cf3c20a8af57c',
      "fc:frame": JSON.stringify({
        version: farcasterConfig.miniapp.version,
        imageUrl: farcasterConfig.miniapp.heroImageUrl,
        button: {
          title: `Join the ${farcasterConfig.miniapp.name} Waitlist`,
          action: {
            name: `Launch ${farcasterConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var t=localStorage.getItem('jdm_theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');})();`,
            }}
          />
        </head>
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <ThemeProvider>
            <ThemeToggle />
            <WelcomePopup />
            <SafeArea>{children}</SafeArea>
          </ThemeProvider>
        </body>
      </html>
    </Providers>
  );
}
