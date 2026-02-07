# Crazy Racer — Деплой и верификация

## 1. Coinbase Developer (base:app_id)

Мета-тег уже добавлен в `layout.tsx`:
```html
<meta name="base:app_id" content="697dfefe2aafa0bc9ad8a2a2" />
```

После деплоя на Vercel:
1. Зайди на [coinbase.dev](https://www.coinbase.com/developer)
2. Открой настройки приложения
3. В поле App URL введи: `https://crazyracer.app` (или `https://твой-проект.vercel.app`)
4. Нажми **Verify & Add**

## 2. Переменные окружения (.env.local)

Создай `.env.local`:

```
NEXT_PUBLIC_URL=https://crazyracer.app
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=d573c8a861fbe6e691c284093d3d3b53
NEXT_PUBLIC_CRAZY_RACER_CONTRACT=0x...
```

`NEXT_PUBLIC_CRAZY_RACER_CONTRACT` — адрес контракта после деплоя (см. ниже).

В Vercel: Settings → Environment Variables — добавь те же переменные.

## 3. Деплой NFT-контракта на Base

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge build
```

Деплой через Remix или Foundry:
- Treasury: `0x218d863fd2acfea01042ca7b11a38ec06f78bb76`
- Base URI: `https://crazyracer.app/api/nft/`

Подробности: `contracts/README.md`

## 4. Vercel + домен crazyracer.app

1. Подключи репо к GitHub
2. Импортируй проект в Vercel
3. Добавь домен crazyracer.app в Vercel (Settings → Domains)
4. Укажи DNS записи у регистратора домена

## 5. Подключение кошельков

- **Connect with Coinbase** — Coinbase Wallet (SDK + Smart Wallet)
- **Other Wallets** — WalletConnect, MetaMask, и др.

Проект настроен для Base chain.
