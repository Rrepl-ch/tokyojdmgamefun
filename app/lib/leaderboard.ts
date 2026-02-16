import { createClient } from 'redis';
import { LeaderboardEntry } from './store';

const REDIS_URL = process.env.REDIS_URL;
const ENTRY_PREFIX = 'crazy_racer:entry:';

export function isRedisAvailable(): boolean {
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

export async function getLeaderboardRedis(limit: number): Promise<LeaderboardEntry[]> {
  if (!isRedisAvailable()) return [];
  try {
    return await withRedis(async (client) => {
      const keys = await client.keys(`${ENTRY_PREFIX}*`);
      const entries: LeaderboardEntry[] = [];
      for (const key of keys) {
        const raw = await client.get(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as LeaderboardEntry;
            if (parsed && typeof parsed.address === 'string' && typeof parsed.score === 'number') {
              entries.push(parsed);
            }
          } catch {
            // skip invalid entry
          }
        }
      }
      return entries.sort((a, b) => b.score - a.score).slice(0, limit);
    });
  } catch {
    return [];
  }
}

export async function addLeaderboardEntryRedis(
  entry: Omit<LeaderboardEntry, 'timestamp'> & { avatar?: string }
): Promise<void> {
  if (!isRedisAvailable()) return;
  const key = `${ENTRY_PREFIX}${entry.address.toLowerCase()}`;
  try {
    await withRedis(async (client) => {
      const raw = await client.get(key);
      let existing: LeaderboardEntry | null = null;
      if (raw) {
        try {
          existing = JSON.parse(raw) as LeaderboardEntry;
        } catch {
          // ignore
        }
      }
      const newScore = Math.floor(entry.score);
      if (!existing || newScore > existing.score) {
        const full: LeaderboardEntry = {
          nickname: entry.nickname,
          score: newScore,
          address: entry.address,
          carId: entry.carId,
          timestamp: Date.now(),
          avatar: entry.avatar ?? existing?.avatar ?? '',
        };
        await client.set(key, JSON.stringify(full));
      }
    });
  } catch {
    // ignore
  }
}

export async function getBestScoreByAddressRedis(address: string): Promise<number> {
  if (!isRedisAvailable()) return 0;
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(`${ENTRY_PREFIX}${address.toLowerCase()}`);
      if (!raw) return 0;
      try {
        const parsed = JSON.parse(raw) as LeaderboardEntry;
        return typeof parsed.score === 'number' ? parsed.score : 0;
      } catch {
        return 0;
      }
    });
  } catch {
    return 0;
  }
}
