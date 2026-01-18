import React from 'react';

const PRAYERS = [
  { id: 'burst_of_strength', name: 'Burst of Strength', position: 'top-left', multiplier: '1.05x', type: 'strength' },
  { id: 'superhuman_strength', name: 'Superhuman Strength', position: 'middle-left', multiplier: '1.10x', type: 'strength' },
  { id: 'ultimate_strength', name: 'Ultimate Strength', position: 'bottom-left', multiplier: '1.15x', type: 'strength' },
  { id: 'clarity_of_thought', name: 'Clarity of Thought', position: 'top-right', multiplier: '1.05x', type: 'attack' },
  { id: 'improved_reflexes', name: 'Improved Reflexes', position: 'middle-right', multiplier: '1.10x', type: 'attack' },
  { id: 'incredible_reflexes', name: 'Incredible Reflexes', position: 'bottom-right', multiplier: '1.15x', type: 'attack' }
];

export default function PrayerTab({ selectedPrayer, onPrayerChange }) {
  const [activePrayer, setActivePrayer] = React.useState(selectedPrayer || null);

  const handlePrayerClick = (prayerId) => {
    const newPrayer = activePrayer === prayerId ? null : prayerId;
    setActivePrayer(newPrayer);
    onPrayerChange(newPrayer || 'none');
  };

  const leftPrayers = PRAYERS.filter(p => p.position.includes('left'));
  const rightPrayers = PRAYERS.filter(p => p.position.includes('right'));

  return (
    <div>
      <h3 className="text-amber-600 font-bold text-sm mb-3">Prayers</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Strength Prayers */}
        <div className="space-y-2">
          <p className="text-xs text-amber-700 font-bold text-center mb-2">Strength</p>
          {leftPrayers.map((prayer) => (
            <button
              key={prayer.id}
              onClick={() => handlePrayerClick(prayer.id)}
              className={`w-full p-3 rounded border-2 transition ${
                activePrayer === prayer.id
                  ? 'bg-amber-900 border-amber-700'
                  : 'bg-gray-900 border-gray-700 hover:border-amber-900'
              }`}
            >
              <div className="text-left">
                <p className="text-amber-100 font-semibold text-xs">{prayer.name}</p>
                <p className="text-amber-700 text-xs">{prayer.multiplier}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Attack Prayers */}
        <div className="space-y-2">
          <p className="text-xs text-amber-700 font-bold text-center mb-2">Attack</p>
          {rightPrayers.map((prayer) => (
            <button
              key={prayer.id}
              onClick={() => handlePrayerClick(prayer.id)}
              className={`w-full p-3 rounded border-2 transition ${
                activePrayer === prayer.id
                  ? 'bg-amber-900 border-amber-700'
                  : 'bg-gray-900 border-gray-700 hover:border-amber-900'
              }`}
            >
              <div className="text-left">
                <p className="text-amber-100 font-semibold text-xs">{prayer.name}</p>
                <p className="text-amber-700 text-xs">{prayer.multiplier}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}