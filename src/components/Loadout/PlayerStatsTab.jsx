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

export default function PlayerStatsTab({ stats, onStatsChange }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => (
          <div key={stat.id}>
            <label className="text-xs font-bold text-amber-700 block mb-1">{stat.label}</label>
            <input
              type="number"
              min={1}
              max={99}
              value={stats[stat.id] || 1}
              onChange={(e) => handleStatChange(stat.id, e.target.value)}
              className="w-full bg-gray-900 border border-amber-900 rounded px-2 py-1 text-xs text-amber-100 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}