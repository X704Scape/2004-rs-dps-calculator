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
        const [itemsResponse, metaResponse] = await Promise.all([
          base44.functions.invoke('fetchGameData', { type: 'items' }),
          base44.functions.invoke('fetchWeaponsMeta', {})
        ]);
        console.log('Items response:', itemsResponse.data);
        console.log('Total items:', itemsResponse.data?.items?.length);
        
        // Merge weapons metadata into items
        const itemsWithMeta = (itemsResponse.data.items || []).map(item => {
          const meta = metaResponse.data.weaponsMeta[item.id];
          return {
            ...item,
            attackStyles: meta?.attackStyles || item.attackStyles,
            speedOverrides: meta?.speedOverrides || item.speedOverrides
          };
        });
        
        setItems(itemsWithMeta);
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

  const getAttackSpeed = () => {
    const weapon = equipment.weapon;
    if (!weapon) return { ticks: 4, seconds: 2.4 };
    
    const ticks = weapon.attackRate || 4;
    const seconds = (ticks * 0.6).toFixed(1);
    return { ticks, seconds };
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
                  onClick={() => {
                    if (item) {
                      const newEquipment = { ...equipment };
                      delete newEquipment[slot];
                      onEquipmentChange(newEquipment);
                    }
                  }}
                  className="w-14 h-14 bg-gray-900 border border-amber-900 rounded flex items-center justify-center cursor-pointer hover:border-amber-700 transition overflow-hidden"
                  title={item ? `${item.name} (Click to remove)` : `Empty ${slot}`}
                >
                  {item && (item.icon || item.iconUrl) ? (
                    <img 
                      src={item.iconUrl || item.icon} 
                      alt={item.name} 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {item && !item.icon && (
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
                  {(item.icon || item.iconUrl) && (
                    <img 
                      src={item.iconUrl || item.icon} 
                      alt={item.name} 
                      className="w-8 h-8 object-contain" 
                      onError={(e) => e.target.style.display = 'none'}
                    />
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
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-amber-700 text-xs font-bold mb-1">Offensive</p>
            <div className="space-y-1 text-xs text-amber-100">
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/3a457fe7c_Screenshot2026-01-19015627.png" className="w-4 h-4" alt="Stab" />
                <span>{getTotalBonus('stab')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/dd15bf355_Screenshot2026-01-19015651.png" className="w-4 h-4" alt="Slash" />
                <span>{getTotalBonus('slash')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/90ab47df6_Screenshot2026-01-19015923.png" className="w-4 h-4" alt="Crush" />
                <span>{getTotalBonus('crush')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/2821a90c6_Screenshot2026-01-19015934.png" className="w-4 h-4" alt="Ranged" />
                <span>{getTotalBonus('ranged')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/e8f8b4235_Screenshot2026-01-19015928.png" className="w-4 h-4" alt="Magic" />
                <span>{getTotalBonus('magic')}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-amber-700 text-xs font-bold mb-1">Defensive</p>
            <div className="space-y-1 text-xs text-amber-100">
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/3a457fe7c_Screenshot2026-01-19015627.png" className="w-4 h-4" alt="Stab" />
                <span>{getTotalBonus('defenceStab')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/dd15bf355_Screenshot2026-01-19015651.png" className="w-4 h-4" alt="Slash" />
                <span>{getTotalBonus('defenceSlash')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/90ab47df6_Screenshot2026-01-19015923.png" className="w-4 h-4" alt="Crush" />
                <span>{getTotalBonus('defenceCrush')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/2821a90c6_Screenshot2026-01-19015934.png" className="w-4 h-4" alt="Ranged" />
                <span>{getTotalBonus('defenceRanged')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/e8f8b4235_Screenshot2026-01-19015928.png" className="w-4 h-4" alt="Magic" />
                <span>{getTotalBonus('defenceMagic')}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-amber-700 text-xs font-bold mb-1">Other</p>
            <div className="space-y-1 text-xs text-amber-100">
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/453a291c6_Screenshot2026-01-19015942.png" className="w-4 h-4" alt="Strength" />
                <span>{getTotalBonus('strBonus')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/11e84d1fb_Screenshot2026-01-19015950.png" className="w-4 h-4" alt="Ranged Str" />
                <span>{getTotalBonus('rangedStrBonus')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/973d3f90f_Screenshot2026-01-19020003.png" className="w-4 h-4" alt="Prayer" />
                <span>{getTotalBonus('prayer')}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/aed2e430d_Screenshot2026-01-19020030.png" className="w-4 h-4" alt="Speed" />
                <span>{getAttackSpeed().ticks} ticks ({getAttackSpeed().seconds}s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}