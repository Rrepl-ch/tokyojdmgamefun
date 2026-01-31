export const CRAZY_RACER_CARS_ADDRESS =
  (process.env.NEXT_PUBLIC_CRAZY_RACER_CONTRACT as `0x${string}`) || '0x0000000000000000000000000000000000000000';

export const CRAZY_RACER_CARS_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_treasury', type: 'address' },
      { internalType: 'string', name: 'baseURI_', type: 'string' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'AlreadyMinted',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InsufficientPayment',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidCarType',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TransferNotAllowed',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint8', name: 'carType', type: 'uint8' },
    ],
    name: 'Minted',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint8', name: 'carType', type: 'uint8' },
    ],
    name: 'balanceOfCarType',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint8', name: 'carType', type: 'uint8' },
    ],
    name: 'ownsCarType',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint8', name: 'carType', type: 'uint8' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'tokenIdToCarType',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'prices',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
