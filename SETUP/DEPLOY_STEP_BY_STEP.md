# Деплой чек-ина и награды — по шагам

Делаем по порядку: сначала контракты, потом переменные в Vercel.

---

## Шаг 1. Установить Foundry (если ещё нет)

В терминале (PowerShell или cmd):

```powershell
# Windows (PowerShell)
irm get-foundry.deno.dev | iex
```

После установки закрой и открой терминал, проверь:

```powershell
forge --version
```

Должна показаться версия.

---

## Шаг 2. Подготовить кошелёк и RPC

1. **Кошелёк** — с него будет деплой (платишь газ) и по умолчанию с него же бэкенд будет подписывать клейм за 100k. Лучше отдельный кошелёк с небольшим балансом.
2. **Приватный ключ** этого кошелька — понадобится для деплоя и потом для Vercel (как `SCORE_REWARD_SIGNER_PRIVATE_KEY`).
3. **Сеть** — в `foundry.toml` уже есть:
   - Base mainnet: `https://mainnet.base.org`
   - Base Sepolia: `https://sepolia.base.org`

На Base mainnet нужны ETH на газ. Если деплоишь на Sepolia — переключи кошелёк на Base Sepolia и возьми тестнет ETH из фауцета.

---

## Шаг 3. Создать .env в папке contracts

В папке **contracts** создай файл **.env** (скопируй из `.env.example`):

```env
PRIVATE_KEY=0xтвой_приватный_ключ_64_символа
RPC_URL=https://mainnet.base.org
```

Для Base Sepolia:

```env
RPC_URL=https://sepolia.base.org
```

Файл **.env** в git не коммитить (он уже в .gitignore).

---

## Шаг 4. Собрать и задеплоить контракты

В терминале:

```powershell
cd C:\Users\DEVILMAN\jdm-tunnel-racer-main\contracts
forge build
```

Если сборка прошла без ошибок:

```powershell
forge script script/DeployCheckInAndBonus.s.sol --rpc-url $env:RPC_URL --broadcast
```

Если переменные из .env не подхватываются, задай явно:

```powershell
$env:PRIVATE_KEY="0xтвой_ключ"
$env:RPC_URL="https://mainnet.base.org"
forge script script/DeployCheckInAndBonus.s.sol --rpc-url $env:RPC_URL --broadcast
```

В конце в логе появятся три адреса, например:

```
CrazyRacerCheckIn 0x1111...
CrazyRacerBonusRace 0x2222...
CrazyRacerScoreReward 0x3333...
```

**Скопируй эти три адреса** — они понадобятся в Vercel.

---

## Шаг 5. Добавить переменные в Vercel

1. Зайди на [vercel.com](https://vercel.com) → свой проект → **Settings** → **Environment Variables**.
2. Добавь по одной переменной (для Production, можно и для Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_CHECK_IN_CONTRACT` | адрес **CrazyRacerCheckIn** (из лога деплоя) |
| `NEXT_PUBLIC_BONUS_RACE_CONTRACT` | адрес **CrazyRacerBonusRace** |
| `NEXT_PUBLIC_SCORE_REWARD_CONTRACT` | адрес **CrazyRacerScoreReward** |
| `SCORE_REWARD_SIGNER_PRIVATE_KEY` | тот же приватный ключ, что в `PRIVATE_KEY` при деплое (тот же кошелёк, что подписывает клейм) |

Важно: для `SCORE_REWARD_SIGNER_PRIVATE_KEY` используй тот же ключ, с которого деплоил (в скрипте по умолчанию signer = адрес от PRIVATE_KEY). Если при деплое задавал `SCORE_REWARD_SIGNER=0xдругой_адрес`, то в Vercel нужно положить приватный ключ **именно этого** адреса.

3. Сохрани переменные (**Save**).

---

## Шаг 6. Пересобрать и задеплоить проект на Vercel

В Vercel: вкладка **Deployments** → у последнего деплоя меню (три точки) → **Redeploy**.

Или сделай новый коммит и пуш — тогда деплой запустится сам.

После деплоя:
- в меню под кнопкой PLAY появится кнопка **Check-in** (если контракт задан и кошелёк подключён);
- каждый 5-й заезд будет требовать подпись перед стартом;
- после заезда с 100 000+ очков появится кнопка за клейм токенов.

---

## Шаг 7. Пополнить контракт чек-ина токенами (когда будешь готов)

Контракт **CrazyRacerCheckIn** при каждом 5-м чек-ине отправляет 150 токенов игроку. Эти токены должны лежать на самом контракте.

Нужно перевести токены (контракт `0xfdaaded27faba8ccb82154fb4641b13cca2d27f5`) на **адрес CrazyRacerCheckIn** (тот, что в `NEXT_PUBLIC_CHECK_IN_CONTRACT`). Сколько — считай по числу игроков и чек-инам (например, 150 × 10 000 = 1 500 000 токенов на 10k награждений).

---

## Краткий чеклист

- [ ] Установлен Foundry (`forge --version`)
- [ ] В `contracts/.env`: `PRIVATE_KEY`, `RPC_URL`
- [ ] Выполнен `forge script ... --broadcast`, скопированы 3 адреса
- [ ] В Vercel добавлены 4 переменные (3 контракта + `SCORE_REWARD_SIGNER_PRIVATE_KEY`)
- [ ] Сделан Redeploy в Vercel
- [ ] (Позже) Пополнен контракт CheckIn токенами

Если на каком-то шаге будет ошибка — пришли текст ошибки и на каком шаге остановился, разберём точечно.
