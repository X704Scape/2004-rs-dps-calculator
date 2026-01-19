import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

const STATS = [
  { id: 'hitpoints', label: 'Hitpoints' },
  { id: 'attack', label: 'Attack' },
  { id: 'strength', label: 'Strength' },
  { id: 'defence', label: 'Defence' },
  { id: 'ranged', label: 'Ranged' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'magic', label: 'Magic' }
];

const POTION_BOOSTS = [
  { id: 'none', label: 'None' },
  { id: 'attack', label: 'Attack Potion' },
  { id: 'super_attack', label: 'Super Attack' },
  { id: 'strength', label: 'Strength Potion' },
  { id: 'super_strength', label: 'Super Strength' },
  { id: 'ranging', label: 'Ranging Potion' },
  { id: 'magic', label: 'Magic Potion' },
  { id: 'dragon_battleaxe', label: 'Dragon Battleaxe Special' },
  { id: 'dragon_battleaxe_restore', label: 'Dragon Battleaxe + Restore' }
];

export default function PlayerStatsTab({ stats, onStatsChange }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPotions, setSelectedPotions] = useState([]);

  const handleStatChange = (id, value) => {
    onStatsChange({ ...stats, [id]: parseInt(value) || 1 });
  };

  const loadFromHiscores = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke('fetchHiscores', { username });
      
      if (response.data.stats) {
        onStatsChange({ ...stats, ...response.data.stats });
      }
    } catch (error) {
      console.error('Failed to load hiscores:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePotionBoost = (potionId) => {
    let newSelected;
    if (potionId === 'none') {
      newSelected = [];
    } else if (selectedPotions.includes(potionId)) {
      newSelected = selectedPotions.filter(id => id !== potionId);
    } else {
      newSelected = [...selectedPotions, potionId];
    }
    
    setSelectedPotions(newSelected);
    applyAllBoosts(newSelected);
  };

  const applyAllBoosts = (potionIds) => {
    const boostedStats = { ...stats, potionBoosts: potionIds };
    
    if (potionIds.length === 0) {
      // Clear all boosts
      delete boostedStats.boostedAttack;
      delete boostedStats.boostedStrength;
      delete boostedStats.boostedDefence;
      delete boostedStats.boostedRanged;
      delete boostedStats.boostedMagic;
      onStatsChange(boostedStats);
      return;
    }

    const currentAttack = stats.attack || 1;
    const currentStrength = stats.strength || 1;
    const currentRanged = stats.ranged || 1;
    const currentMagic = stats.magic || 1;
    const currentDefence = stats.defence || 1;

    // Apply each selected potion
    potionIds.forEach(potionId => {
      switch (potionId) {
        case 'attack':
          boostedStats.boostedAttack = Math.max(boostedStats.boostedAttack || currentAttack, currentAttack + Math.floor(3 + currentAttack * 0.1));
          break;
        case 'super_attack':
          boostedStats.boostedAttack = Math.max(boostedStats.boostedAttack || currentAttack, currentAttack + Math.floor(5 + currentAttack * 0.15));
          break;
        case 'strength':
          boostedStats.boostedStrength = Math.max(boostedStats.boostedStrength || currentStrength, currentStrength + Math.floor(3 + currentStrength * 0.1));
          break;
        case 'super_strength':
          boostedStats.boostedStrength = Math.max(boostedStats.boostedStrength || currentStrength, currentStrength + Math.floor(5 + currentStrength * 0.15));
          break;
        case 'ranging':
          boostedStats.boostedRanged = Math.max(boostedStats.boostedRanged || currentRanged, currentRanged + Math.floor(4 + currentRanged * 0.1));
          break;
        case 'magic':
          boostedStats.boostedMagic = Math.max(boostedStats.boostedMagic || currentMagic, currentMagic + 4);
          break;
        case 'dragon_battleaxe':
          const drainAttack = Math.floor(currentAttack * 0.1);
          const drainDefence = Math.floor(currentDefence * 0.1);
          const drainRanged = Math.floor(currentRanged * 0.1);
          const drainMagic = Math.floor(currentMagic * 0.1);
          const totalDrained = drainAttack + drainDefence + drainRanged + drainMagic;
          boostedStats.boostedAttack = currentAttack - drainAttack;
          boostedStats.boostedDefence = currentDefence - drainDefence;
          boostedStats.boostedRanged = currentRanged - drainRanged;
          boostedStats.boostedMagic = currentMagic - drainMagic;
          boostedStats.boostedStrength = (boostedStats.boostedStrength || currentStrength) + Math.floor(10 + totalDrained / 4);
          break;
        case 'dragon_battleaxe_restore':
          const drain2Attack = Math.floor(currentAttack * 0.1);
          const drain2Defence = Math.floor(currentDefence * 0.1);
          const drain2Ranged = Math.floor(currentRanged * 0.1);
          const drain2Magic = Math.floor(currentMagic * 0.1);
          const total2Drained = drain2Attack + drain2Defence + drain2Ranged + drain2Magic;
          boostedStats.boostedStrength = (boostedStats.boostedStrength || currentStrength) + Math.floor(10 + total2Drained / 4);
          break;
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
      <div className="grid grid-cols-2 gap-3 mb-4">
        {STATS.map((stat) => {
          const boostedKey = `boosted${stat.id.charAt(0).toUpperCase() + stat.id.slice(1)}`;
          const boostedValue = stats[boostedKey];
          
          return (
            <div key={stat.id}>
              <label className="text-xs font-bold text-amber-700 block mb-1">{stat.label}</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={stats[stat.id] || 1}
                  onChange={(e) => handleStatChange(stat.id, e.target.value)}
                  className="w-full bg-gray-900 border border-amber-900 rounded px-2 py-1 text-xs text-amber-100 focus:outline-none"
                />
                {boostedValue && boostedValue !== stats[stat.id] && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-400 font-bold">
                    +{boostedValue - stats[stat.id]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Potion Boosts */}
      <div className="bg-gray-900 rounded p-3 border border-amber-900">
        <label className="text-xs font-bold text-amber-700 block mb-2">Potion Boost</label>
        <div className="max-h-48 overflow-y-auto border border-amber-900 rounded">
          {POTION_BOOSTS.map((potion) => {
            const isSelected = potion.id === 'none' ? selectedPotions.length === 0 : selectedPotions.includes(potion.id);
            return (
              <button
                key={potion.id}
                onClick={() => togglePotionBoost(potion.id)}
                className={`w-full text-left px-3 py-2 text-xs border-b border-amber-900 last:border-b-0 transition ${
                  isSelected
                    ? 'bg-amber-900 text-amber-100 font-semibold'
                    : 'bg-gray-800 text-amber-300 hover:bg-gray-700'
                }`}
              >
                {potion.label}
                {isSelected && potion.id !== 'none' && (
                  <span className="ml-2 text-xs">
                    {potion.id === 'attack' && `(+${Math.floor(3 + (stats.attack || 1) * 0.1)})`}
                    {potion.id === 'super_attack' && `(+${Math.floor(5 + (stats.attack || 1) * 0.15)})`}
                    {potion.id === 'strength' && `(+${Math.floor(3 + (stats.strength || 1) * 0.1)})`}
                    {potion.id === 'super_strength' && `(+${Math.floor(5 + (stats.strength || 1) * 0.15)})`}
                    {potion.id === 'ranging' && `(+${Math.floor(4 + (stats.ranged || 1) * 0.1)})`}
                    {potion.id === 'magic' && '(+4)'}
                    {potion.id === 'dragon_battleaxe' && `(+${Math.floor(10 + (Math.floor((stats.attack || 1) * 0.1) + Math.floor((stats.defence || 1) * 0.1) + Math.floor((stats.ranged || 1) * 0.1) + Math.floor((stats.magic || 1) * 0.1)) / 4)} Str)`}
                    {potion.id === 'dragon_battleaxe_restore' && `(+${Math.floor(10 + (Math.floor((stats.attack || 1) * 0.1) + Math.floor((stats.defence || 1) * 0.1) + Math.floor((stats.ranged || 1) * 0.1) + Math.floor((stats.magic || 1) * 0.1)) / 4)} Str)`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}