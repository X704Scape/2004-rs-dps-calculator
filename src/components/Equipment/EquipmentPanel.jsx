import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import EquipmentSlot from './EquipmentSlot';

const EQUIPMENT_SLOTS = ['head', 'neck', 'cape', 'weapon', 'body', 'shield', 'legs', 'hands', 'feet', 'ring', 'ammo'];

export default function EquipmentPanel({ onEquipmentChange }) {
  const [equipment, setEquipment] = React.useState({});
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await base44.functions.invoke('fetchGameData', { type: 'items' });
        setItems(response.data.items || []);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const handleSelectItem = (slot, item) => {
    const newEquipment = { ...equipment, [slot]: item };
    setEquipment(newEquipment);
    onEquipmentChange(newEquipment);
  };

  const handleRemoveItem = (slot) => {
    const newEquipment = { ...equipment };
    delete newEquipment[slot];
    setEquipment(newEquipment);
    onEquipmentChange(newEquipment);
  };

  const getTotalBonus = (bonusType) => {
    return Object.values(equipment).reduce((sum, item) => {
      return sum + (item[bonusType] || 0);
    }, 0);
  };

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded p-4">
      <h2 className="text-amber-600 font-bold text-lg mb-4 border-b border-amber-900 pb-2">Equipment</h2>
      
      {/* Equipment Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {EQUIPMENT_SLOTS.map((slot) => (
          <EquipmentSlot
            key={slot}
            slot={slot}
            item={equipment[slot]}
            items={items}
            onSelectItem={handleSelectItem}
            onRemoveItem={handleRemoveItem}
            loading={loading}
          />
        ))}
      </div>

      {/* Bonuses Summary */}
      <div className="bg-gray-900 rounded p-3 border border-amber-900">
        <h3 className="text-amber-600 font-bold text-xs mb-2">Bonuses</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-amber-100">
          <div>Stab: {getTotalBonus('stab')}</div>
          <div>Slash: {getTotalBonus('slash')}</div>
          <div>Crush: {getTotalBonus('crush')}</div>
          <div>Str: {getTotalBonus('strBonus')}</div>
          <div>Ranged: {getTotalBonus('ranged')}</div>
          <div>Rng Str: {getTotalBonus('rangedStrBonus')}</div>
          <div>Magic: {getTotalBonus('magic')}</div>
          <div>Prayer: {getTotalBonus('prayer')}</div>
        </div>
      </div>
    </div>
  );
}