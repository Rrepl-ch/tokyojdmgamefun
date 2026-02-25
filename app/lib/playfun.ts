/**
 * Play.fun (Open Game Protocol) SDK integration.
 * @see https://docs.play.fun/integrations/ai-integration-guide
 */

declare global {
  interface Window {
    OpenGameSDK?: OpenGameSDKClass;
  }
}

type OpenGameSDKClass = new (opts?: { ui?: { usePointsWidget?: boolean; theme?: string }; logLevel?: string }) => OpenGameSDKInstance;

export interface OpenGameSDKInstance {
  init(opts: { gameId: string }): void;
  on(event: string, cb: () => void): void;
  addPoints(amount: number): void;
  endGame(): Promise<void>;
  getPoints(): Promise<{ points?: number } | undefined>;
  playerId?: string;
}

const SCRIPT_URL = 'https://sdk.play.fun';
const POLL_MS = 100;
const MAX_WAIT_MS = 10000;

function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  const meta = document.querySelector('meta[name="x-ogp-key"]');
  return (meta?.getAttribute('content') ?? '').trim();
}

function getGameId(): string {
  return (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLAYFUN_GAME_ID) || '';
}

/** Load the Play.fun SDK script if not already present. */
export function loadPlayFunScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.OpenGameSDK) return Promise.resolve();
  if (document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
    return waitForOpenGameSDK();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => waitForOpenGameSDK().then(resolve).catch(reject);
    script.onerror = () => reject(new Error('Play.fun SDK script failed to load'));
    document.head.appendChild(script);
  });
}

function waitForOpenGameSDK(): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (window.OpenGameSDK) {
        resolve();
        return;
      }
      if (Date.now() - start > MAX_WAIT_MS) {
        reject(new Error('Play.fun SDK not available'));
        return;
      }
      setTimeout(check, POLL_MS);
    };
    check();
  });
}

export function isPlayFunConfigured(): boolean {
  return !!(getApiKey() && getGameId());
}
