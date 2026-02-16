// Добавляй новые машины в массив CARS.
// У каждой машины две связанные картинки (одна машина = один id):
//   sprite     — в ИГРЕ при езде (вид сверху), например car1-game.png
//   spriteMenu — в МЕНЮ выбора машин (крупный кадр), например car1-menu.png
// Если spriteMenu пустой, в меню показывается sprite или болванка.

export type CarDef = {
  id: number;
  name: string;
  sprite: string;
  spriteMenu: string;
  free: boolean;
  scoreMultiplier: number;
  /** Цена в ETH для платных машин (например '0.0002') */
  priceEth: string;
  placeholderColor: string;
  buffs: string[];
};

function makeCar(
  id: number,
  name: string,
  sprite: string,
  spriteMenu: string,
  free: boolean,
  scoreMultiplier: number,
  priceEth: string,
  placeholderColor: string,
  buffs: string[]
): CarDef {
  return { id, name, sprite, spriteMenu, free, scoreMultiplier, priceEth, placeholderColor, buffs };
}

// Для каждой машины: sprite — в игре, spriteMenu — в меню (разные картинки, связаны по id).
// Имена файлов: car1-game.png / car1-menu.png, car2-game.png / car2-menu.png и т.д.
export const CARS: CarDef[] = [
  makeCar(0, 'ciric', '/cars/car1-game.png', '/cars/car1-menu.png', true, 1, '0', '#00a8ff', ['Score ×1']),
  makeCar(1, 'liner', '/cars/car2-game.png', '/cars/car2-menu.png', true, 1, '0', '#00cc88', ['Score ×1']),
  makeCar(2, 'cilnia', '/cars/car3-game.png', '/cars/car3-menu.png', true, 1, '0', '#ff6688', ['Score ×1']),
  makeCar(3, 'xx7', '/cars/car4-game.png', '/cars/car4-menu.png', false, 1.5, '0.00015', '#ffaa00', ['Score ×1.5']),
  makeCar(4, 'pupra', '/cars/car5-game.png', '/cars/car5-menu.png', false, 2, '0.0002', '#aa66ff', ['Score ×2']),
  makeCar(5, 'ltr', '/cars/car6-game.png', '/cars/car6-menu.png', false, 3, '0.00025', '#00ffcc', ['Score ×3']),
];

export function getCarById(id: number): CarDef | undefined {
  return CARS.find((c) => c.id === id);
}
