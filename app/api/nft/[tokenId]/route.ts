import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { CRAZY_RACER_CARS_ADDRESS, CRAZY_RACER_CARS_ABI } from '@/app/lib/contract';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://crazyracer.app';

const CAR_METADATA: Record<
  number,
  { name: string; description: string; image: string; attributes: { trait_type: string; value: string }[] }
> = {
  0: {
    name: 'ciric',
    description: 'A reliable starter ride. Perfect for learning the tracks and building your racing foundation.',
    image: `${BASE_URL}/cars/car1-menu.png`,
    attributes: [
      { trait_type: 'Score Multiplier', value: '×1' },
      { trait_type: 'Rarity', value: 'Common' },
    ],
  },
  1: {
    name: 'liner',
    description: 'Sleek and steady. A classic choice for those who value consistency on the road.',
    image: `${BASE_URL}/cars/car2-menu.png`,
    attributes: [
      { trait_type: 'Score Multiplier', value: '×1' },
      { trait_type: 'Rarity', value: 'Common' },
    ],
  },
  2: {
    name: 'cilnia',
    description: 'Bold design meets dependable performance. Stand out while you race.',
    image: `${BASE_URL}/cars/car3-menu.png`,
    attributes: [
      { trait_type: 'Score Multiplier', value: '×1' },
      { trait_type: 'Rarity', value: 'Common' },
    ],
  },
  3: {
    name: 'xx7',
    description: 'Built for speed. The xx7 delivers raw power and agility for serious competitors.',
    image: `${BASE_URL}/cars/car4-menu.png`,
    attributes: [
      { trait_type: 'Score Multiplier', value: '×1.5' },
      { trait_type: 'Rarity', value: 'Rare' },
    ],
  },
  4: {
    name: 'pupra',
    description: 'Elite engineering. The pupra transforms the track into your personal playground.',
    image: `${BASE_URL}/cars/car5-menu.png`,
    attributes: [
      { trait_type: 'Score Multiplier', value: '×2' },
      { trait_type: 'Rarity', value: 'Epic' },
    ],
  },
  5: {
    name: 'ltr',
    description: 'The ultimate machine. Unmatched power, prestige, and dominance. For legends only.',
    image: `${BASE_URL}/cars/car6-menu.png`,
    attributes: [
      { trait_type: 'Score Multiplier', value: '×3' },
      { trait_type: 'Rarity', value: 'Legendary' },
    ],
  },
};

export async function GET(_req: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  const id = parseInt(tokenId, 10);
  if (isNaN(id) || id < 0) {
    return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
  }

  if (CRAZY_RACER_CARS_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return NextResponse.json(
      { name: 'Unknown', description: 'Contract not deployed', image: '', attributes: [] },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  }

  try {
    const client = createPublicClient({
      chain: base,
      transport: http(),
    });

    const carType = (await client.readContract({
      address: CRAZY_RACER_CARS_ADDRESS,
      abi: CRAZY_RACER_CARS_ABI,
      functionName: 'tokenIdToCarType',
      args: [BigInt(id)],
    })) as number;

    const meta = CAR_METADATA[carType] ?? CAR_METADATA[0];

    return NextResponse.json(
      {
        name: meta.name,
        description: meta.description,
        image: meta.image,
        attributes: meta.attributes,
      },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  } catch {
    return NextResponse.json(
      { name: 'Unknown', description: 'Token not found', image: '', attributes: [] },
      { status: 404 }
    );
  }
}
