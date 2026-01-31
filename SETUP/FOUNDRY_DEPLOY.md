# Деплой контракта через Foundry (альтернатива Remix)

Если знаком с командной строкой.

## 1. Установи Foundry

https://book.getfoundry.sh/getting-started/installation

Windows (PowerShell):
```powershell
irm getfoundry.sh | iex
```

## 2. Установи OpenZeppelin

```bash
cd C:\Users\DEVILMAN\jdm-tunnel-racer-main\contracts
forge install OpenZeppelin/openzeppelin-contracts
```

## 3. Проверь сборку

```bash
forge build
```

## 4. Деплой

Создай файл `.env` в папке `contracts`:
```
PRIVATE_KEY=твой_приватный_ключ
```

Внимание: никому не показывай приватный ключ. Файл `.env` не должен попадать в git.

Деплой на Base Mainnet:

```bash
forge script script/Deploy.s.sol --rpc-url https://mainnet.base.org --broadcast --verify
```

Или без верификации:
```bash
forge script script/Deploy.s.sol --rpc-url https://mainnet.base.org --broadcast
```

Скрипт использует:
- Treasury: 0x218d863fd2acfea01042ca7b11a38ec06f78bb76
- Base URI: https://crazyracer.app/api/nft/

Чтобы изменить base URI, отредактируй `script/Deploy.s.sol`.
