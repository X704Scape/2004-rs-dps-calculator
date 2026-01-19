import React from 'react';

const COMBAT_SPELLS = [
  { id: 'wind_strike', name: 'Wind Strike', maxHit: 2, level: 1 },
  { id: 'water_strike', name: 'Water Strike', maxHit: 4, level: 5 },
  { id: 'earth_strike', name: 'Earth Strike', maxHit: 6, level: 9 },
  { id: 'fire_strike', name: 'Fire Strike', maxHit: 8, level: 13 },
  { id: 'wind_bolt', name: 'Wind Bolt', maxHit: 9, level: 17 },
  { id: 'water_bolt', name: 'Water Bolt', maxHit: 10, level: 23 },
  { id: 'earth_bolt', name: 'Earth Bolt', maxHit: 11, level: 29 },
  { id: 'fire_bolt', name: 'Fire Bolt', maxHit: 12, level: 35 },
  { id: 'wind_blast', name: 'Wind Blast', maxHit: 13, level: 41 },
  { id: 'water_blast', name: 'Water Blast', maxHit: 14, level: 47 },
  { id: 'earth_blast', name: 'Earth Blast', maxHit: 15, level: 53 },
  { id: 'fire_blast', name: 'Fire Blast', maxHit: 16, level: 59 },
  { id: 'wind_wave', name: 'Wind Wave', maxHit: 17, level: 62 },
  { id: 'water_wave', name: 'Water Wave', maxHit: 18, level: 65 },
  { id: 'earth_wave', name: 'Earth Wave', maxHit: 19, level: 70 },
  { id: 'fire_wave', name: 'Fire Wave', maxHit: 20, level: 75 }
];

export default function MagicSpellbookTab({ selectedSpell, onSpellChange, playerStats }) {
  const handleSpellSelect = (spell) => {
    onSpellChange(spell);
  };

  return (
    <div>
      <h3 className="text-amber-600 font-bold text-sm mb-3">Combat Spells</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {COMBAT_SPELLS.map((spell) => {
          const canCast = playerStats.magic >= spell.level;
          return (
            <button
              key={spell.id}
              onClick={() => canCast && handleSpellSelect(spell)}
              disabled={!canCast}
              className={`w-full text-left p-3 rounded border-2 transition ${
                selectedSpell?.id === spell.id
                  ? 'bg-amber-900 border-amber-700'
                  : canCast
                  ? 'bg-gray-900 border-gray-700 hover:border-amber-900'
                  : 'bg-gray-950 border-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-amber-100 font-semibold text-sm">{spell.name}</p>
                  <p className="text-amber-700 text-xs">Max Hit: {spell.maxHit}</p>
                </div>
                <p className="text-amber-500 text-xs">Lvl {spell.level}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}