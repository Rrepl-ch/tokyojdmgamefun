# Crazy Racer Cars NFT Contract

Soulbound ERC-721: 1 NFT per car type per wallet, non-transferable.

## Deploy

1. Install Foundry: https://book.getfoundry.sh/getting-started/installation

2. Install OpenZeppelin:
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

3. Deploy to Base:
```bash
forge script script/Deploy.s.sol --rpc-url https://mainnet.base.org --broadcast --private-key YOUR_KEY
```

Or use Remix: compile `CrazyRacerCars.sol`, deploy with:
- `_treasury`: 0x218d863fd2acfea01042ca7b11a38ec06f78bb76
- `baseURI_`: https://crazyracer.app/api/nft/

4. Add contract address to `.env`:
```
NEXT_PUBLIC_CRAZY_RACER_CONTRACT=0x...
```

## Car types & prices

| ID | Name   | Price      |
|----|--------|------------|
| 0  | ciric  | Free       |
| 1  | liner  | Free       |
| 2  | cilnia | Free       |
| 3  | xx7    | 0.00015 ETH|
| 4  | pupra  | 0.0002 ETH |
| 5  | ltr    | 0.00025 ETH|
