import React, { useState } from 'react';

const PRAYERS = [
  // Strength
  { id: 'burst_of_strength', name: 'Burst of Strength', multiplier: '1.05x', type: 'strength' },
  { id: 'superhuman_strength', name: 'Superhuman Strength', multiplier: '1.10x', type: 'strength' },
  { id: 'ultimate_strength', name: 'Ultimate Strength', multiplier: '1.15x', type: 'strength' },
  // Attack
  { id: 'clarity_of_thought', name: 'Clarity of Thought', multiplier: '1.05x', type: 'attack' },
  { id: 'improved_reflexes', name: 'Improved Reflexes', multiplier: '1.10x', type: 'attack' },
  { id: 'incredible_reflexes', name: 'Incredible Reflexes', multiplier: '1.15x', type: 'attack' },
  // Defence
  { id: 'thick_skin', name: 'Thick Skin', multiplier: '1.05x', type: 'defence' },
  { id: 'rock_skin', name: 'Rock Skin', multiplier: '1.10x', type: 'defence' },
  { id: 'steel_skin', name: 'Steel Skin', multiplier: '1.15x', type: 'defence' },
];

export default function PrayerTab({ selectedPrayer, onPrayerChange }) {
  const [activeStrengthPrayer, setActiveStrengthPrayer] = React.useState(selectedPrayer?.strength || null);
  const [activeAttackPrayer, setActiveAttackPrayer] = React.useState(selectedPrayer?.attack || null);
  const [activeDefencePrayer, setActiveDefencePrayer] = React.useState(selectedPrayer?.defence || null);

  const handlePrayerClick = (prayer) => {
    if (prayer.type === 'strength') {
      const newPrayer = activeStrengthPrayer === prayer.id ? null : prayer.id;
      setActiveStrengthPrayer(newPrayer);
      onPrayerChange({ strength: newPrayer, attack: activeAttackPrayer, defence: activeDefencePrayer });
    } else if (prayer.type === 'attack') {
      const newPrayer = activeAttackPrayer === prayer.id ? null : prayer.id;
      setActiveAttackPrayer(newPrayer);
      onPrayerChange({ strength: activeStrengthPrayer, attack: newPrayer, defence: activeDefencePrayer });
    } else {
      const newPrayer = activeDefencePrayer === prayer.id ? null : prayer.id;
      setActiveDefencePrayer(newPrayer);
      onPrayerChange({ strength: activeStrengthPrayer, attack: activeAttackPrayer, defence: newPrayer });
    }
  };

  const byType = (type) => PRAYERS.filter(p => p.type === type);

  return (
    <div>
      <h3 className="text-amber-600 font-bold text-sm mb-3">Prayers</h3>

      <div className="grid grid-cols-3 gap-3">
        {['strength', 'attack', 'defence'].map(type => (
          <div key={type} className="space-y-2">
            <p className="text-xs text-amber-700 font-bold text-center mb-2 capitalize">{type}</p>
            {byType(type).map((prayer) => {
              const isActive = type === 'strength' ? activeStrengthPrayer === prayer.id
                : type === 'attack' ? activeAttackPrayer === prayer.id
                : activeDefencePrayer === prayer.id;
              return (
                <button
                  key={prayer.id}
                  onClick={() => handlePrayerClick(prayer)}
                  className={`w-full p-2 rounded border-2 transition ${
                    isActive
                      ? 'bg-amber-900 border-amber-700'
                      : 'bg-gray-900 border-gray-700 hover:border-amber-900'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-amber-100 font-semibold text-xs">{prayer.name}</p>
                    <p className="text-amber-700 text-xs">{prayer.multiplier}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}