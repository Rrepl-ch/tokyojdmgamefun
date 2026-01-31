'use client';

import { CARS } from '@/app/types/cars';

type CarSelectProps = {
  browsedCarId: number;
  selectedCarId: number;
  ownedCarIds: Set<number>;
  onSelect: (carId: number) => void;
  onMintFree: (carId: number) => void;
  onMintPaid: (carId: number) => void;
  onPrevCar: () => void;
  onNextCar: () => void;
  mintingCarId: number | null;
};

export function CarSelect({
  browsedCarId,
  selectedCarId,
  ownedCarIds,
  onSelect,
  onMintFree,
  onMintPaid,
  onPrevCar,
  onNextCar,
  mintingCarId,
}: CarSelectProps) {
  const car = CARS[browsedCarId];
  if (!car) return null;

  const owned = ownedCarIds.has(car.id);
  const isSelected = selectedCarId === car.id;
  const isMinting = mintingCarId === car.id;
  const menuImg = car.spriteMenu || car.sprite;
  const canPrev = browsedCarId > 0;
  const canNext = browsedCarId < CARS.length - 1;

  return (
    <div className="car-select-wrap">
      <div className="car-select-center">
        <button
          type="button"
          className="car-select-arrow car-select-arrow-left car-select-arrow-overlay"
          onClick={onPrevCar}
          disabled={!canPrev}
          aria-label="Previous car"
        >
          ‹
        </button>
        <div
          className={`car-select-card car-select-card-selected ${!owned ? 'car-select-card-locked' : ''}`}
          data-car-id={car.id}
        >
          <div className="car-select-card-image-wrap" style={{ backgroundColor: car.placeholderColor }}>
            {menuImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={menuImg} alt={car.name} className="car-select-card-image" />
            ) : (
              <div className="car-select-card-placeholder" style={{ backgroundColor: car.placeholderColor }} />
            )}
          </div>
          <div className="car-select-card-name">{car.name}</div>
          <div className="car-select-card-buffs">
            {car.buffs.map((b, i) => (
              <span key={i} className="car-select-buff">{b}</span>
            ))}
          </div>
          {owned ? (
            <button
              type="button"
              className={`menu-btn small car-select-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(car.id)}
            >
              {isSelected ? 'SELECTED' : 'SELECT'}
            </button>
          ) : car.free ? (
            <button
              type="button"
              className="menu-btn small mint-free car-select-btn"
              disabled={!!mintingCarId}
              onClick={() => onMintFree(car.id)}
            >
              {isMinting ? 'MINTING…' : 'MINT FREE'}
            </button>
          ) : (
            <button
              type="button"
              className="menu-btn small mint-paid car-select-btn"
              disabled={!!mintingCarId}
              onClick={() => onMintPaid(car.id)}
            >
              {isMinting ? 'MINTING…' : `${car.priceEth} ETH`}
            </button>
          )}
        </div>
        <button
          type="button"
          className="car-select-arrow car-select-arrow-right car-select-arrow-overlay"
          onClick={onNextCar}
          disabled={!canNext}
          aria-label="Next car"
        >
          ›
        </button>
      </div>
    </div>
  );
}
