import { LeaderboardEntry } from './store';

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const ENTRY_PREFIX = 'crazy_racer:entry:';

export function isRedisAvailable(): boolean {
  return !!(REDIS_URL && REDIS_TOKEN);
}

export async function getLeaderboardRedis(limit: number): Promise<LeaderboardEntry[]> {
  if (!isRedisAvailable()) return [];
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! });
    const keys = await redis.keys(`${ENTRY_PREFIX}*`);
    const entries: LeaderboardEntry[] = [];
    for (const key of keys) {
      const raw = await redis.get(key);
      if (raw && typeof raw === 'object' && 'address' in raw && 'score' in raw) {
        entries.push(raw as LeaderboardEntry);
      }
    }
    return entries.sort((a, b) => b.score - a.score).slice(0, limit);
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
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! });
    const existing = (await redis.get(key)) as LeaderboardEntry | null;
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
      await redis.set(key, full);
    }
  } catch {
    // ignore
  }
}

export async function getBestScoreByAddressRedis(address: string): Promise<number> {
  if (!isRedisAvailable()) return 0;
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! });
    const entry = (await redis.get(`${ENTRY_PREFIX}${address.toLowerCase()}`)) as LeaderboardEntry | null;
    return entry?.score ?? 0;
  } catch {
    return 0;
  }
}
