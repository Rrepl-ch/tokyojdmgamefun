import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts';
import { encodePacked, keccak256, toHex, type Hex } from 'viem';
import { getAndClearPendingBalance, isPendingTokensAvailable } from '@/app/lib/pendingTokensDb';

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(String(addr).trim());
}

/** POST { address } — get signature for full pending balance and clear it. Player then calls contract.claim(to, amount, nonce, v, r, s). */
export async function POST(request: NextRequest) {
  try {
    const signerKey = process.env.SCORE_REWARD_SIGNER_PRIVATE_KEY;
    if (!signerKey || !signerKey.startsWith('0x')) {
      return NextResponse.json({ error: 'Server not configured for score rewards' }, { status: 503 });
    }
    if (!isPendingTokensAvailable()) {
      return NextResponse.json({ error: 'Balance not available' }, { status: 503 });
    }
    const body = await request.json();
    const { address } = body;
    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }
    const addr = String(address).trim();
    if (!isValidAddress(addr)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }
    const amountStr = await getAndClearPendingBalance(addr);
    const amount = BigInt(amountStr);
    if (amount === BigInt(0)) {
      return NextResponse.json({ error: 'No balance to withdraw' }, { status: 400 });
    }
    const nonce = toHex(
      new Uint8Array(32).fill(0).map(() => Math.floor(Math.random() * 256))
    ) as Hex;
    const dataHash = keccak256(
      encodePacked(
        ['address', 'uint256', 'bytes32'],
        [addr as `0x${string}`, amount, nonce]
      )
    );
    const account = privateKeyToAccount(signerKey as `0x${string}`);
    const signature = await account.signMessage({
      message: { raw: dataHash as Hex },
    });
    const r = signature.slice(0, 66) as Hex;
    const s = (`0x${signature.slice(66, 130)}`) as Hex;
    const v = parseInt(signature.slice(130, 132), 16);
    return NextResponse.json({
      amount: amount.toString(),
      nonce,
      v,
      r,
      s,
    });
  } catch (e) {
    console.error('score-reward withdraw error', e);
    return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 });
  }
}
