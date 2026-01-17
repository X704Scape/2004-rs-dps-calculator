import React from 'react';

const STATS = [
  { id: 'hitpoints', label: 'Hitpoints', min: 1, max: 99 },
  { id: 'attack', label: 'Attack', min: 1, max: 99 },
  { id: 'strength', label: 'Strength', min: 1, max: 99 },
  { id: 'defence', label: 'Defence', min: 1, max: 99 },
  { id: 'ranged', label: 'Ranged', min: 1, max: 99 },
  { id: 'magic', label: 'Magic', min: 1, max: 99 }
];

const PRAYERS = {
  none: 'None',
  burst_of_strength: 'Burst of Strength (1.05x)',
  superhuman_strength: 'Superhuman Strength (1.10x)',
  ultimate_strength: 'Ultimate Strength (1.15x)'
};

const STYLES = {
  aggressive: 'Aggressive (+3 Str)',
  controlled: 'Controlled (+1 Str)',
  accurate: 'Accurate (+3 Atk)',
  defensive: 'Defensive'
};

const COMBAT_TYPES = {
  melee: 'Melee',
  ranged: 'Ranged',
  magic: 'Magic'
};

export default function PlayerStats({ stats, onStatsChange }) {
  const handleStatChange = (id, value) => {
    onStatsChange({ ...stats, [id]: parseInt(value) || 1 });
  };

  const handleSelectChange = (id, value) => {
    onStatsChange({ ...stats, [id]: value });
  };

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded p-4">
      <h2 className="text-amber-600 font-bold text-lg mb-4 border-b border-amber-900 pb-2">Player Stats</h2>
      
      {/* Combat Type */}
      <div className="mb-4">
        <label className="text-xs font-bold text-amber-700 block mb-1">Combat Type</label>
        <select
          value={stats.combatType || 'melee'}
          onChange={(e) => handleSelectChange('combatType', e.target.value)}
          className="w-full bg-gray-900 border border-amber-900 rounded px-2 py-1 text-xs text-amber-100 focus:outline-none"
        >
          {Object.entries(COMBAT_TYPES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {STATS.map((stat) => (
          <div key={stat.id}>
            <label className="text-xs font-bold text-amber-700 block mb-1">{stat.label}</label>
            <input
              type="number"
              min={stat.min}
              max={stat.max}
              value={stats[stat.id] || 1}
              onChange={(e) => handleStatChange(stat.id, e.target.value)}
              className="w-full bg-gray-900 border border-amber-900 rounded px-2 py-1 text-xs text-amber-100 focus:outline-none"
            />
          </div>
        ))}
      </div>

      {/* Prayer */}
      <div className="mb-4">
        <label className="text-xs font-bold text-amber-700 block mb-1">Prayer</label>
        <select
          value={stats.prayer || 'none'}
          onChange={(e) => handleSelectChange('prayer', e.target.value)}
          className="w-full bg-gray-900 border border-amber-900 rounded px-2 py-1 text-xs text-amber-100 focus:outline-none"
        >
          {Object.entries(PRAYERS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Combat Style */}
      <div>
        <label className="text-xs font-bold text-amber-700 block mb-1">Combat Style</label>
        <select
          value={stats.style || 'aggressive'}
          onChange={(e) => handleSelectChange('style', e.target.value)}
          className="w-full bg-gray-900 border border-amber-900 rounded px-2 py-1 text-xs text-amber-100 focus:outline-none"
        >
          {Object.entries(STYLES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}