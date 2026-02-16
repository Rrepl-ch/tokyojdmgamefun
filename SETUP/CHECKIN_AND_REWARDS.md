# Check-in, bonus race and score rewards

## Контракты

- **CrazyRacerCheckIn** — ежедневный чек-ин (1 раз в сутки по UTC). Каждый 5-й день (5, 10, 15…) начисляет 150 токенов с контракта `0xfdaaded27faba8ccb82154fb4641b13cca2d27f5` на кошелёк игрока. Контракт чек-ина должен иметь баланс этих токенов (пополнение с treasury).
- **CrazyRacerBonusRace** — одна функция `use()`: только списание газа (для «каждого 5-го заезда»). Счётчик заездов только в игре.
- **CrazyRacerScoreReward** — выдаёт токены по подписи бэкенда. Баланс накапливается в БД (Redis): после каждого заезда с score ≥ 100 000 к балансу адреса добавляется `score/120` токенов. В меню отображаются «Tokens: X» и кнопка «Withdraw». По нажатию бэкенд подписывает полный баланс и возвращает подпись; игрок вызывает `claim(to, amount, nonce, v, r, s)` и платит газ. Баланс в БД обнуляется после выдачи подписи.

## Деплой

```bash
cd contracts
# REWARD_TOKEN уже задан в скрипте (0xfdaa...). Для ScoreReward нужен signer (приватный ключ бэкенда).
export SCORE_REWARD_SIGNER=0x...   # адрес, соответствующий SCORE_REWARD_SIGNER_PRIVATE_KEY
forge script script/DeployCheckInAndBonus.s.sol --rpc-url <RPC> --broadcast
```

После деплоя добавь в `.env.local`:

```
NEXT_PUBLIC_CHECK_IN_CONTRACT=0x...
NEXT_PUBLIC_BONUS_RACE_CONTRACT=0x...
NEXT_PUBLIC_SCORE_REWARD_CONTRACT=0x...
SCORE_REWARD_SIGNER_PRIVATE_KEY=0x...   # только на сервере, для подписи при выводе (POST /api/score-reward/withdraw)
```

## Пополнение CheckIn токенами

Контракт CrazyRacerCheckIn вызывает `IERC20(rewardToken).transfer(user, 150e18)` каждый 5-й чек-ин. Нужно перевести на адрес контракта CheckIn достаточное количество токенов (например, с treasury).

## Множители в игре

- **Чек-ин:** 10 дней подряд → 1.25× к очкам, 25 дней подряд → 1.5×. Учитывается при старте заезда.
- **Каждый 5-й заезд:** после 4 заездов игрок в меню нажимает Play → подпись транзакции BonusRace → в том же окне вторая кнопка Play → заезд с 2.5× к очкам. В интерфейсе множитель и счётчик заездов не показываются.

## Токены за 100k+ очков (накопление и вывод)

- После каждого заезда с score ≥ 100 000 бэкенд при обновлении профиля добавляет к балансу игрока `floor(score/120)` токенов (в Redis).
- В меню отображаются «Tokens: X» и кнопка «Withdraw».
- По нажатию «Withdraw»: фронт шлёт `POST /api/score-reward/withdraw` с `{ address }`, бэкенд возвращает подпись на полный баланс и обнуляет его в БД. Фронт вызывает `ScoreReward.claim(to, amount, nonce, v, r, s)`. Газ платит игрок.
- Контракт: `claim(to, amount, nonce, v, r, s)` — без поля score; подпись строится по `(to, amount, nonce)`.
