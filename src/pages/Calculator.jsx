import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import LoadoutPanel from '../components/Loadout/LoadoutPanel';
import MonsterSelect from '../components/Monster/MonsterSelect';
import ResultsPanel from '../components/Results/ResultsPanel';

const calculateCombatLevel = (stats) => {
  const base = 10 * (stats.defence + stats.hitpoints + Math.floor(stats.prayer / 2));
  const melee = 13 * (stats.attack + stats.strength);
  const ranged = Math.floor(13 * 1.5 * stats.ranged);
  const magic = Math.floor(13 * 1.5 * stats.magic);
  return Math.floor((base + Math.max(melee, ranged, magic)) / 40);
};

export default function Calculator() {
  const [loadouts, setLoadouts] = useState([
    {
      id: 1,
      name: 'Loadout 1',
      equipment: {},
      playerStats: {
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
      },
      results: null
    }
  ]);
  const [activeLoadoutId, setActiveLoadoutId] = useState(1);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const addLoadout = () => {
    const newId = Math.max(...loadouts.map(l => l.id)) + 1;
    setLoadouts([...loadouts, {
      id: newId,
      name: `Loadout ${newId}`,
      equipment: {},
      playerStats: {
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
      },
      results: null
    }]);
  };

  const removeLoadout = (id) => {
    if (loadouts.length > 1) {
      setLoadouts(loadouts.filter(l => l.id !== id));
      // Switch to first remaining loadout if removing active one
      if (activeLoadoutId === id) {
        const remaining = loadouts.filter(l => l.id !== id);
        setActiveLoadoutId(remaining[0]?.id || 1);
      }
    }
  };

  const updateLoadout = (id, field, value) => {
    setLoadouts(loadouts.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        // Update combat level when player stats change
        if (field === 'playerStats') {
          updated.playerStats.combatLevel = calculateCombatLevel(value);
        }
        return updated;
      }
      return l;
    }));
  };

  const copyLoadout = (toId, fromId) => {
    const fromLoadout = loadouts.find(l => l.id === fromId);
    if (fromLoadout) {
      setLoadouts(loadouts.map(l => {
        if (l.id === toId) {
          return {
            ...l,
            equipment: JSON.parse(JSON.stringify(fromLoadout.equipment)),
            playerStats: JSON.parse(JSON.stringify(fromLoadout.playerStats))
          };
        }
        return l;
      }));
    }
  };

  const calculateDPS = async (loadout) => {
    if (!selectedMonster) return null;
    
    try {
      const { equipment, playerStats } = loadout;
      // Calculate total bonuses from equipment
      const getTotalBonus = (bonusType) => {
        return Object.values(equipment).reduce((sum, item) => {
          return sum + (item[bonusType] || 0);
        }, 0);
      };

      // Check if ammo is compatible with weapon
      const isAmmoCompatible = () => {
        const weapon = equipment.weapon;
        const ammo = equipment.ammo;
        if (!weapon || !ammo) return false;

        const weaponName = weapon.name?.toLowerCase() || '';
        const weaponCategory = weapon.category?.toLowerCase() || '';
        const ammoName = ammo.name?.toLowerCase() || '';
        const ammoCategory = ammo.category?.toLowerCase() || '';

        // Bows use arrows
        if (weaponName.includes('bow') && !weaponName.includes('crossbow')) {
          return ammoCategory === 'arrows' || ammoName.includes('arrow');
        }

        // Crossbows use bolts
        if (weaponName.includes('crossbow')) {
          return ammoCategory === 'bolts' || ammoName.includes('bolt');
        }

        // Thrown weapons don't use ammo slot
        return false;
      };

      // Get ranged strength bonus (only count ammo if compatible)
      const getRangedStrBonus = () => {
        let bonus = 0;
        Object.entries(equipment).forEach(([slot, item]) => {
          if (slot === 'ammo') {
            // Only add ammo bonus if compatible with weapon
            if (isAmmoCompatible()) {
              bonus += item.rangedStrBonus || 0;
            }
          } else {
            bonus += item.rangedStrBonus || 0;
          }
        });
        return bonus;
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

      return await base44.functions.invoke('calculateDPS', {
        combatType: detectedCombatType,
        attackLevel: playerStats.boostedAttack || playerStats.attack,
        strengthLevel: playerStats.boostedStrength || playerStats.strength,
        rangedLevel: playerStats.boostedRanged || playerStats.ranged,
        magicLevel: playerStats.boostedMagic || playerStats.magic,
        defenceLevel: playerStats.boostedDefence || playerStats.defence,
        equipmentBonus: attackBonus,
        strBonus: getTotalBonus('strBonus'),
        rangedStrBonus: getRangedStrBonus(),
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
    } catch (error) {
      console.error('Calculation failed:', error);
      return null;
    }
  };

  React.useEffect(() => {
    const updateAllResults = async () => {
      if (!selectedMonster) return;
      
      setCalculating(true);
      const updatedLoadouts = await Promise.all(
        loadouts.map(async (loadout) => {
          const response = await calculateDPS(loadout);
          return {
            ...loadout,
            results: response ? { ...response.data, attackSpeedTicks: loadout.playerStats.style === 'rapid' && response.data.attackSpeedTicks ? response.data.attackSpeedTicks - 1 : response.data.attackSpeedTicks || 4 } : null
          };
        })
      );
      setLoadouts(updatedLoadouts);
      setCalculating(false);
    };

    updateAllResults();
  }, [loadouts.map(l => JSON.stringify({ eq: l.equipment, stats: l.playerStats })).join(','), selectedMonster]);

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
          {/* Left Column - Loadout with Tabs */}
          <div className="lg:col-span-1">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-3">
              {loadouts.map((loadout, index) => (
                <button
                  key={loadout.id}
                  onClick={() => setActiveLoadoutId(loadout.id)}
                  className={`px-4 py-2 rounded-t font-semibold text-sm border-2 border-b-0 relative ${
                    activeLoadoutId === loadout.id
                      ? 'bg-gray-800 border-amber-900 text-amber-600 z-10'
                      : 'bg-gray-900 border-amber-900/50 text-amber-700 hover:bg-gray-850'
                  }`}
                >
                  {index + 1}
                  {loadouts.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLoadout(loadout.id);
                      }}
                      className="ml-2 text-red-600 hover:text-red-400"
                    >
                      ×
                    </button>
                  )}
                </button>
              ))}
              <button
                onClick={addLoadout}
                className="px-3 py-2 rounded-t bg-amber-900 hover:bg-amber-800 border-2 border-amber-700 text-amber-100 font-bold text-sm"
              >
                +
              </button>
            </div>

            {/* Active Loadout */}
            {loadouts.filter(l => l.id === activeLoadoutId).map((loadout) => {
              const activeIndex = loadouts.findIndex(l => l.id === activeLoadoutId);
              const otherLoadoutsWithNumbers = loadouts
                .filter(l => l.id !== loadout.id)
                .map((l, idx) => {
                  const actualIndex = loadouts.findIndex(lo => lo.id === l.id);
                  return { ...l, displayNumber: actualIndex + 1 };
                });
              
              return (
                <LoadoutPanel
                  key={loadout.id}
                  loadoutName={loadout.name}
                  equipment={loadout.equipment}
                  onEquipmentChange={(eq) => updateLoadout(loadout.id, 'equipment', eq)}
                  playerStats={loadout.playerStats}
                  onStatsChange={(stats) => updateLoadout(loadout.id, 'playerStats', stats)}
                  onCombatStyleChange={(style) => updateLoadout(loadout.id, 'playerStats', { ...loadout.playerStats, style })}
                  onPrayerChange={(prayer) => updateLoadout(loadout.id, 'playerStats', { ...loadout.playerStats, prayerActive: prayer })}
                  otherLoadouts={otherLoadoutsWithNumbers}
                  onCopyFrom={(fromId) => copyLoadout(loadout.id, fromId)}
                />
              );
            })}
          </div>

          {/* Middle Column - Monster */}
          <div className="lg:col-span-1">
            <MonsterSelect selectedMonster={selectedMonster} onMonsterChange={setSelectedMonster} />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-1">
            <ResultsPanel loadouts={loadouts} />
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