// In-memory store for leaderboard and one-time nicknames (no blockchain).
// For production replace with DB (e.g. Vercel KV, Postgres).

export type LeaderboardEntry = {
  nickname: string;
  score: number;
  playerId: string;
  carId: number;
  timestamp: number;
  avatar?: string;
};

/** Один ник на playerId, задаётся один раз и нельзя менять. */
const nicknameByPlayerId = new Map<string, string>();
/** Уникальность ника: nickname (lowercase) -> playerId */
const playerIdByNickname = new Map<string, string>();
/** Лучший счёт на playerId */
const leaderboardByPlayerId = new Map<string, LeaderboardEntry>();

const MAX_LEADERBOARD = 100;

export function getLeaderboard(limit = MAX_LEADERBOARD): LeaderboardEntry[] {
  return [...leaderboardByPlayerId.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function addLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'timestamp'> & { avatar?: string }
): void {
  const key = entry.playerId;
  const existing = leaderboardByPlayerId.get(key);
  const newScore = Math.floor(entry.score);
  const avatar = entry.avatar ?? existing?.avatar ?? '';
  if (!existing || newScore > existing.score) {
    leaderboardByPlayerId.set(key, {
      nickname: entry.nickname,
      score: newScore,
      playerId: entry.playerId,
      carId: entry.carId,
      timestamp: Date.now(),
      avatar,
    });
  } else if (existing && (entry as { avatar?: string }).avatar !== undefined) {
    (existing as LeaderboardEntry).avatar = (entry as { avatar?: string }).avatar ?? '';
  }
}

export function getBestScoreByPlayerId(playerId: string): number {
  const entry = leaderboardByPlayerId.get(playerId);
  return entry ? entry.score : 0;
}

/** Проверка: свободен ли ник (никто другой его не занял). */
export function isNicknameAvailable(nickname: string, excludePlayerId?: string): boolean {
  const key = nickname.trim().toLowerCase();
  if (!key || key.length < 2) return false;
  const existing = playerIdByNickname.get(key);
  if (!existing) return true;
  return excludePlayerId ? existing === excludePlayerId : false;
}

/** Зарегистрировать ник для playerId. Только один раз — повторный вызов вернёт ошибку. */
export function registerNickname(playerId: string, nickname: string): { ok: boolean; error?: string } {
  const normalized = nickname.trim();
  const key = normalized.toLowerCase();
  if (normalized.length < 2 || normalized.length > 20) {
    return { ok: false, error: 'Nickname must be 2–20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(normalized)) {
    return { ok: false, error: 'Only letters, numbers and underscore' };
  }
  if (nicknameByPlayerId.has(playerId)) {
    return { ok: false, error: 'You already have a nickname and cannot change it' };
  }
  const takenBy = playerIdByNickname.get(key);
  if (takenBy && takenBy !== playerId) {
    return { ok: false, error: 'This nickname is already taken' };
  }
  nicknameByPlayerId.set(playerId, normalized);
  playerIdByNickname.set(key, playerId);
  return { ok: true };
}

export function getNicknameByPlayerId(playerId: string): string | null {
  return nicknameByPlayerId.get(playerId) ?? null;
}

/** Есть ли у playerId уже выбранный ник. */
export function hasNickname(playerId: string): boolean {
  return nicknameByPlayerId.has(playerId);
}
