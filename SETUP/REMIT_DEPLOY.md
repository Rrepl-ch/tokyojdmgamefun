# Деплой контракта через Remix — подробно

## 1. Открой Remix

Перейди на https://remix.ethereum.org

## 2. Создай файл контракта

1. Слева в папке **contracts** нажми **+** (New File)
2. Название: `CrazyRacerCars.sol`
3. Открой файл `SETUP/contracts/CrazyRacerCars.sol` из этого проекта
4. Скопируй всё содержимое и вставь в Remix

## 3. Подключи OpenZeppelin (если Remix ругается на import)

Если при компиляции пишет "Source not found" для OpenZeppelin:

1. В Remix слева: **File Explorer** → правый клик на папку **contracts**
2. Выбери **Import from NPM** (или **Import** → **From NPM**)
3. Введи: `@openzeppelin/contracts`
4. Нажми OK
5. В папке появится `node_modules` с OpenZeppelin
6. Снова нажми **Compile**

## 4. Скомпилируй

1. Слева нажми **Solidity Compiler** (иконка с буквой S)
2. Версия: **0.8.20** или выше
3. Нажми **Compile CrazyRacerCars.sol**
4. Внизу должна быть зелёная галочка

## 5. Подключи MetaMask к Base

1. В MetaMask выбери сеть **Base Mainnet**
2. Если нет — добавь: Settings → Networks → Add Network
3. Данные для Base Mainnet: https://chainlist.org/chain/8453

## 6. Деплой

1. Слева нажми **Deploy & Run Transactions** (иконка с цилиндром)
2. **Environment:** выбери **Injected Provider - MetaMask**
3. Подключи MetaMask, если попросит
4. Убедись, что сеть — **Base Mainnet**
5. В разделе **Deploy** найди конструктор (оранжевая кнопка Deploy)
6. Заполни два поля:

   - **\_treasury** (address):  
     `0x218d863fd2acfea01042ca7b11a38ec06f78bb76`

   - **baseURI\_** (string):  
     `https://твой-проект.vercel.app/api/nft/`
     
     Замени `твой-проект.vercel.app` на реальный URL с Vercel.  
     В конце обязательно `/api/nft/`

7. Нажми **Deploy**
8. Подтверди транзакцию в MetaMask
9. Дождись выполнения (иконка галочки в Remix)

## 7. Скопируй адрес контракта

После деплоя под кнопкой Deploy появится контракт. Нажми на стрелку, чтобы развернуть.

Скопируй адрес контракта (начинается с `0x`).

Этот адрес нужно добавить в Vercel как `NEXT_PUBLIC_CRAZY_RACER_CONTRACT`.
