// In-memory store for leaderboard and nicknames.
// For production replace with DB (e.g. Vercel KV, Postgres).

export type LeaderboardEntry = {
  nickname: string;
  score: number;
  address: string;
  carId: number;
  timestamp: number;
  avatar?: string;
};

// Один рекорд на адрес (лучший счёт)
const leaderboardByAddress = new Map<string, LeaderboardEntry>();
const nicknameToAddress = new Map<string, string>();
const addressToNickname = new Map<string, string>();

const MAX_LEADERBOARD = 100;

export function getLeaderboard(limit = MAX_LEADERBOARD): LeaderboardEntry[] {
  return [...leaderboardByAddress.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'timestamp'> & { avatar?: string }): void {
  const key = entry.address.toLowerCase();
  const existing = leaderboardByAddress.get(key);
  const newScore = Math.floor(entry.score);
  const avatar = entry.avatar ?? existing?.avatar ?? '';
  if (!existing || newScore > existing.score) {
    leaderboardByAddress.set(key, {
      nickname: entry.nickname,
      score: newScore,
      address: entry.address,
      carId: entry.carId,
      timestamp: Date.now(),
      avatar,
    });
  } else if (existing && (entry as { avatar?: string }).avatar !== undefined) {
    (existing as LeaderboardEntry).avatar = (entry as { avatar?: string }).avatar ?? '';
  }
}

export function getBestScoreByAddress(address: string): number {
  const entry = leaderboardByAddress.get(address.toLowerCase());
  return entry ? entry.score : 0;
}

export function isNicknameAvailable(nickname: string): boolean {
  const normalized = nickname.trim().toLowerCase();
  if (!normalized || normalized.length < 2) return false;
  return !nicknameToAddress.has(normalized);
}

export function registerNickname(nickname: string, address: string): { ok: boolean; error?: string } {
  const normalized = nickname.trim();
  const key = normalized.toLowerCase();
  if (normalized.length < 2 || normalized.length > 20) {
    return { ok: false, error: 'Nickname must be 2–20 characters' };
  }
  if (nicknameToAddress.has(key)) {
    return { ok: false, error: 'This nickname is already taken' };
  }
  const existing = addressToNickname.get(address.toLowerCase());
  if (existing) {
    nicknameToAddress.delete(existing.toLowerCase());
  }
  nicknameToAddress.set(key, address.toLowerCase());
  addressToNickname.set(address.toLowerCase(), normalized);
  return { ok: true };
}

export function getNicknameByAddress(address: string): string | null {
  return addressToNickname.get(address.toLowerCase()) ?? null;
}
