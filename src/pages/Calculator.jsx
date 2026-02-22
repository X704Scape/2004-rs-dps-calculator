import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import LoadoutPanel from '../components/Loadout/LoadoutPanel';
import MonsterSelect from '../components/Monster/MonsterSelect';
import ResultsPanel from '../components/Results/ResultsPanel';
import KillSimulatorGraph from '../components/Results/KillSimulatorGraph';

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
  const [npcCount, setNpcCount] = useState(10);

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

  const calculateDPS = async (loadout, targetLoadout = null) => {
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

      // No prayer mapping needed - pass prayers directly

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
      let weaponAttackType = 'stab'; // default
      if (detectedCombatType === 'melee') {
        // Find the active style from weapon's attackStyles
        const activeStyle = weapon?.attackStyles?.find(s => s.id === playerStats.style);
        if (activeStyle) {
          weaponAttackType = activeStyle.type; // 'stab', 'slash', or 'crush'
          attackBonus = getTotalBonus(weaponAttackType);
        } else {
          // Fallback to stab if no style found
          attackBonus = getTotalBonus('stab');
          weaponAttackType = 'stab';
        }
      } else if (detectedCombatType === 'ranged') {
        attackBonus = getTotalBonus('ranged');
      } else if (detectedCombatType === 'magic') {
        attackBonus = getTotalBonus('magic');
      }

      // Get attack speed in ticks
      let attackSpeedTicks = weapon?.attackRate || 4;
      
      // Apply rapid style bonus for ranged (-1 tick)
      if (detectedCombatType === 'ranged' && playerStats.style === 'rapid' && weapon) {
        attackSpeedTicks = Math.max(1, attackSpeedTicks - 1);
      }

      // PVP Mode: Use target loadout's defense stats
      let targetStats = {
        hitpoints: selectedMonster.hitpoints,
        defence: selectedMonster.defence,
        defenceStab: selectedMonster.defenceStab,
        defenceSlash: selectedMonster.defenceSlash,
        defenceCrush: selectedMonster.defenceCrush,
        defenceRanged: selectedMonster.defenceRanged,
        defenceMagic: selectedMonster.defenceMagic
      };

      if (targetLoadout) {
        const getTargetDefBonus = (bonusType) => {
          return Object.values(targetLoadout.equipment).reduce((sum, item) => {
            return sum + (item[bonusType] || 0);
          }, 0);
        };

        targetStats = {
          hitpoints: targetLoadout.playerStats.hitpoints,
          defence: targetLoadout.playerStats.defence,
          defenceStab: getTargetDefBonus('defStab'),
          defenceSlash: getTargetDefBonus('defSlash'),
          defenceCrush: getTargetDefBonus('defCrush'),
          defenceRanged: getTargetDefBonus('defRanged'),
          defenceMagic: getTargetDefBonus('defMagic')
        };

        console.log('=== PVP Mode Target Stats ===');
        console.log('Target HP:', targetStats.hitpoints);
        console.log('Target Defence Level:', targetStats.defence);
        console.log('Target Defence Bonuses:', {
          stab: targetStats.defenceStab,
          slash: targetStats.defenceSlash,
          crush: targetStats.defenceCrush,
          ranged: targetStats.defenceRanged,
          magic: targetStats.defenceMagic
        });
      }

      console.log('=== Sending to calculateDPS ===');
      console.log('Combat Type:', detectedCombatType);
      console.log('Attack Level:', playerStats.attack);
      console.log('Strength Level:', playerStats.strength);
      console.log('Ranged Level:', playerStats.ranged);
      console.log('Magic Level:', playerStats.magic);
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
        attackPrayer: playerStats.prayerActive?.attack || 'none',
        strengthPrayer: playerStats.prayerActive?.strength || 'none',
        styleName: playerStats.style || 'aggressive',
        weaponAttackType,
        potionStr: 0,
        potionRanged: 0,
        potionAttack: 0,
        attackSpeedTicks,
        monsterHitpoints: targetStats.hitpoints,
        monsterAttack: selectedMonster.attack,
        monsterDefence: targetStats.defence,
        monsterRanged: selectedMonster.ranged,
        monsterMagic: selectedMonster.magic,
        monsterDefenceStab: targetStats.defenceStab,
        monsterDefenceSlash: targetStats.defenceSlash,
        monsterDefenceCrush: targetStats.defenceCrush,
        monsterDefenceRanged: targetStats.defenceRanged,
        monsterDefenceMagic: targetStats.defenceMagic,
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
    if (!selectedMonster) return;

    const updateAllResults = async () => {
      setCalculating(true);

      try {
        // PVP Mode: Calculate both directions
        if (selectedMonster.id === 'pvp' && loadouts.length >= 2) {
          const loadout1 = loadouts[0];
          const loadout2 = loadouts[1];

          const [response1, response2] = await Promise.all([
            calculateDPS(loadout1, loadout2),
            calculateDPS(loadout2, loadout1)
          ]);

          setLoadouts(prev => prev.map((loadout, idx) => ({
            ...loadout,
            results: idx === 0 ? (response1?.data || null) : idx === 1 ? (response2?.data || null) : null
          })));
        } else {
          // Normal PVM mode
          const responses = await Promise.all(loadouts.map(loadout => calculateDPS(loadout)));
          setLoadouts(prev => prev.map((loadout, idx) => ({
            ...loadout,
            results: responses[idx]?.data || null
          })));
        }
      } finally {
        setCalculating(false);
      }
    };

    const timer = setTimeout(updateAllResults, 400);
    return () => clearTimeout(timer);
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
          <div className="lg:col-span-1 flex flex-col gap-6">
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
            <ResultsPanel loadouts={loadouts} selectedMonster={selectedMonster} npcCount={npcCount} onNpcCountChange={setNpcCount} />
          </div>
        </div>

        {/* Bottom Row - Graph full width */}
        {selectedMonster && selectedMonster.id !== 'pvp' && loadouts.some(l => l.results) && (
          <div className="mt-6">
            <KillSimulatorGraph loadouts={loadouts} selectedMonster={selectedMonster} npcCount={npcCount} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 mt-12 border-t border-amber-900">
        <p className="text-amber-700 text-xs">2004 RuneScape DPS Calculator • Data from LostHQ</p>
        <p className="text-amber-800 text-xs mt-1">All formulas and data are pulled directly from the 2004 Lost City project. Credit to the LC Development team.</p>
      </div>
    </div>
  );
}