/**
 * Pending token balance per address (accumulated from 100k+ races, score/120).
 * Stored in Redis when REDIS_URL is set.
 */

import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;
const PENDING_PREFIX = 'crazy_racer:pending_tokens:';

export function isPendingTokensAvailable(): boolean {
  return !!REDIS_URL;
}

async function withRedis<T>(fn: (client: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  if (!REDIS_URL) throw new Error('REDIS_URL not set');
  const client = createClient({ url: REDIS_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.quit();
  }
}

function key(addr: string): string {
  return `${PENDING_PREFIX}${addr.toLowerCase()}`;
}

/** Get pending balance in wei (string). */
export async function getPendingBalance(address: string): Promise<string> {
  if (!isPendingTokensAvailable()) return '0';
  try {
    const raw = await withRedis((c) => c.get(key(address)));
    return raw ?? '0';
  } catch {
    return '0';
  }
}

/** Add to pending balance. amountWei = tokens in wei (18 decimals). */
export async function addPendingBalance(address: string, amountWei: bigint): Promise<void> {
  if (!isPendingTokensAvailable() || amountWei <= BigInt(0)) return;
  try {
    await withRedis(async (client) => {
      const k = key(address);
      const raw = await client.get(k);
      const prev = raw ? BigInt(raw) : BigInt(0);
      await client.set(k, (prev + amountWei).toString());
    });
  } catch {
    // ignore
  }
}

/** Get balance and set to 0 (for withdraw: sign once, then clear). */
export async function getAndClearPendingBalance(address: string): Promise<string> {
  if (!isPendingTokensAvailable()) return '0';
  try {
    return await withRedis(async (client) => {
      const k = key(address);
      const raw = await client.get(k);
      const balance = raw ?? '0';
      await client.set(k, '0');
      return balance;
    });
  } catch {
    return '0';
  }
}
