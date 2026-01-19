import React, { useState } from 'react';

// 2004 Spell Data
const COMBAT_SPELLS = [
  // Strike Spells
  { id: 'wind_strike', name: 'Wind Strike', level: 1, maxHit: 2, speedTicks: 5 },
  { id: 'water_strike', name: 'Water Strike', level: 5, maxHit: 4, speedTicks: 5 },
  { id: 'earth_strike', name: 'Earth Strike', level: 9, maxHit: 6, speedTicks: 5 },
  { id: 'fire_strike', name: 'Fire Strike', level: 13, maxHit: 8, speedTicks: 5 },

  // Bolt Spells
  { id: 'wind_bolt', name: 'Wind Bolt', level: 17, maxHit: 9, speedTicks: 5 },
  { id: 'water_bolt', name: 'Water Bolt', level: 23, maxHit: 10, speedTicks: 5 },
  { id: 'earth_bolt', name: 'Earth Bolt', level: 29, maxHit: 11, speedTicks: 5 },
  { id: 'fire_bolt', name: 'Fire Bolt', level: 35, maxHit: 12, speedTicks: 5 },

  // Blast Spells
  { id: 'wind_blast', name: 'Wind Blast', level: 41, maxHit: 13, speedTicks: 5 },
  { id: 'water_blast', name: 'Water Blast', level: 47, maxHit: 14, speedTicks: 5 },
  { id: 'earth_blast', name: 'Earth Blast', level: 53, maxHit: 15, speedTicks: 5 },
  { id: 'fire_blast', name: 'Fire Blast', level: 59, maxHit: 16, speedTicks: 5 },

  // Wave Spells
  { id: 'wind_wave', name: 'Wind Wave', level: 62, maxHit: 17, speedTicks: 5 },
  { id: 'water_wave', name: 'Water Wave', level: 65, maxHit: 18, speedTicks: 5 },
  { id: 'earth_wave', name: 'Earth Wave', level: 70, maxHit: 19, speedTicks: 5 },
  { id: 'fire_wave', name: 'Fire Wave', level: 75, maxHit: 20, speedTicks: 5 },

  // God Spells (Require Charge + Staff)
  { id: 'saradomin_strike', name: 'Saradomin Strike', level: 60, maxHit: 20, speedTicks: 5, requiresCharge: true, requiresStaff: true },
  { id: 'claws_of_guthix', name: 'Claws of Guthix', level: 60, maxHit: 20, speedTicks: 5, requiresCharge: true, requiresStaff: true },
  { id: 'flames_of_zamorak', name: 'Flames of Zamorak', level: 60, maxHit: 20, speedTicks: 5, requiresCharge: true, requiresStaff: true },

  // Special Spell
  { id: 'ibans_blast', name: "Iban's Blast", level: 50, maxHit: 25, speedTicks: 5, requiresStaff: true }
];

export default function MagicSpellbookTab({ selectedSpell, onSpellChange, playerStats, chargeActive, onChargeChange }) {
  const [expandedSpell, setExpandedSpell] = useState(null);

  const handleSpellSelect = (spell) => {
    onSpellChange(spell);
  };

  const toggleExpand = (spellId) => {
    setExpandedSpell(expandedSpell === spellId ? null : spellId);
  };

  const getEffectiveMaxHit = (spell) => {
    if (spell.requiresCharge && chargeActive) {
      return 30;
    }
    return spell.maxHit;
  };

  return (
    <div>
      <h3 className="text-amber-600 font-bold text-sm mb-3">Combat Spells</h3>
      
      {/* Charge Toggle */}
      <button
        onClick={() => onChargeChange(!chargeActive)}
        className={`w-full mb-3 p-2 rounded border-2 transition ${
          chargeActive
            ? 'bg-yellow-900 border-yellow-600 text-yellow-100'
            : 'bg-gray-900 border-gray-700 text-amber-100 hover:border-amber-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">⚡ Charge</span>
          <span className="text-xs">{chargeActive ? 'Active' : 'Inactive'}</span>
        </div>
      </button>
      
      {selectedSpell && (
        <div className="mb-4 p-3 bg-amber-900 border-2 border-amber-700 rounded">
          <p className="text-amber-100 font-bold text-sm mb-2">Selected: {selectedSpell.name}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-amber-100">
            <div className="flex items-center gap-1">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/ca4eccc80_image.png" className="w-3 h-3" alt="Damage" />
              <span>Max: {getEffectiveMaxHit(selectedSpell)}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/aed2e430d_Screenshot2026-01-19020030.png" className="w-3 h-3" alt="Speed" />
              <span>{selectedSpell.speedTicks} ticks ({(selectedSpell.speedTicks * 0.6).toFixed(1)}s)</span>
            </div>
            {selectedSpell.requiresStaff && (
              <div className="col-span-2">
                <span className="text-red-400 text-xs">⚠ Requires specific staff</span>
              </div>
            )}
            {selectedSpell.requiresCharge && (
              <div className="col-span-2">
                <span className="text-yellow-400 text-xs">⚠ Requires Charge spell</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {COMBAT_SPELLS.map((spell) => {
          const canCast = playerStats.magic >= spell.level;
          const isExpanded = expandedSpell === spell.id;
          
          return (
            <div key={spell.id}>
              <button
                onClick={() => canCast && handleSpellSelect(spell)}
                onDoubleClick={() => toggleExpand(spell.id)}
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
                    <p className="text-amber-700 text-xs">Max Hit: {getEffectiveMaxHit(spell)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-500 text-xs">Lvl {spell.level}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(spell.id);
                      }}
                      className="text-amber-600 hover:text-amber-400 text-xs"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
              </button>
              
              {isExpanded && (
                <div className="mt-1 p-3 bg-gray-950 border border-gray-800 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-amber-700 font-semibold">Stats:</p>
                      <p className="text-amber-100">• Max Hit: {getEffectiveMaxHit(spell)}</p>
                      <p className="text-amber-100">• Speed: {spell.speedTicks} ticks ({(spell.speedTicks * 0.6).toFixed(1)}s)</p>
                    </div>
                    <div>
                      <p className="text-amber-700 font-semibold">Requirements:</p>
                      <p className="text-amber-100">• Magic: {spell.level}</p>
                      {spell.requiresStaff && <p className="text-red-400 mt-1">• Requires staff</p>}
                      {spell.requiresCharge && <p className="text-yellow-400 mt-1">• Requires Charge</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}