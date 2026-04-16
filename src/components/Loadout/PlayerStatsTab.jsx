import React, { useState, useEffect, useRef } from 'react';
import BoostsSelector, { BOOSTS } from './BoostsSelector';

const STATS = [
  { id: 'hitpoints', label: 'Hitpoints' },
  { id: 'attack', label: 'Attack' },
  { id: 'strength', label: 'Strength' },
  { id: 'defence', label: 'Defence' },
  { id: 'ranged', label: 'Ranged' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'magic', label: 'Magic' }
];

export default function PlayerStatsTab({ stats, onStatsChange }) {
  const [selectedBoosts, setSelectedBoosts] = useState(stats.selectedBoosts || []);
  const isMountedRef = useRef(false);

  const handleStatChange = (id, value) => {
    const newStats = { ...stats, [id]: parseInt(value) || 1 };
    applyAllBoosts(selectedBoosts, newStats);
  };

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    applyAllBoosts(selectedBoosts);
  }, [selectedBoosts]);

  const applyAllBoosts = (boosts, baseStats = stats) => {
    const boostedStats = { ...baseStats, selectedBoosts: boosts };
    
    // Always clear all boosts first
    delete boostedStats.boostedAttack;
    delete boostedStats.boostedStrength;
    delete boostedStats.boostedDefence;
    delete boostedStats.boostedRanged;
    delete boostedStats.boostedMagic;
    delete boostedStats.boostedHitpoints;
    delete boostedStats.boostedPrayer;
    
    if (boosts.length === 0) {
      onStatsChange(boostedStats);
      return;
    }

    const currentStats = {
      attack: baseStats.attack || 1,
      strength: baseStats.strength || 1,
      defence: baseStats.defence || 1,
      ranged: baseStats.ranged || 1,
      magic: baseStats.magic || 1
    };

    // Apply each boost from base stats
    boosts.forEach(boost => {
      boost.skills.forEach(skill => {
        const boostedKey = `boosted${skill.charAt(0).toUpperCase() + skill.slice(1)}`;
        const currentBoostedValue = boostedStats[boostedKey] || currentStats[skill];
        
        if (boost.formula) {
          const boostAmount = boost.formula(currentStats[skill], skill, currentStats);
          boostedStats[boostedKey] = Math.max(currentBoostedValue, currentStats[skill] + boostAmount);
        }
      });
      
      // Apply drains
      if (boost.drains) {
        Object.keys(boost.drains).forEach(skill => {
          const boostedKey = `boosted${skill.charAt(0).toUpperCase() + skill.slice(1)}`;
          const drainAmount = boost.drains[skill](currentStats[skill]);
          boostedStats[boostedKey] = currentStats[skill] - drainAmount;
        });
      }
      
      // Apply restores
      if (boost.restores) {
        Object.keys(boost.restores).forEach(skill => {
          const boostedKey = `boosted${skill.charAt(0).toUpperCase() + skill.slice(1)}`;
          const drainAmount = boost.drains?.[skill]?.(currentStats[skill]) || 0;
          const restoreAmount = boost.restores[skill](currentStats[skill], drainAmount);
          const currentDrainedValue = currentStats[skill] - drainAmount;
          boostedStats[boostedKey] = currentDrainedValue + restoreAmount;
        });
      }
    });

    onStatsChange(boostedStats);
  };

  return (
    <div>
      <h3 className="text-amber-600 font-bold text-sm mb-3">Player Stats</h3>
      
      {/* Manual Stats */}
      <div className="space-y-2 mb-4">
        {STATS.map((stat) => {
          const boostedKey = `boosted${stat.id.charAt(0).toUpperCase() + stat.id.slice(1)}`;
          const baseValue = stats[stat.id] || 1;
          const boostedValue = stats[boostedKey] || baseValue;
          const isBoosted = boostedValue !== baseValue;
          
          return (
            <div key={stat.id} className="flex items-center gap-2">
              <span className="text-amber-700 text-xs w-20">{stat.label}</span>
              <input
                type="number"
                min={1}
                max={99}
                value={baseValue}
                onChange={(e) => handleStatChange(stat.id, e.target.value)}
                className="w-14 px-2 py-1 text-xs text-center rounded border border-amber-900 bg-gray-900 text-amber-100 focus:outline-none"
              />
              <span className="text-amber-700 text-xs">/</span>
              <div className={`w-14 px-2 py-1 text-xs text-center rounded border ${
                isBoosted ? 'border-green-600 bg-gray-800 text-green-400' : 'border-amber-900 bg-gray-950 text-amber-600'
              }`}>
                {boostedValue}
              </div>
            </div>
          );
        })}
      </div>

      {/* Boosts Selector */}
      <BoostsSelector
        selectedBoosts={selectedBoosts}
        onBoostsChange={setSelectedBoosts}
        skills={{
          attack: stats.attack || 1,
          strength: stats.strength || 1,
          defence: stats.defence || 1,
          ranged: stats.ranged || 1,
          magic: stats.magic || 1
        }}
      />
    </div>
  );
}