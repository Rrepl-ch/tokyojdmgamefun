"use client";
import { ReactNode, useState } from "react";
import { base } from "wagmi/chains";
import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { MiniAppProvider } from "./providers/MiniAppProvider";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "d573c8a861fbe6e691c284093d3d3b53";
const appUrl = process.env.NEXT_PUBLIC_URL || "https://crazyracer.app";

const config = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [
    farcasterMiniApp(),
    coinbaseWallet({ appName: "Crazy Racer", appLogoUrl: `${appUrl}/cars/icon.png` }),
    walletConnect({ projectId }),
    injected(),
  ],
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MiniAppProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </MiniAppProvider>
  );
}
