import { NextRequest, NextResponse } from 'next/server';
import { getPendingBalance, isPendingTokensAvailable } from '@/app/lib/pendingTokensDb';

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(String(addr).trim());
}

/** GET ?address=0x... — pending token balance in wei (string). */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: 'Invalid or missing address' }, { status: 400 });
  }
  if (!isPendingTokensAvailable()) {
    return NextResponse.json({ balance: '0' });
  }
  const balance = await getPendingBalance(address.trim());
  return NextResponse.json({ balance });
}
