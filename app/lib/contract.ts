export const CRAZY_RACER_CARS_ADDRESS =
  (process.env.NEXT_PUBLIC_CRAZY_RACER_CONTRACT as `0x${string}`) || '0x0000000000000000000000000000000000000000';

export const NICKNAMES_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_NICKNAMES_CONTRACT as `0x${string}`) || '0x0000000000000000000000000000000000000000';

export const CHECK_IN_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT as `0x${string}`) || '0x0000000000000000000000000000000000000000';

export const BONUS_RACE_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_BONUS_RACE_CONTRACT as `0x${string}`) || '0x0000000000000000000000000000000000000000';

export const SCORE_REWARD_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_SCORE_REWARD_CONTRACT as `0x${string}`) || '0x0000000000000000000000000000000000000000';

export const NICKNAMES_ABI = [
  { inputs: [], name: 'AlreadyHasNickname', type: 'error' },
  { inputs: [], name: 'InvalidChars', type: 'error' },
  { inputs: [], name: 'InvalidLength', type: 'error' },
  { inputs: [], name: 'NicknameTaken', type: 'error' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'owner', type: 'address' }, { indexed: false, internalType: 'string', name: 'nickname', type: 'string' }], name: 'NicknameMinted', type: 'event' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'getNickname', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'hasNickname', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'string', name: 'nickname', type: 'string' }], name: 'isAvailable', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'string', name: 'nickname', type: 'string' }], name: 'mint', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'ownerToNickname', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], name: 'nicknameToOwner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
] as const;

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

export const CHECK_IN_ABI = [
  { inputs: [], name: 'AlreadyCheckedInToday', type: 'error' },
  { inputs: [], name: 'TokenTransferFailed', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'user', type: 'address' }], name: 'canCheckInToday', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'checkIn', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'user', type: 'address' }], name: 'getLastCheckInDay', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'user', type: 'address' }], name: 'getStreak', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'user', type: 'address' }], name: 'getTotalCheckIns', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'lastCheckInDay', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'rewardToken', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'streak', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'totalCheckIns', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
] as const;

export const BONUS_RACE_ABI = [
  { inputs: [], name: 'use', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const;

export const SCORE_REWARD_ABI = [
  { inputs: [], name: 'InvalidSignature', type: 'error' },
  { inputs: [], name: 'NonceUsed', type: 'error' },
  { inputs: [], name: 'TransferFailed', type: 'error' },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes32', name: 'nonce', type: 'bytes32' },
      { internalType: 'uint8', name: 'v', type: 'uint8' },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      { internalType: 'bytes32', name: 's', type: 'bytes32' },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
