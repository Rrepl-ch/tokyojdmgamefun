# Деплой контрактов через сайт (Remix)

Всё делается в браузере: без Foundry, только Remix + кошелёк (MetaMask и т.п.).

---

## 1. Подготовка кошелька

- В MetaMask (или другом кошельке) добавь сеть **Base**:
  - Network name: **Base**
  - RPC: `https://mainnet.base.org`
  - Chain ID: **8453**
  - Currency: ETH
- Убедись, что на Base есть немного ETH на газ.
- Запомни свой **адрес кошелька** (0x…) — он будет **signer** для клейма за 100k.

---

## 2. Открыть Remix

Перейди на: **https://remix.ethereum.org**

---

## 3. Создать файлы с контрактами

В левой панели Remix (File Explorer):

1. Нажми **Create new file** (иконка с листом).
2. Имя: `CrazyRacerCheckIn.sol` → Enter.
3. Вставь в файл код контракта **CrazyRacerCheckIn** (скопируй из папки `contracts/CrazyRacerCheckIn.sol` в твоём проекте, или из блока ниже).

Повтори для двух других файлов:

4. **Create new file** → `CrazyRacerBonusRace.sol` → вставь код из `contracts/CrazyRacerBonusRace.sol`.
5. **Create new file** → `CrazyRacerScoreReward.sol` → вставь код из `contracts/CrazyRacerScoreReward.sol`.

(Код контрактов лежит в твоей папке `jdm-tunnel-racer-main/contracts/` — открой эти три файла и скопируй содержимое целиком.)

---

## 4. Компиляция

1. Слева нажми иконку **Solidity compiler** (вторая сверху).
2. **Compiler** выбери версию **0.8.20** (или 0.8.21).
3. Нажми **Compile CrazyRacerCheckIn.sol** (или Compile все, если есть кнопка Compile All).
4. Должно быть без красных ошибок. Если компилируешь по одному — скомпилируй все три контракта по очереди (выбирая файл и нажимая Compile).

---

## 5. Подключить кошелёк и сеть Base

1. Слева нажми **Deploy & run transactions** (иконка с коробкой/эфиром).
2. В блоке **Environment** выбери **Injected Provider - MetaMask** (или другой кошелёк).
3. В MetaMask выбери сеть **Base**.
4. В Remix в поле **Account** должен появиться твой адрес, ниже — баланс (ETH на Base).

---

## 6. Деплой контрактов по очереди

Адрес токена наград (один и тот же для всех):  
`0xfdaaded27faba8ccb82154fb4641b13cca2d27f5`

### 6.1. CrazyRacerCheckIn

1. В выпадающем списке **Contract** выбери **CrazyRacerCheckIn**.
2. В поле **CONSTRUCTOR** вставь один аргумент:
   ```text
   0xfdaaded27faba8ccb82154fb4641b13cca2d27f5
   ```
3. Нажми **Deploy**. Подтверди транзакцию в кошельке.
4. После успеха внизу в разделе **Deployed Contracts** появится контракт. Рядом будет адрес (0x…). **Скопируй этот адрес** — это твой **NEXT_PUBLIC_CHECK_IN_CONTRACT**.

### 6.2. CrazyRacerBonusRace

1. В **Contract** выбери **CrazyRacerBonusRace**.
2. Конструктор пустой — ничего не вводи.
3. Нажми **Deploy** → подтверди в кошельке.
4. **Скопируй адрес** задеплоенного контракта — это **NEXT_PUBLIC_BONUS_RACE_CONTRACT**.

### 6.3. CrazyRacerScoreReward

1. В **Contract** выбери **CrazyRacerScoreReward**.
2. В **CONSTRUCTOR** два аргумента (через запятую в двух полях или в одном поле через запятую, в зависимости от интерфейса Remix):
   - **rewardToken:** `0xfdaaded27faba8ccb82154fb4641b13cca2d27f5`
   - **signer:** твой адрес кошелька (тот, что в Account в Remix), например `0x1234...abcd`
3. Нажми **Deploy** → подтверди.
4. **Скопируй адрес** — это **NEXT_PUBLIC_SCORE_REWARD_CONTRACT**.

---

## 7. Что записать

Запиши три адреса:

| Переменная для Vercel | Откуда взять |
|------------------------|--------------|
| `NEXT_PUBLIC_CHECK_IN_CONTRACT` | адрес из п. 6.1 |
| `NEXT_PUBLIC_BONUS_RACE_CONTRACT` | адрес из п. 6.2 |
| `NEXT_PUBLIC_SCORE_REWARD_CONTRACT` | адрес из п. 6.3 |

И одну секретную переменную:

| Переменная | Значение |
|------------|----------|
| `SCORE_REWARD_SIGNER_PRIVATE_KEY` | Приватный ключ **того же кошелька**, адрес которого ты указал как **signer** в п. 6.3 (из MetaMask: настройки → безопасность → экспорт приватного ключа). |

---

## 8. Добавить переменные в Vercel

1. Зайди в проект на **vercel.com** → **Settings** → **Environment Variables**.
2. Добавь четыре переменные (Production и/или Preview):
   - `NEXT_PUBLIC_CHECK_IN_CONTRACT` = адрес из 6.1  
   - `NEXT_PUBLIC_BONUS_RACE_CONTRACT` = адрес из 6.2  
   - `NEXT_PUBLIC_SCORE_REWARD_CONTRACT` = адрес из 6.3  
   - `SCORE_REWARD_SIGNER_PRIVATE_KEY` = приватный ключ кошелька (тот же, что signer).
3. Сохрани (**Save**).

---

## 9. Пересобрать проект

В Vercel: **Deployments** → у последнего деплоя три точки → **Redeploy**.

После этого деплой через сайт (Remix) и настройка Vercel завершены.

---

## Кратко

1. Remix: создать 3 файла, вставить код из `contracts/*.sol`.
2. Compiler 0.8.20 → Compile.
3. Deploy & run → Injected Provider, сеть Base.
4. Деплой по очереди: CheckIn (1 аргумент — адрес токена), BonusRace (без аргументов), ScoreReward (адрес токена + твой адрес как signer).
5. Скопировать 3 адреса и добавить их + `SCORE_REWARD_SIGNER_PRIVATE_KEY` в Vercel.
6. Redeploy в Vercel.

Если на каком-то шаге что-то не получается — напиши, на каком именно (например: «шаг 6.1, Remix не даёт вставить адрес»), разберём по шагам.
