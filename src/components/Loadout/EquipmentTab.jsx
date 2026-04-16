import React, { useEffect, useState, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

const EQUIPMENT_LAYOUT = [
  [null, 'head', null],
  ['cape', 'neck', 'ammo'],
  ['weapon', 'body', 'shield'],
  [null, 'legs', null],
  ['hands', 'feet', 'ring']
];

const SLOT_ICONS = {
  head: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/355d8f601_Screenshot2026-01-19174415.png',
  cape: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/e918a39d4_Screenshot2026-01-19174428.png',
  neck: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/dc0f72912_Screenshot2026-01-19174436.png',
  ammo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/2b31f8d07_Screenshot2026-01-19174446.png',
  weapon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/2e4842359_Screenshot2026-01-19174455.png',
  body: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/6cc0cea65_Screenshot2026-01-19174459.png',
  shield: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/b19038579_Screenshot2026-01-19174505.png',
  legs: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/1518772df_Screenshot2026-01-19174515.png',
  hands: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/e590b19c2_Screenshot2026-01-19174522.png',
  feet: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/1b207d49d_Screenshot2026-01-19174527.png',
  ring: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/edf33913e_Screenshot2026-01-19174530.png'
};

const VALID_SLOTS = new Set(['head','cape','neck','ammo','weapon','body','shield','legs','hands','feet','ring']);

// Module-level cache — never causes re-renders
const _itemsCache = { items: null, promise: null };

// Safe item extractor — always returns null or a plain object with expected fields
function safeItem(val) {
  if (val && typeof val === 'object' && !Array.isArray(val) && typeof val.name === 'string') {
    return val;
  }
  return null;
}

function EquipmentTab({ equipment, onEquipmentChange }) {
  const [items, setItems] = useState(_itemsCache.items || []);
  const [loading, setLoading] = useState(!_itemsCache.items);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (_itemsCache.items) {
      setItems(_itemsCache.items);
      setLoading(false);
      return;
    }
    if (!_itemsCache.promise) {
      _itemsCache.promise = Promise.all([
        base44.functions.invoke('fetchGameData', { type: 'items' }),
        base44.functions.invoke('fetchWeaponsMeta', {})
      ]).then(([itemsRes, metaRes]) => {
        const merged = (itemsRes.data.items || []).map(item => {
          const meta = metaRes.data.weaponsMeta?.[item.id];
          return { ...item, attackStyles: meta?.attackStyles || item.attackStyles };
        });
        _itemsCache.items = merged;
        return merged;
      }).catch(err => {
        console.error('Failed to load items:', err);
        _itemsCache.promise = null;
        return [];
      });
    }
    _itemsCache.promise.then(loaded => {
      if (!mountedRef.current) return;
      setItems(loaded);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build safe equipment — only valid slot keys, only valid item objects
  const rawEq = (equipment && typeof equipment === 'object' && !Array.isArray(equipment)) ? equipment : {};
  const safeEquipment = {};
  for (const slot of VALID_SLOTS) {
    const item = safeItem(rawEq[slot]);
    if (item) safeEquipment[slot] = item;
  }
  const is2HandedWeapon = rawEq._2handed === true;

  const searchResults = useMemo(() => {
    if (!debouncedSearch) return [];
    const lower = debouncedSearch.toLowerCase();
    return items
      .filter(item => item.name && (item.name.toLowerCase().includes(lower) || String(item.id).includes(lower)))
      .slice(0, 20);
  }, [debouncedSearch, items]);

  const handleSelectItem = (item) => {
    const newEq = { ...rawEq };
    const is2Handed = item.wearpos2 === 'lefthand' && item.slot === 'weapon';
    if (is2Handed) {
      delete newEq.shield;
      newEq.weapon = item;
      newEq._2handed = true;
    } else if (item.slot === 'shield') {
      if (newEq.weapon?.wearpos2 === 'lefthand') delete newEq.weapon;
      delete newEq._2handed;
      newEq.shield = item;
    } else if (item.slot === 'weapon') {
      delete newEq._2handed;
      newEq.weapon = item;
    } else {
      newEq[item.slot] = item;
    }
    onEquipmentChange(newEq);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const getTotalBonus = (bonusType) => {
    return Object.values(safeEquipment).reduce((sum, item) => sum + (Number(item[bonusType]) || 0), 0);
  };

  const speed = (() => {
    const weapon = safeEquipment.weapon;
    if (!weapon) return { ticks: 4, seconds: '2.4' };
    const ticks = weapon.attackRate || 4;
    return { ticks, seconds: (ticks * 0.6).toFixed(1) };
  })();

  return (
    <div>
      {/* Equipment Grid */}
      <div className="mb-4">
        {EQUIPMENT_LAYOUT.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1 mb-1">
            {row.map((slot, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              if (!slot) {
                return <div key={key} style={{ width: 56, height: 56 }} />;
              }

              const item = safeEquipment[slot] || null;
              const blocked = slot === 'shield' && is2HandedWeapon;
              const slotIcon = SLOT_ICONS[slot] || '';
              const imgSrc = (item && !blocked) ? (item.iconUrl || item.icon || slotIcon) : slotIcon;

              return (
                <div
                  key={key}
                  style={{ width: 56, height: 56 }}
                  className={[
                    'bg-gray-900 border border-amber-900 rounded flex items-center justify-center overflow-hidden',
                    blocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-amber-700'
                  ].join(' ')}
                  title={blocked ? '2-handed weapon equipped' : item ? `${item.name} (Click to remove)` : `Empty ${slot}`}
                  onClick={() => {
                    if (!item || blocked) return;
                    const next = { ...rawEq };
                    delete next[slot];
                    if (slot === 'weapon' && item.wearpos2 === 'lefthand') delete next._2handed;
                    onEquipmentChange(next);
                  }}
                >
                  <img
                    src={imgSrc}
                    alt={item && !blocked ? item.name : `Empty ${slot}`}
                    className={['w-full h-full object-contain', (!item || blocked) ? 'opacity-50' : ''].join(' ')}
                    onError={(e) => { e.target.src = slotIcon; }}
                  />
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
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
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
                  key={`${item.id}-${item.name}`}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSelectItem(item); }}
                  className="w-full text-left px-3 py-2 text-xs text-amber-100 hover:bg-amber-900 transition border-b border-gray-800 last:border-b-0 flex items-center gap-2"
                >
                  {(item.icon || item.iconUrl) && (
                    <img
                      src={item.iconUrl || item.icon}
                      alt={item.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-amber-700">{item.slot} • ID: {item.id}</div>
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
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/3a457fe7c_Screenshot2026-01-19015627.png" className="w-4 h-4" alt="Stab" /><span>{getTotalBonus('stab')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/dd15bf355_Screenshot2026-01-19015651.png" className="w-4 h-4" alt="Slash" /><span>{getTotalBonus('slash')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/90ab47df6_Screenshot2026-01-19015923.png" className="w-4 h-4" alt="Crush" /><span>{getTotalBonus('crush')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/2821a90c6_Screenshot2026-01-19015934.png" className="w-4 h-4" alt="Ranged" /><span>{getTotalBonus('ranged')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/e8f8b4235_Screenshot2026-01-19015928.png" className="w-4 h-4" alt="Magic" /><span>{getTotalBonus('magic')}</span></div>
            </div>
          </div>
          <div>
            <p className="text-amber-700 text-xs font-bold mb-1">Defensive</p>
            <div className="space-y-1 text-xs text-amber-100">
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/3a457fe7c_Screenshot2026-01-19015627.png" className="w-4 h-4" alt="Stab" /><span>{getTotalBonus('defenceStab')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/dd15bf355_Screenshot2026-01-19015651.png" className="w-4 h-4" alt="Slash" /><span>{getTotalBonus('defenceSlash')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/90ab47df6_Screenshot2026-01-19015923.png" className="w-4 h-4" alt="Crush" /><span>{getTotalBonus('defenceCrush')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/2821a90c6_Screenshot2026-01-19015934.png" className="w-4 h-4" alt="Ranged" /><span>{getTotalBonus('defenceRanged')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/e8f8b4235_Screenshot2026-01-19015928.png" className="w-4 h-4" alt="Magic" /><span>{getTotalBonus('defenceMagic')}</span></div>
            </div>
          </div>
          <div>
            <p className="text-amber-700 text-xs font-bold mb-1">Other</p>
            <div className="space-y-1 text-xs text-amber-100">
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/453a291c6_Screenshot2026-01-19015942.png" className="w-4 h-4" alt="Strength" /><span>{getTotalBonus('strBonus')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/11e84d1fb_Screenshot2026-01-19015950.png" className="w-4 h-4" alt="Ranged Str" /><span>{getTotalBonus('rangedStrBonus')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/973d3f90f_Screenshot2026-01-19020003.png" className="w-4 h-4" alt="Prayer" /><span>{getTotalBonus('prayer')}</span></div>
              <div className="flex items-center gap-2"><img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/aed2e430d_Screenshot2026-01-19020030.png" className="w-4 h-4" alt="Speed" /><span>{speed.ticks} ticks ({speed.seconds}s)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentTab;