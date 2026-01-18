import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import LoadoutPanel from '../components/Loadout/LoadoutPanel';
import MonsterSelect from '../components/Monster/MonsterSelect';
import ResultsPanel from '../components/Results/ResultsPanel';

export default function Calculator() {
  const [equipment, setEquipment] = useState({});
  const [playerStats, setPlayerStats] = useState({
    hitpoints: 10,
    attack: 1,
    strength: 1,
    defence: 1,
    ranged: 1,
    prayer: 1,
    magic: 1,
    combatType: 'melee',
    prayerActive: 'none',
    style: 'aggressive',
    combatLevel: 3
  });
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const calculateDPS = async () => {
    if (!selectedMonster) return;
    
    setCalculating(true);
    try {
      // Calculate total bonuses from equipment
      const getTotalBonus = (bonusType) => {
        return Object.values(equipment).reduce((sum, item) => {
          return sum + (item[bonusType] || 0);
        }, 0);
      };

      const prayerMap = {
        none: 'none',
        burst_of_strength: 'burst_of_strength',
        superhuman_strength: 'superhuman_strength',
        ultimate_strength: 'ultimate_strength'
      };

      // Determine which attack bonus to use based on combat type and style
      let attackBonus = 0;
      if (playerStats.combatType === 'melee') {
        // Use the appropriate melee bonus based on attack style
        const weapon = equipment.weapon;
        if (weapon?.attackType === 'stab' || playerStats.style === 'stab') {
          attackBonus = getTotalBonus('stab');
        } else if (weapon?.attackType === 'slash' || playerStats.style === 'slash') {
          attackBonus = getTotalBonus('slash');
        } else {
          attackBonus = getTotalBonus('crush');
        }
      } else if (playerStats.combatType === 'ranged') {
        attackBonus = getTotalBonus('ranged');
      } else if (playerStats.combatType === 'magic') {
        attackBonus = getTotalBonus('magic');
      }

      console.log('=== Sending to calculateDPS ===');
      console.log('Combat Type:', playerStats.combatType);
      console.log('Ranged Level:', playerStats.ranged);
      console.log('Ranged Str Bonus from equipment:', getTotalBonus('rangedStrBonus'));
      console.log('Attack Bonus:', attackBonus);

      const dpsResponse = await base44.functions.invoke('calculateDPS', {
        combatType: playerStats.combatType,
        attackLevel: playerStats.attack,
        strengthLevel: playerStats.strength,
        rangedLevel: playerStats.ranged,
        magicLevel: playerStats.magic,
        defenceLevel: playerStats.defence,
        equipmentBonus: attackBonus,
        strBonus: getTotalBonus('strBonus'),
        rangedStrBonus: getTotalBonus('rangedStrBonus'),
        prayerName: prayerMap[playerStats.prayerActive] || 'none',
        styleName: playerStats.style || 'aggressive',
        potionStr: 0,
        potionRanged: 0,
        potionAttack: 0,
        monsterHitpoints: selectedMonster.hitpoints,
        monsterAttack: selectedMonster.attack,
        monsterDefence: selectedMonster.defence,
        monsterRanged: selectedMonster.ranged,
        monsterMagic: selectedMonster.magic,
        spellMaxHit: 0,
        hasChaosGauntlets: false,
        isBoltSpell: false
      });

      setResults(dpsResponse.data);
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleCombatStyleChange = (style) => {
    setPlayerStats({ ...playerStats, style });
  };

  const handlePrayerChange = (prayer) => {
    setPlayerStats({ ...playerStats, prayerActive: prayer });
  };

  React.useEffect(() => {
    calculateDPS();
  }, [equipment, playerStats, selectedMonster]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Header */}
      <div className="bg-gray-950 border-b-2 border-amber-900 py-4 px-6">
        <h1 className="text-3xl font-bold text-amber-600">2004 RuneScape DPS Calculator</h1>
        <p className="text-amber-100 text-sm mt-1">Authentic 2004 formulas</p>
      </div>

      {/* Main Layout */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Loadout */}
          <div className="lg:col-span-1">
            <LoadoutPanel 
              equipment={equipment}
              onEquipmentChange={setEquipment}
              playerStats={playerStats}
              onStatsChange={setPlayerStats}
              onCombatStyleChange={handleCombatStyleChange}
              onPrayerChange={handlePrayerChange}
            />
          </div>

          {/* Middle Column - Monster */}
          <div className="lg:col-span-1">
            <MonsterSelect selectedMonster={selectedMonster} onMonsterChange={setSelectedMonster} />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-1">
            <ResultsPanel results={results} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 mt-12 border-t border-amber-900">
        <p className="text-amber-700 text-xs">2004 RuneScape DPS Calculator • Data from LostHQ</p>
      </div>
    </div>
  );
}