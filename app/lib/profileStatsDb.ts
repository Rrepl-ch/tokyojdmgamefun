/**
 * Profile stats in Redis: один ключ на адрес, компактный JSON.
 * Запись только при обновлении (конец заезда или Base), не нагружаем БД.
 */

import { createClient } from 'redis';
import type { ProfileStats } from '@/app/lib/profileStats';

const REDIS_URL = process.env.REDIS_URL;
const PROFILE_PREFIX = 'crazy_racer:profile:';

export function isProfileDbAvailable(): boolean {
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

const DEFAULT_STATS: ProfileStats = {
  totalDistance: 0,
  totalCarsPassed: 0,
  gamesPerCar: {},
  totalGames: 0,
};

function normalizeStats(raw: unknown): ProfileStats {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATS };
  const o = raw as Record<string, unknown>;
  const gamesPerCar: Record<number, number> = {};
  if (o.gamesPerCar && typeof o.gamesPerCar === 'object') {
    for (const [k, v] of Object.entries(o.gamesPerCar)) {
      const id = parseInt(k, 10);
      if (Number.isFinite(id) && typeof v === 'number') gamesPerCar[id] = v;
    }
  }
  return {
    totalDistance: typeof o.totalDistance === 'number' ? o.totalDistance : 0,
    totalCarsPassed: typeof o.totalCarsPassed === 'number' ? o.totalCarsPassed : 0,
    gamesPerCar,
    totalGames: typeof o.totalGames === 'number' ? o.totalGames : 0,
    connectedWithBaseAt:
      typeof o.connectedWithBaseAt === 'number' ? o.connectedWithBaseAt : undefined,
  };
}

export async function getProfileStatsRedis(address: string): Promise<ProfileStats | null> {
  if (!isProfileDbAvailable()) return null;
  const key = `${PROFILE_PREFIX}${address.toLowerCase()}`;
  try {
    return await withRedis(async (client) => {
      const raw = await client.get(key);
      if (!raw) return null;
      try {
        return normalizeStats(JSON.parse(raw));
      } catch {
        return null;
      }
    });
  } catch {
    return null;
  }
}

export type ProfileStatsUpdate = {
  distance: number;
  carsPassed: number;
  carId: number;
  chainId?: number;
};

/** Один read + один write: мержим update в текущие данные и сохраняем. */
export async function mergeProfileStatsRedis(
  address: string,
  update: ProfileStatsUpdate
): Promise<void> {
  if (!isProfileDbAvailable()) return;
  const key = `${PROFILE_PREFIX}${address.toLowerCase()}`;
  try {
    await withRedis(async (client) => {
      const raw = await client.get(key);
      const prev = raw ? normalizeStats(JSON.parse(raw)) : { ...DEFAULT_STATS };
      const gamesPerCar = { ...prev.gamesPerCar };
      gamesPerCar[update.carId] = (gamesPerCar[update.carId] ?? 0) + 1;

      const next: ProfileStats = {
        totalDistance: prev.totalDistance + Math.floor(update.distance),
        totalCarsPassed: prev.totalCarsPassed + update.carsPassed,
        gamesPerCar,
        totalGames: prev.totalGames + 1,
        connectedWithBaseAt: prev.connectedWithBaseAt,
      };

      const isBase = update.chainId === 8453 || update.chainId === 84532;
      if (isBase && next.connectedWithBaseAt == null) {
        next.connectedWithBaseAt = Date.now();
      }

      await client.set(key, JSON.stringify(next));
    });
  } catch {
    // ignore
  }
}

/** Только выставить connectedWithBaseAt, если ещё не стоит. */
export async function ensureBaseRecordedRedis(address: string): Promise<void> {
  if (!isProfileDbAvailable()) return;
  const key = `${PROFILE_PREFIX}${address.toLowerCase()}`;
  try {
    await withRedis(async (client) => {
      const raw = await client.get(key);
      const prev = raw ? normalizeStats(JSON.parse(raw)) : { ...DEFAULT_STATS };
      if (prev.connectedWithBaseAt != null) return;
      const next: ProfileStats = { ...prev, connectedWithBaseAt: Date.now() };
      await client.set(key, JSON.stringify(next));
    });
  } catch {
    // ignore
  }
}
