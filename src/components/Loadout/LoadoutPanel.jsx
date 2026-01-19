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

export default function LoadoutPanel({ loadoutName, equipment, onEquipmentChange, playerStats, onStatsChange, onCombatStyleChange, onPrayerChange, otherLoadouts, onCopyFrom }) {
  const [activeTab, setActiveTab] = useState('equipment');
  const [showCopyMenu, setShowCopyMenu] = useState(false);

  const handleCombatStyleChange = (style) => {
    onCombatStyleChange(style);
    // Auto-switch to magic tab when spell style is selected
    if (style === 'spell') {
      setActiveTab('magic');
    }
  };

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b-2 border-amber-900 p-3 flex justify-between items-center">
        <div>
          <h2 className="text-amber-600 font-bold text-sm">{loadoutName || 'Loadout'}</h2>
          <p className="text-amber-700 text-xs">Level {playerStats?.combatLevel || 3}</p>
        </div>
        {otherLoadouts && otherLoadouts.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowCopyMenu(!showCopyMenu)}
              className="bg-gray-800 hover:bg-gray-700 border border-amber-900 px-2 py-1 rounded text-xs text-amber-100"
              title="Copy from another loadout"
            >
              PL
            </button>
            {showCopyMenu && (
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border-2 border-amber-900 rounded shadow-lg z-50 min-w-[120px]">
                {otherLoadouts.map((loadout, index) => (
                  <button
                    key={loadout.id}
                    onClick={() => {
                      onCopyFrom(loadout.id);
                      setShowCopyMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-amber-100 hover:bg-gray-700 border-b border-amber-900 last:border-b-0"
                  >
                    Copy from Loadout {loadout.displayNumber || loadout.id}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
            onCombatStyleChange={handleCombatStyleChange}
            currentStyle={playerStats.style}
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
            selectedPrayer={playerStats?.prayerActive}
            onPrayerChange={onPrayerChange}
          />
        )}
        {activeTab === 'magic' && (
          <MagicSpellbookTab 
            selectedSpell={playerStats.selectedSpell}
            onSpellChange={(spell) => onStatsChange({ ...playerStats, selectedSpell: spell })}
            playerStats={playerStats}
            chargeActive={playerStats.chargeActive}
            onChargeChange={(charge) => onStatsChange({ ...playerStats, chargeActive: charge })}
          />
        )}
      </div>
    </div>
  );
}