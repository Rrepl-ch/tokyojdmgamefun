import { createClient } from 'redis';
import { LeaderboardEntry } from './store';

const REDIS_URL = process.env.REDIS_URL;
const ENTRY_PREFIX = 'crazy_racer:entry:';
const NICKNAME_PREFIX = 'crazy_racer:nickname:';

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
            if (parsed && typeof parsed.playerId === 'string' && typeof parsed.score === 'number') {
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
  const key = `${ENTRY_PREFIX}${entry.playerId}`;
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
          playerId: entry.playerId,
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

export async function getBestScoreByPlayerIdRedis(playerId: string): Promise<number> {
  if (!isRedisAvailable()) return 0;
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(`${ENTRY_PREFIX}${playerId}`);
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

export async function getNicknameByPlayerIdRedis(playerId: string): Promise<string | null> {
  if (!isRedisAvailable()) return null;
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(`${NICKNAME_PREFIX}${playerId}`);
      return raw ? String(raw) : null;
    });
  } catch {
    return null;
  }
}

export async function registerNicknameRedis(playerId: string, nickname: string): Promise<{ ok: boolean; error?: string }> {
  if (!isRedisAvailable()) return { ok: false, error: 'Storage not available' };
  const normalized = nickname.trim();
  const key = normalized.toLowerCase();
  if (normalized.length < 2 || normalized.length > 20) {
    return { ok: false, error: 'Nickname must be 2–20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(normalized)) {
    return { ok: false, error: 'Only letters, numbers and underscore' };
  }
  try {
    return await withRedis(async (client) => {
      const existing = await client.get(`${NICKNAME_PREFIX}${playerId}`);
      if (existing) return { ok: false, error: 'You already have a nickname and cannot change it' };
      const takenBy = await client.get(`crazy_racer:nickname_lookup:${key}`);
      if (takenBy && takenBy !== playerId) return { ok: false, error: 'This nickname is already taken' };
      await client.set(`${NICKNAME_PREFIX}${playerId}`, normalized);
      await client.set(`crazy_racer:nickname_lookup:${key}`, playerId);
      return { ok: true };
    });
  } catch {
    return { ok: false, error: 'Failed to save' };
  }
}

export async function hasNicknameRedis(playerId: string): Promise<boolean> {
  if (!isRedisAvailable()) return false;
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(`${NICKNAME_PREFIX}${playerId}`);
      return !!raw;
    });
  } catch {
    return false;
  }
}

export async function isNicknameAvailableRedis(nickname: string, excludePlayerId?: string): Promise<boolean> {
  if (!isRedisAvailable()) return true;
  const key = nickname.trim().toLowerCase();
  if (!key || key.length < 2) return false;
  try {
    return await withRedis(async (client) => {
      const playerId = await client.get(`crazy_racer:nickname_lookup:${key}`);
      if (!playerId) return true;
      return excludePlayerId ? playerId === excludePlayerId : false;
    });
  } catch {
    return true;
  }
}
