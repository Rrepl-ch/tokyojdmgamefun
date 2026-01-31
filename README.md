# JDM Tunnel Racer — Mini App for Base

Туннельная гонка видом сверху в стиле JDM / неон / Япония нулевых. Mini App для [Base](https://docs.base.org/get-started/base) (Coinbase L2).

## Геймплей

- **6 полос**: 3 попутные, 3 встречные, левостороннее движение.
- Объезжайте машины и **препятствия** (конусы) на дороге.
- Управление: мышь или тач — движение по горизонтали.
- Счёт растёт за обгон попутных машин; платные машины дают множитель к счёту.

## Главное меню

- **Никнейм** — уникальный (один ник на весь мир). Сохраняется через кошелёк (Connect wallet).
- **Выбор машины**:
  - **3 бесплатные** (S13, AE86, EK9) — кнопка «MINT FREE» (мint NFT).
  - **3 платные** (R32, FD, SUPRA) — по **0.00015 ETH** каждая (mint NFT), дают буст счёта (+50%, +100%, +150%).
- **Таблица лидеров** — лучшие гонщики по счёту.

## Запуск

```bash
cd jdm-tunnel-racer-main
npm install
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Сборка

```bash
npm run build
npm start
```

## Структура

- `app/page.tsx` — экран меню + игра (туннель, 6 полос, машины, препятствия, счёт).
- `app/components/MainMenu.tsx` — главное меню (ник, выбор машины, кнопки Play / Leaderboard).
- `app/components/CarSelect.tsx` — выбор из 6 машин (free/paid mint).
- `app/components/Leaderboard.tsx` — таблица лидеров.
- `app/api/leaderboard` — GET/POST счёт.
- `app/api/nickname/check` — проверка доступности ника.
- `app/api/nickname/register` — регистрация ника (привязан к адресу кошелька).
- `app/types/cars.ts` — константы машин и цена 0.00015 ETH.
- `app/lib/store.ts` — in-memory хранилище лидерборда и ников (для продакшена заменить на БД).

## Модели машин (ассеты)

Сейчас используются спрайты из `public/cars/`:

- **Бесплатные**: `player.png`, `same1.png`, `same2.png` (S13, AE86, EK9).
- **Платные**: `opp1.png`, `opp2.png`, `player.png` (R32, FD, SUPRA).

Можно заменить на свои PNG (вид сверху, JDM-стиль). Дорога и туннель — `public/road/` (или `public/road,/` — проверь имя папки, если картинки не грузятся).

## Mint NFT (Base)

- **Бесплатный mint** — в коде эмулируется задержкой; для продакшена подключи контракт Base (например ERC-721) и вызов `mintFree(carId)`.
- **Платный mint** (0.00015 ETH) — подключи `mintPaid(carId)` с оплатой и проверкой суммы.

Контракт и ABI можно добавить в `contracts/` и вызвать через wagmi (уже есть Base + Farcaster Mini App в `app/providers.tsx`).

## Публикация как Mini App

См. [Base Mini Apps](https://docs.base.org/get-started/base) и `farcaster.config.ts`: имя приложения — **JDM Tunnel Racer**, описание и теги уже заданы.

---

## Disclaimer

This is a **demo** for educational purposes. There is no official token or product associated with this app. For official Base resources: [base.org](https://base.org), [docs.base.org](https://docs.base.org).
