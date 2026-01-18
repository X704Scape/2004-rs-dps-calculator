import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

const EQUIPMENT_LAYOUT = [
  [null, 'head', null],
  ['cape', 'neck', 'ammo'],
  ['weapon', 'body', 'shield'],
  [null, 'legs', null],
  ['hands', 'feet', 'ring']
];

export default function EquipmentTab({ equipment, onEquipmentChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await base44.functions.invoke('fetchGameData', { type: 'items' });
        console.log('Items response:', response.data);
        console.log('Total items:', response.data?.items?.length);
        setItems(response.data.items || []);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  useEffect(() => {
    if (searchTerm && searchTerm.length > 0) {
      const results = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 20);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, items]);

  useEffect(() => {
    console.log('Items loaded:', items.length);
    console.log('Sample item:', items[0]);
  }, [items]);

  const handleSelectItem = (item) => {
    const newEquipment = { ...equipment, [item.slot]: item };
    onEquipmentChange(newEquipment);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const getTotalBonus = (bonusType) => {
    return Object.values(equipment).reduce((sum, item) => {
      return sum + (item[bonusType] || 0);
    }, 0);
  };

  return (
    <div>
      {/* Equipment Grid */}
      <div className="mb-4">
        {EQUIPMENT_LAYOUT.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1 mb-1">
            {row.map((slot, colIdx) => {
              if (!slot) {
                return <div key={colIdx} className="w-14 h-14" />;
              }
              const item = equipment[slot];
              return (
                <div
                  key={slot}
                  className="w-14 h-14 bg-gray-900 border border-amber-900 rounded flex items-center justify-center cursor-pointer hover:border-amber-700 transition overflow-hidden"
                  title={item ? item.name : `Empty ${slot}`}
                >
                  {item && item.icon ? (
                    <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-amber-700">
                      {slot.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="flex items-center bg-gray-900 rounded px-3 py-2 border border-amber-900">
          <Search size={14} className="text-amber-700 mr-2" />
          <input
            type="text"
            placeholder="Search for equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="w-full bg-transparent text-xs text-amber-100 outline-none"
          />
        </div>

        {showDropdown && searchTerm && (
          <div className="absolute z-50 w-full mt-1 bg-gray-900 border-2 border-amber-900 rounded shadow-lg max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-xs text-amber-100 text-center">Loading...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-xs text-amber-100 text-center">No items found</div>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="w-full text-left px-3 py-2 text-xs text-amber-100 hover:bg-amber-900 transition border-b border-gray-800 last:border-b-0 flex items-center gap-2"
                >
                  {item.icon && (
                    <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain" />
                  )}
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-amber-700">{item.slot}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bonuses */}
      <div className="bg-gray-900 rounded p-3 border border-amber-900">
        <h3 className="text-amber-600 font-bold text-xs mb-2">Bonuses</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-amber-700 text-xs font-bold mb-1">Offensive</p>
            <div className="space-y-1 text-xs text-amber-100">
              <div className="flex items-center gap-1">
                <span className="text-amber-700">⚔</span>
                <span>{getTotalBonus('stab')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-700">🗡</span>
                <span>{getTotalBonus('slash')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-700">🔨</span>
                <span>{getTotalBonus('crush')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-700">🏹</span>
                <span>{getTotalBonus('ranged')}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-amber-700 text-xs font-bold mb-1">Defensive</p>
            <div className="space-y-1 text-xs text-amber-100">
              <div>{getTotalBonus('defenceStab')}</div>
              <div>{getTotalBonus('defenceSlash')}</div>
              <div>{getTotalBonus('defenceCrush')}</div>
              <div>{getTotalBonus('defenceRanged')}</div>
            </div>
          </div>
          <div>
            <p className="text-amber-700 text-xs font-bold mb-1">Other</p>
            <div className="space-y-1 text-xs text-amber-100">
              <div>Str: {getTotalBonus('strBonus')}</div>
              <div>Rng: {getTotalBonus('rangedStrBonus')}</div>
              <div>Mag: {getTotalBonus('magic')}</div>
              <div>Pray: {getTotalBonus('prayer')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}