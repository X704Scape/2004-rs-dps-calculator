import React, { useState } from 'react';
import { Swords, User, Shield, Sparkles, BookOpen } from 'lucide-react';
import CombatStyleTab from './CombatStyleTab';
import PlayerStatsTab from './PlayerStatsTab';
import EquipmentTab from './EquipmentTab';
import PrayerTab from './PrayerTab';
import MagicSpellbookTab from './MagicSpellbookTab';

const TABS = [
  { id: 'combat', icon: Swords, label: 'Combat' },
  { id: 'stats', icon: User, label: 'Stats' },
  { id: 'equipment', icon: Shield, label: 'Equipment' },
  { id: 'prayer', icon: Sparkles, label: 'Prayer' },
  { id: 'magic', icon: BookOpen, label: 'Magic' }
];

export default function LoadoutPanel({ equipment, onEquipmentChange, playerStats, onStatsChange, onCombatStyleChange, onPrayerChange }) {
  const [activeTab, setActiveTab] = useState('equipment');

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b-2 border-amber-900 p-3">
        <h2 className="text-amber-600 font-bold text-sm">Loadout 1</h2>
        <p className="text-amber-700 text-xs">Level {playerStats?.combatLevel || 3}</p>
      </div>

      {/* Tab Buttons */}
      <div className="flex border-b-2 border-amber-900 bg-gray-900">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-3 border-r border-amber-900 last:border-r-0 hover:bg-gray-800 transition ${
                activeTab === tab.id ? 'bg-gray-700' : ''
              }`}
              title={tab.label}
            >
              <Icon size={20} className={activeTab === tab.id ? 'text-amber-500' : 'text-amber-700'} />
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'combat' && (
          <CombatStyleTab 
            equipment={equipment}
            onCombatStyleChange={onCombatStyleChange}
          />
        )}
        {activeTab === 'stats' && (
          <PlayerStatsTab 
            stats={playerStats}
            onStatsChange={onStatsChange}
          />
        )}
        {activeTab === 'equipment' && (
          <EquipmentTab 
            equipment={equipment}
            onEquipmentChange={onEquipmentChange}
          />
        )}
        {activeTab === 'prayer' && (
          <PrayerTab 
            selectedPrayer={playerStats?.prayer}
            onPrayerChange={onPrayerChange}
          />
        )}
        {activeTab === 'magic' && (
          <MagicSpellbookTab />
        )}
      </div>
    </div>
  );
}