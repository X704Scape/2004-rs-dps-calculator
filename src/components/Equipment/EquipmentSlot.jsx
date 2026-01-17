import React from 'react';
import { Search, X } from 'lucide-react';

const SLOT_LABELS = {
  head: 'Head',
  neck: 'Neck',
  cape: 'Cape',
  weapon: 'Weapon',
  body: 'Body',
  shield: 'Shield',
  legs: 'Legs',
  hands: 'Hands',
  feet: 'Feet',
  ring: 'Ring',
  ammo: 'Ammo'
};

const SLOT_COLORS = {
  head: 'bg-red-900',
  neck: 'bg-blue-900',
  cape: 'bg-purple-900',
  weapon: 'bg-orange-900',
  body: 'bg-yellow-900',
  shield: 'bg-green-900',
  legs: 'bg-teal-900',
  hands: 'bg-pink-900',
  feet: 'bg-cyan-900',
  ring: 'bg-amber-900',
  ammo: 'bg-gray-900'
};

export default function EquipmentSlot({ slot, item, items = [], onSelectItem, onRemoveItem, loading = false }) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const slotItems = items.filter(i => i.slot === slot && i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative">
      <div className="mb-2">
        <label className="text-xs font-bold text-amber-700 uppercase">{SLOT_LABELS[slot]}</label>
      </div>
      
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className={`${SLOT_COLORS[slot]} border-2 border-amber-900 rounded p-2 cursor-pointer hover:brightness-110 transition min-h-12 flex items-center justify-between`}
      >
        <span className="text-xs text-amber-100 font-semibold truncate">
          {item ? item.name : 'Empty'}
        </span>
        {item && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveItem(slot);
              setShowDropdown(false);
            }}
            className="text-red-300 hover:text-red-100"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-48 mt-1 bg-gray-800 border-2 border-amber-900 rounded shadow-lg">
          <div className="p-2 border-b border-amber-900">
            <div className="flex items-center bg-gray-900 rounded px-2">
              <Search size={14} className="text-amber-700" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-amber-100 outline-none px-2 py-1"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-2 text-xs text-amber-100 text-center">Loading...</div>
            ) : slotItems.length === 0 ? (
              <div className="p-2 text-xs text-amber-100 text-center">No items found</div>
            ) : (
              slotItems.map((slotItem) => (
                <button
                  key={slotItem.id}
                  onClick={() => {
                    onSelectItem(slot, slotItem);
                    setShowDropdown(false);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-900 transition"
                >
                  {slotItem.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}