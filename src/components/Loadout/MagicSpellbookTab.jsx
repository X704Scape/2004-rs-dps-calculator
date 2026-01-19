import React, { useState } from 'react';

const COMBAT_SPELLS = [
  { 
    id: 'wind_strike', name: 'Wind Strike', maxHit: 2, level: 1, 
    castTime: 3, experience: 5.5, type: 'strike',
    runes: [{ name: 'Air', amount: 1 }, { name: 'Mind', amount: 1 }]
  },
  { 
    id: 'water_strike', name: 'Water Strike', maxHit: 4, level: 5,
    castTime: 3, experience: 7.5, type: 'strike',
    runes: [{ name: 'Water', amount: 1 }, { name: 'Air', amount: 1 }, { name: 'Mind', amount: 1 }]
  },
  { 
    id: 'earth_strike', name: 'Earth Strike', maxHit: 6, level: 9,
    castTime: 3, experience: 9.5, type: 'strike',
    runes: [{ name: 'Earth', amount: 2 }, { name: 'Air', amount: 1 }, { name: 'Mind', amount: 1 }]
  },
  { 
    id: 'fire_strike', name: 'Fire Strike', maxHit: 8, level: 13,
    castTime: 3, experience: 11.5, type: 'strike',
    runes: [{ name: 'Fire', amount: 3 }, { name: 'Air', amount: 2 }, { name: 'Mind', amount: 1 }]
  },
  { 
    id: 'wind_bolt', name: 'Wind Bolt', maxHit: 9, level: 17,
    castTime: 3, experience: 13.5, type: 'bolt',
    runes: [{ name: 'Air', amount: 2 }, { name: 'Chaos', amount: 1 }]
  },
  { 
    id: 'water_bolt', name: 'Water Bolt', maxHit: 10, level: 23,
    castTime: 3, experience: 16.5, type: 'bolt',
    runes: [{ name: 'Water', amount: 2 }, { name: 'Air', amount: 2 }, { name: 'Chaos', amount: 1 }]
  },
  { 
    id: 'earth_bolt', name: 'Earth Bolt', maxHit: 11, level: 29,
    castTime: 3, experience: 19.5, type: 'bolt',
    runes: [{ name: 'Earth', amount: 3 }, { name: 'Air', amount: 2 }, { name: 'Chaos', amount: 1 }]
  },
  { 
    id: 'fire_bolt', name: 'Fire Bolt', maxHit: 12, level: 35,
    castTime: 3, experience: 22.5, type: 'bolt',
    runes: [{ name: 'Fire', amount: 4 }, { name: 'Air', amount: 3 }, { name: 'Chaos', amount: 1 }]
  },
  { 
    id: 'wind_blast', name: 'Wind Blast', maxHit: 13, level: 41,
    castTime: 3, experience: 25.5, type: 'blast',
    runes: [{ name: 'Air', amount: 3 }, { name: 'Death', amount: 1 }]
  },
  { 
    id: 'water_blast', name: 'Water Blast', maxHit: 14, level: 47,
    castTime: 3, experience: 28.5, type: 'blast',
    runes: [{ name: 'Water', amount: 3 }, { name: 'Air', amount: 3 }, { name: 'Death', amount: 1 }]
  },
  { 
    id: 'earth_blast', name: 'Earth Blast', maxHit: 15, level: 53,
    castTime: 3, experience: 31.5, type: 'blast',
    runes: [{ name: 'Earth', amount: 4 }, { name: 'Air', amount: 3 }, { name: 'Death', amount: 1 }]
  },
  { 
    id: 'fire_blast', name: 'Fire Blast', maxHit: 16, level: 59,
    castTime: 3, experience: 34.5, type: 'blast',
    runes: [{ name: 'Fire', amount: 5 }, { name: 'Air', amount: 4 }, { name: 'Death', amount: 1 }]
  },
  { 
    id: 'wind_wave', name: 'Wind Wave', maxHit: 17, level: 62,
    castTime: 3, experience: 36, type: 'wave',
    runes: [{ name: 'Air', amount: 5 }, { name: 'Blood', amount: 1 }]
  },
  { 
    id: 'water_wave', name: 'Water Wave', maxHit: 18, level: 65,
    castTime: 3, experience: 37.5, type: 'wave',
    runes: [{ name: 'Water', amount: 7 }, { name: 'Air', amount: 5 }, { name: 'Blood', amount: 1 }]
  },
  { 
    id: 'earth_wave', name: 'Earth Wave', maxHit: 19, level: 70,
    castTime: 3, experience: 40, type: 'wave',
    runes: [{ name: 'Earth', amount: 7 }, { name: 'Air', amount: 5 }, { name: 'Blood', amount: 1 }]
  },
  { 
    id: 'fire_wave', name: 'Fire Wave', maxHit: 20, level: 75,
    castTime: 3, experience: 42.5, type: 'wave',
    runes: [{ name: 'Fire', amount: 7 }, { name: 'Air', amount: 5 }, { name: 'Blood', amount: 1 }]
  }
];

export default function MagicSpellbookTab({ selectedSpell, onSpellChange, playerStats }) {
  const [expandedSpell, setExpandedSpell] = useState(null);

  const handleSpellSelect = (spell) => {
    onSpellChange(spell);
  };

  const toggleExpand = (spellId) => {
    setExpandedSpell(expandedSpell === spellId ? null : spellId);
  };

  return (
    <div>
      <h3 className="text-amber-600 font-bold text-sm mb-3">Combat Spells</h3>
      
      {selectedSpell && (
        <div className="mb-4 p-3 bg-amber-900 border-2 border-amber-700 rounded">
          <p className="text-amber-100 font-bold text-sm mb-2">Selected: {selectedSpell.name}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-amber-100">
            <div className="flex items-center gap-1">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/ca4eccc80_image.png" className="w-3 h-3" alt="Damage" />
              <span>Max: {selectedSpell.maxHit}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/eeb289b44_image.png" className="w-3 h-3" alt="Speed" />
              <span>{selectedSpell.castTime} ticks</span>
            </div>
            <div className="col-span-2">
              <p className="text-amber-300 text-xs font-semibold mb-1">Rune Cost:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSpell.runes.map((rune, idx) => (
                  <span key={idx} className="text-amber-200 text-xs">{rune.amount}x {rune.name}</span>
                ))}
              </div>
            </div>
            <div className="col-span-2 mt-1">
              <span className="text-green-400 text-xs">+{selectedSpell.experience} XP per cast</span>
            </div>
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
                    <p className="text-amber-700 text-xs">Max Hit: {spell.maxHit}</p>
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
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-amber-700 font-semibold">Stats:</p>
                      <p className="text-amber-100">• Max Hit: {spell.maxHit}</p>
                      <p className="text-amber-100">• Cast Time: {spell.castTime} ticks ({(spell.castTime * 0.6).toFixed(1)}s)</p>
                      <p className="text-amber-100">• Type: {spell.type}</p>
                    </div>
                    <div>
                      <p className="text-amber-700 font-semibold">Requirements:</p>
                      <p className="text-amber-100">• Magic: {spell.level}</p>
                      <p className="text-green-400 mt-1">XP: +{spell.experience}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-amber-700 font-semibold mb-1">Runes Required:</p>
                    <div className="flex flex-wrap gap-2">
                      {spell.runes.map((rune, idx) => (
                        <span key={idx} className="bg-gray-900 px-2 py-1 rounded text-amber-200">
                          {rune.amount}x {rune.name}
                        </span>
                      ))}
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