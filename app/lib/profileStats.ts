/**
 * Profile stats: localStorage (офлайн/кэш) + API/Redis (БД, один ключ на адрес).
 */

const STORAGE_PREFIX = 'jdm_profile_';
const API_STATS = '/api/profile/stats';

export type ProfileStats = {
  totalDistance: number;
  totalCarsPassed: number;
  gamesPerCar: Record<number, number>;
  totalGames: number;
  connectedWithBaseAt?: number;
};

const DEFAULT_STATS: ProfileStats = {
  totalDistance: 0,
  totalCarsPassed: 0,
  gamesPerCar: {},
  totalGames: 0,
};

function storageKey(address: string): string {
  return `${STORAGE_PREFIX}${address.toLowerCase()}`;
}

export function getProfileStats(address: string | undefined): ProfileStats | null {
  if (typeof window === 'undefined' || !address) return null;
  try {
    const raw = localStorage.getItem(storageKey(address));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<ProfileStats>;
    return {
      ...DEFAULT_STATS,
      ...data,
      gamesPerCar: typeof data.gamesPerCar === 'object' && data.gamesPerCar ? data.gamesPerCar : {},
    };
  } catch {
    return null;
  }
}

export function updateProfileStats(
  address: string | undefined,
  update: {
    distance: number;
    carsPassed: number;
    carId: number;
    chainId?: number;
  }
): void {
  if (typeof window === 'undefined' || !address) return;
  const key = storageKey(address);
  const prev = getProfileStats(address) ?? { ...DEFAULT_STATS };
  const gamesPerCar = { ...prev.gamesPerCar };
  gamesPerCar[update.carId] = (gamesPerCar[update.carId] ?? 0) + 1;

  const next: ProfileStats = {
    totalDistance: prev.totalDistance + update.distance,
    totalCarsPassed: prev.totalCarsPassed + update.carsPassed,
    gamesPerCar,
    totalGames: prev.totalGames + 1,
    connectedWithBaseAt: prev.connectedWithBaseAt,
  };

  const isBase = update.chainId === 8453 || update.chainId === 84532;
  if (isBase && next.connectedWithBaseAt == null) {
    next.connectedWithBaseAt = Date.now();
  }

  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** Отправить на сервер инкремент после заезда. Вызывается из page.tsx вместе с updateProfileStats. */
export async function syncProfileUpdateToApi(
  address: string | undefined,
  update: { distance: number; carsPassed: number; carId: number; chainId?: number }
): Promise<void> {
  if (!address || typeof window === 'undefined') return;
  try {
    await fetch(API_STATS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, update }),
    });
  } catch {
    // ignore
  }
}

/** Запросить статистику из БД. При открытии профиля — один GET. */
export async function fetchProfileStatsFromApi(address: string | undefined): Promise<ProfileStats | null> {
  if (!address || typeof window === 'undefined') return null;
  try {
    const res = await fetch(`${API_STATS}?address=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data?.stats && typeof data.stats === 'object') {
      const s = data.stats as Record<string, unknown>;
      const gamesPerCar: Record<number, number> = {};
      if (s.gamesPerCar && typeof s.gamesPerCar === 'object') {
        for (const [k, v] of Object.entries(s.gamesPerCar)) {
          const id = parseInt(k, 10);
          if (Number.isFinite(id) && typeof v === 'number') gamesPerCar[id] = v;
        }
      }
      return {
        totalDistance: typeof s.totalDistance === 'number' ? s.totalDistance : 0,
        totalCarsPassed: typeof s.totalCarsPassed === 'number' ? s.totalCarsPassed : 0,
        gamesPerCar,
        totalGames: typeof s.totalGames === 'number' ? s.totalGames : 0,
        connectedWithBaseAt: typeof s.connectedWithBaseAt === 'number' ? s.connectedWithBaseAt : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Сообщить серверу «зашёл с Base» для ачивки. */
export async function ensureBaseRecordedApi(address: string | undefined): Promise<void> {
  if (!address || typeof window === 'undefined') return;
  try {
    await fetch(API_STATS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, baseRecorded: true }),
    });
  } catch {
    // ignore
  }
}

/** Call when profile is viewed on Base chain to unlock Base Wallet achievement without playing. */
export function ensureBaseRecorded(address: string | undefined, chainId?: number): void {
  if (typeof window === 'undefined' || !address) return;
  const isBase = chainId === 8453 || chainId === 84532;
  if (!isBase) return;
  const prev = getProfileStats(address);
  if (prev?.connectedWithBaseAt != null) return;
  const key = storageKey(address);
  const next: ProfileStats = {
    ...(prev ?? DEFAULT_STATS),
    connectedWithBaseAt: Date.now(),
  };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getFavoriteCarId(stats: ProfileStats | null): number {
  if (!stats || Object.keys(stats.gamesPerCar).length === 0) return 0;
  let maxCount = 0;
  let favoriteId = 0;
  for (const [idStr, count] of Object.entries(stats.gamesPerCar)) {
    const id = parseInt(idStr, 10);
    if (Number.isFinite(id) && count > maxCount) {
      maxCount = count;
      favoriteId = id;
    }
  }
  return favoriteId;
}

// Distance milestones: 5000, 10000, 20000, 40000, 80000, 160000
export const DISTANCE_MILESTONES = [5000, 10000, 20000, 40000, 80000, 160000];

// Cars passed milestones
export const CARS_PASSED_MILESTONES = [50, 200, 500, 2000, 10000];

// Collection: number of different cars driven at least once
export const COLLECTION_MILESTONES = [2, 3, 4, 5, 6];

function getUniqueCarsCount(stats: ProfileStats | null): number {
  if (!stats?.gamesPerCar) return 0;
  return Object.keys(stats.gamesPerCar).length;
}

export type AchievementProgress = {
  unlocked: boolean;
  current?: number;
  target?: number;
};

/** bestScore = рекорд с лидерборда (один заезд), используется для ачивок "Расстояние". */
export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (stats: ProfileStats | null, chainId?: number, bestScore?: number) => boolean;
  getProgress?: (stats: ProfileStats | null, chainId?: number, bestScore?: number) => AchievementProgress;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // Расстояние = рекорд в одном заезде (из лидерборда)
  ...DISTANCE_MILESTONES.map((m) => ({
    id: `distance_${m}`,
    title: `${m >= 1000 ? m / 1000 + 'k' : m} km`,
    description: `Набрать ${m.toLocaleString()} очков в одном заезде`,
    icon: '🛣️',
    check: (_s: ProfileStats | null, _c?: number, bestScore?: number) => (bestScore ?? 0) >= m,
    getProgress: (_s: ProfileStats | null, _c?: number, bestScore?: number): AchievementProgress => {
      const cur = bestScore ?? 0;
      return { unlocked: cur >= m, current: cur, target: m };
    },
  })),
  // Cars passed
  ...CARS_PASSED_MILESTONES.map((m) => ({
    id: `cars_${m}`,
    title: `Обгонов: ${m}`,
    description: `Обогнать ${m} машин в сумме`,
    icon: '🚗',
    check: (s: ProfileStats | null) => (s ? s.totalCarsPassed >= m : false),
    getProgress: (s: ProfileStats | null): AchievementProgress => ({
      unlocked: s ? s.totalCarsPassed >= m : false,
      current: s?.totalCarsPassed ?? 0,
      target: m,
    }),
  })),
  // Collection: different cars driven
  ...COLLECTION_MILESTONES.map((m) => ({
    id: `collection_${m}`,
    title: `${m} машин`,
    description: `Прокатиться на ${m} разных машинах`,
    icon: '🏎️',
    check: (s: ProfileStats | null) => getUniqueCarsCount(s) >= m,
    getProgress: (s: ProfileStats | null): AchievementProgress => ({
      unlocked: getUniqueCarsCount(s) >= m,
      current: getUniqueCarsCount(s),
      target: m,
    }),
  })),
  // Base Wallet
  {
    id: 'base_wallet',
    title: 'Base Wallet',
    description: 'Вход через приложение Base Wallet',
    icon: '🔵',
    check: (s: ProfileStats | null, chainId?: number) => {
      const onBase = chainId === 8453 || chainId === 84532;
      const everConnectedBase = s?.connectedWithBaseAt != null;
      return onBase || everConnectedBase;
    },
    getProgress: (s: ProfileStats | null, chainId?: number): AchievementProgress => {
      const onBase = chainId === 8453 || chainId === 84532;
      const everConnectedBase = s?.connectedWithBaseAt != null;
      return { unlocked: onBase || everConnectedBase };
    },
  },
  // First game
  {
    id: 'first_game',
    title: 'Первый заезд',
    description: 'Сыграть первую игру',
    icon: '🎮',
    check: (s: ProfileStats | null) => (s ? s.totalGames >= 1 : false),
    getProgress: (s: ProfileStats | null): AchievementProgress => ({
      unlocked: s ? s.totalGames >= 1 : false,
      current: s?.totalGames ?? 0,
      target: 1,
    }),
  },
  // Veteran
  {
    id: 'veteran_50',
    title: 'Ветеран',
    description: '50 заездов',
    icon: '🏁',
    check: (s: ProfileStats | null) => (s ? s.totalGames >= 50 : false),
    getProgress: (s: ProfileStats | null): AchievementProgress => ({
      unlocked: s ? s.totalGames >= 50 : false,
      current: s?.totalGames ?? 0,
      target: 50,
    }),
  },
];

export function getAchievementProgress(
  ach: AchievementDef,
  stats: ProfileStats | null,
  chainId?: number,
  bestScore?: number | null
): AchievementProgress {
  const score = bestScore ?? 0;
  if (ach.getProgress) return ach.getProgress(stats, chainId, score);
  return { unlocked: ach.check(stats, chainId, score) };
}

/** Группы достижений: одна строка на группу, при раскрытии — список невыполненных этого класса */
export type AchievementGroupDef = {
  id: string;
  title: string;
  icon: string;
  achievementIds: string[];
};

export const ACHIEVEMENT_GROUPS: AchievementGroupDef[] = [
  {
    id: 'distance',
    title: 'Расстояние',
    icon: '🛣️',
    achievementIds: DISTANCE_MILESTONES.map((m) => `distance_${m}`),
  },
  {
    id: 'cars',
    title: 'Обгоны',
    icon: '🚗',
    achievementIds: CARS_PASSED_MILESTONES.map((m) => `cars_${m}`),
  },
  {
    id: 'collection',
    title: 'Коллекция машин',
    icon: '🏎️',
    achievementIds: COLLECTION_MILESTONES.map((m) => `collection_${m}`),
  },
  {
    id: 'base',
    title: 'Base Wallet',
    icon: '🔵',
    achievementIds: ['base_wallet'],
  },
  {
    id: 'games',
    title: 'Игры',
    icon: '🎮',
    achievementIds: ['first_game', 'veteran_50'],
  },
];

const ACHIEVEMENTS_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievementsByIds(ids: string[]): AchievementDef[] {
  return ids.map((id) => ACHIEVEMENTS_BY_ID.get(id)).filter(Boolean) as AchievementDef[];
}
