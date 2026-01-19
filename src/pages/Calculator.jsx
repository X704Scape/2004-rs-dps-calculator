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
    combatLevel: 3,
    selectedSpell: null,
    chargeActive: false
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

      // Auto-detect combat type from equipped weapon and combat style
      const weapon = equipment.weapon;
      const weaponName = weapon?.name?.toLowerCase() || '';
      let detectedCombatType = 'melee';

      // If spell style is selected, use magic
      if (playerStats.style === 'spell') {
        detectedCombatType = 'magic';
      } else if (weapon?.attackStyles && weapon.attackStyles.length > 0) {
        const hasRanged = weapon.attackStyles.some(s => s.type === 'ranged');
        const hasMagic = weapon.attackStyles.some(s => s.type === 'magic');
        if (hasRanged) {
          detectedCombatType = 'ranged';
        } else if (hasMagic) {
          detectedCombatType = 'magic';
        }
      } else {
        // Fallback to name detection
        if (weaponName.includes('bow') || weaponName.includes('crossbow') || weaponName.includes('dart') || 
            weaponName.includes('knife') || weaponName.includes('javelin') || weaponName.includes('thrownaxe') ||
            weaponName.includes('blowpipe')) {
          detectedCombatType = 'ranged';
        } else if (weaponName.includes('staff') || weaponName.includes('wand')) {
          detectedCombatType = 'magic';
        }
      }

      // Determine which attack bonus to use based on combat type and style
      let attackBonus = 0;
      if (detectedCombatType === 'melee') {
        // Use the appropriate melee bonus based on attack style
        if (weapon?.attackType === 'stab' || playerStats.style === 'stab') {
          attackBonus = getTotalBonus('stab');
        } else if (weapon?.attackType === 'slash' || playerStats.style === 'slash') {
          attackBonus = getTotalBonus('slash');
        } else {
          attackBonus = getTotalBonus('crush');
        }
      } else if (detectedCombatType === 'ranged') {
        attackBonus = getTotalBonus('ranged');
      } else if (detectedCombatType === 'magic') {
        attackBonus = getTotalBonus('magic');
      }

      // Get attack speed in ticks
      let attackSpeedTicks = weapon?.attackRate || 4;
      
      // Check for speed overrides in weapon metadata
      if (weapon?.speedOverrides && weapon.speedOverrides.length > 0) {
        const override = weapon.speedOverrides.find(o => o.styleId === playerStats.style);
        if (override) {
          attackSpeedTicks = override.speedTicks;
        }
      } else if (detectedCombatType === 'ranged' && playerStats.style === 'rapid' && weapon) {
        // Fallback: Apply rapid style bonus for ranged
        attackSpeedTicks = Math.max(1, attackSpeedTicks - 1);
      }

      console.log('=== Sending to calculateDPS ===');
      console.log('Combat Type:', detectedCombatType);
      console.log('Ranged Level:', playerStats.ranged);
      console.log('Ranged Str Bonus from equipment:', getTotalBonus('rangedStrBonus'));
      console.log('Attack Bonus:', attackBonus);
      console.log('Attack Speed Ticks:', attackSpeedTicks);

      const dpsResponse = await base44.functions.invoke('calculateDPS', {
        combatType: detectedCombatType,
        attackLevel: playerStats.attack,
        strengthLevel: playerStats.strength,
        rangedLevel: playerStats.ranged,
        magicLevel: playerStats.magic,
        defenceLevel: playerStats.defence,
        equipmentBonus: attackBonus,
        strBonus: getTotalBonus('strBonus'),
        rangedStrBonus: getTotalBonus('rangedStrBonus'),
        magicBonus: getTotalBonus('magic'),
        prayerName: prayerMap[playerStats.prayerActive] || 'none',
        styleName: playerStats.style || 'aggressive',
        potionStr: 0,
        potionRanged: 0,
        potionAttack: 0,
        attackSpeedTicks,
        monsterHitpoints: selectedMonster.hitpoints,
        monsterAttack: selectedMonster.attack,
        monsterDefence: selectedMonster.defence,
        monsterRanged: selectedMonster.ranged,
        monsterMagic: selectedMonster.magic,
        monsterDefenceStab: selectedMonster.defenceStab,
        monsterDefenceSlash: selectedMonster.defenceSlash,
        monsterDefenceCrush: selectedMonster.defenceCrush,
        monsterDefenceRanged: selectedMonster.defenceRanged,
        monsterDefenceMagic: selectedMonster.defenceMagic,
        spellMaxHit: (playerStats.selectedSpell?.requiresCharge && playerStats.chargeActive) ? 30 : (playerStats.selectedSpell?.maxHit || 0),
        hasChaosGauntlets: false,
        isBoltSpell: false
      });

      setResults({ ...dpsResponse.data, attackSpeedTicks });
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