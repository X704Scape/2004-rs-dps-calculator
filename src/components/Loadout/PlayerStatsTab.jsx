import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';
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
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBoosts, setSelectedBoosts] = useState(stats.selectedBoosts || []);

  const handleStatChange = (id, value) => {
    onStatsChange({ ...stats, [id]: parseInt(value) || 1 });
  };

  const loadFromHiscores = async () => {
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      const playerUrl = `https://2004.lostcity.rs/hiscores/player/${username}`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract the skill levels from this RuneScape 2004 hiscores page at ${playerUrl}. Look for the table showing skill levels and extract: Attack, Strength, Defence, Hitpoints, Ranged, Magic, Prayer. Return ONLY a JSON object with these exact keys (lowercase) and their level values as numbers.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            attack: { type: "number" },
            strength: { type: "number" },
            defence: { type: "number" },
            hitpoints: { type: "number" },
            ranged: { type: "number" },
            magic: { type: "number" },
            prayer: { type: "number" }
          }
        }
      });
      
      onStatsChange({ ...stats, ...result });
    } catch (error) {
      console.error('Lookup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyAllBoosts(selectedBoosts);
  }, [selectedBoosts]);

  const applyAllBoosts = (boosts) => {
    const boostedStats = { ...stats, selectedBoosts: boosts };
    
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
      attack: stats.attack || 1,
      strength: stats.strength || 1,
      defence: stats.defence || 1,
      ranged: stats.ranged || 1,
      magic: stats.magic || 1
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
      
      {/* Hiscores Lookup */}
      <div className="mb-4 bg-gray-900 rounded p-3 border border-amber-900">
        <label className="text-xs text-amber-700 block mb-2">Load from Hiscores</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 bg-gray-800 border border-amber-900 rounded px-2 py-1 text-xs text-amber-100 focus:outline-none"
          />
          <button
            onClick={loadFromHiscores}
            disabled={loading || !username}
            className="bg-amber-900 hover:bg-amber-800 disabled:opacity-50 px-3 py-1 rounded text-xs text-amber-100"
          >
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>
      </div>

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