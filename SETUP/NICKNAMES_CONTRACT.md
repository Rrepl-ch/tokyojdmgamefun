# Контракт TokyoJDMNicknames

## Описание
- 1 никнейм на кошелёк
- Никнеймы глобально уникальны (без учёта регистра)
- Нельзя передать другому (нет transfer)
- Бесплатный минт

## Деплой (Remix)

1. Открой https://remix.ethereum.org
2. Создай файл `TokyoJDMNicknames.sol` в `contracts/`
3. Скопируй код из `contracts/TokyoJDMNicknames.sol`
4. Compile → Deploy
5. **Конструктор пустой** — просто нажми Deploy
6. Скопируй адрес контракта

## Vercel

Добавь переменную:
- `NEXT_PUBLIC_NICKNAMES_CONTRACT` = адрес контракта

## Когда контракт НЕ задеплоен

Используется старая логика (SAVE через API). Когда задеплоишь — появится MINT NICKNAME.
