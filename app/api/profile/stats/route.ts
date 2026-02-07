import { NextRequest, NextResponse } from 'next/server';
import {
  getProfileStatsRedis,
  mergeProfileStatsRedis,
  ensureBaseRecordedRedis,
  isProfileDbAvailable,
} from '@/app/lib/profileStatsDb';
// import { addPendingBalance, isPendingTokensAvailable } from '@/app/lib/pendingTokensDb';
// Реворды за заезд (начисление токенов при score >= 100k) — отключены

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(String(addr).trim());
}

/** GET ?address=0x... — отдать статистику по адресу (из БД). */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Invalid or missing address' }, { status: 400 });
  }
  if (!isProfileDbAvailable()) {
    return NextResponse.json({ stats: null });
  }
  const stats = await getProfileStatsRedis(address);
  return NextResponse.json({ stats });
}

/** POST { address, update? } — принять обновление после заезда. Один запрос = одна запись в БД. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, update, baseRecorded } = body as {
      address?: string;
      update?: { distance: number; carsPassed: number; carId: number; chainId?: number };
      baseRecorded?: boolean;
    };

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }
    const addr = String(address).trim();
    if (!isValidAddress(addr)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    if (baseRecorded === true) {
      await ensureBaseRecordedRedis(addr);
      return NextResponse.json({ success: true });
    }

    if (update && typeof update.distance === 'number' && typeof update.carsPassed === 'number' && typeof update.carId === 'number') {
      await mergeProfileStatsRedis(addr, {
        distance: update.distance,
        carsPassed: update.carsPassed,
        carId: update.carId,
        chainId: typeof update.chainId === 'number' ? update.chainId : undefined,
      });
      // Реворды за заезд отключены: начисление pending balance при score >= 100k
      // if (update.distance >= 100_000 && isPendingTokensAvailable()) {
      //   const amountWei = BigInt(Math.floor(update.distance / 120)) * BigInt(1e18);
      //   if (amountWei > BigInt(0)) await addPendingBalance(addr, amountWei);
      // }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing update or baseRecorded' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
