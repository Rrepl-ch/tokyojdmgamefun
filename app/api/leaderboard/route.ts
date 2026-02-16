import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, addLeaderboardEntry, getBestScoreByAddress } from '@/app/lib/store';
import {
  isRedisAvailable,
  getLeaderboardRedis,
  addLeaderboardEntryRedis,
  getBestScoreByAddressRedis,
} from '@/app/lib/leaderboard';

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(String(addr).trim());
}

/** Max score per second (generous: distance + cars, x3 multiplier). Used to reject impossible scores. */
const MAX_SCORE_PER_SECOND = 5500;
/** Max allowed score per single submission regardless of duration (anti-cheat cap). */
const MAX_SCORE_ABSOLUTE = 5_000_000;
/** Min game duration to accept (ms). Shorter = rejected (prevents 0ms fake submissions). */
const MIN_DURATION_MS = 1000;

function isScorePlausible(score: number, durationMs: number): boolean {
  if (score <= 0 || durationMs < MIN_DURATION_MS) return false;
  const durationSec = durationMs / 1000;
  const maxForDuration = durationSec * MAX_SCORE_PER_SECOND;
  if (score > maxForDuration) return false;
  if (score > MAX_SCORE_ABSOLUTE) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (address) {
    const best = isRedisAvailable()
      ? await getBestScoreByAddressRedis(address)
      : getBestScoreByAddress(address);
    return NextResponse.json({ best });
  }
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 100);
  const entries = isRedisAvailable() ? await getLeaderboardRedis(limit) : getLeaderboard(limit);
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, score, address, carId, avatar, durationMs } = body;
    if (typeof nickname !== 'string' || typeof score !== 'number' || !address) {
      return NextResponse.json(
        { error: 'Missing or invalid nickname, score, or address' },
        { status: 400 }
      );
    }
    const floorScore = Math.floor(score);
    const duration = typeof durationMs === 'number' ? durationMs : 0;
    if (!isScorePlausible(floorScore, duration)) {
      return NextResponse.json(
        { error: 'Score rejected: invalid or impossible for reported game duration' },
        { status: 400 }
      );
    }
    const addr = String(address).trim();
    if (!isValidAddress(addr)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    const entry = {
      nickname: nickname.trim(),
      score: floorScore,
      address: addr,
      carId: typeof carId === 'number' ? carId : 0,
      avatar: typeof avatar === 'string' ? avatar : '',
    };
    if (isRedisAvailable()) {
      await addLeaderboardEntryRedis(entry);
    } else {
      addLeaderboardEntry({ ...entry, address: addr.toLowerCase() });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
