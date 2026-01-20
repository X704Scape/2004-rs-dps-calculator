import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

export default function MonsterSelect({ selectedMonster, onMonsterChange }) {
  const [monsters, setMonsters] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);

  useEffect(() => {
    const loadMonsters = async () => {
      try {
        const response = await base44.functions.invoke('fetchGameData', { type: 'monsters' });
        console.log('Full response:', response);
        console.log('Response data:', response.data);
        console.log('Monsters array:', response.data?.monsters);
        console.log('Monsters count:', response.data?.monsters?.length);
        setMonsters(response.data?.monsters || []);
      } catch (error) {
        console.error('Failed to load monsters:', error);
        console.error('Error details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMonsters();
  }, []);

  const filteredMonsters = monsters.filter(m => {
    const nameMatch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = String(m.id).toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || idMatch;
  });

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded p-4">
      <h2 className="text-amber-600 font-bold text-lg mb-4 border-b border-amber-900 pb-2">Monster</h2>
      
      <div className="relative mb-4">
        <div className="flex items-center bg-gray-900 rounded px-3 py-2 border border-amber-900">
          <Search size={16} className="text-amber-700 mr-2" />
          <input
            type="text"
            placeholder="Search monster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="w-full bg-transparent text-xs text-amber-100 outline-none"
          />
        </div>

        {showDropdown && (
          <div className="absolute z-40 w-full mt-1 bg-gray-900 border-2 border-amber-900 rounded shadow-lg">
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-xs text-amber-100 text-center">Loading...</div>
              ) : filteredMonsters.length === 0 ? (
                <div className="p-3 text-xs text-amber-100 text-center">No monsters found</div>
              ) : (
                filteredMonsters.map((monster) => (
                  <button
                    key={monster.id}
                    onClick={() => {
                      onMonsterChange(monster);
                      setShowDropdown(false);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-amber-100 hover:bg-amber-900 transition border-b border-gray-800 last:border-b-0"
                    >
                    <div className="font-semibold">{monster.name}</div>
                    <div className="text-amber-700">ID: {monster.id}</div>
                    </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedMonster && (
        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <h3 className="text-amber-600 font-bold text-sm mb-3">{selectedMonster.name}</h3>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-amber-100 mb-3">
            <div>HP: {selectedMonster.hitpoints}</div>
            <div>Atk: {selectedMonster.attack}</div>
            <div>Str: {selectedMonster.strength}</div>
            <div>Def: {selectedMonster.defence}</div>
            <div>Rng: {selectedMonster.ranged}</div>
            <div>Mag: {selectedMonster.magic}</div>
          </div>

          <div className="border-t border-amber-900 pt-2">
            <p className="text-xs text-amber-700 font-bold mb-2">Defence Bonuses</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-amber-100">
              <div>Stab: {selectedMonster.defenceStab}</div>
              <div>Slash: {selectedMonster.defenceSlash}</div>
              <div>Crush: {selectedMonster.defenceCrush}</div>
              <div>Ranged: {selectedMonster.defenceRanged}</div>
              <div>Magic: {selectedMonster.defenceMagic}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}