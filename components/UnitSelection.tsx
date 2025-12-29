
import React from 'react';
import { Unit } from '../types';

interface Props {
  units: Unit[];
  onSelect: (unit: Unit) => void;
}

export const UnitSelection: React.FC<Props> = ({ units, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
      {units.map((unit) => (
        <button
          key={unit.id}
          onClick={() => onSelect(unit)}
          className={`${unit.color} p-6 rounded-3xl text-white text-left transition-transform hover:scale-105 active:scale-95 shadow-xl border-b-8 border-black/20`}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="bg-white/30 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Unit {unit.id}</span>
            <i className="fas fa-star text-yellow-300"></i>
          </div>
          <h3 className="text-2xl font-bold mb-2">{unit.title}</h3>
          <p className="text-white/90 text-sm line-clamp-2">
            {unit.vocabulary.slice(0, 5).join(", ")}...
          </p>
        </button>
      ))}
    </div>
  );
};
