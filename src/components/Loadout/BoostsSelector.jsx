import React from 'react';
import { cn } from '@/lib/utils';

const BOOSTS = [
  {
    name: "Attack Potion",
    type: "combat",
    skills: ["attack"],
    priority: 1,
    formula: (level) => Math.floor(level * 0.1) + 3
  },
  {
    name: "Super Attack",
    type: "combat",
    skills: ["attack"],
    priority: 2,
    formula: (level) => Math.floor(level * 0.15) + 5
  },
  {
    name: "Strength Potion",
    type: "combat",
    skills: ["strength"],
    priority: 1,
    formula: (level) => Math.floor(level * 0.1) + 3
  },
  {
    name: "Super Strength",
    type: "combat",
    skills: ["strength"],
    priority: 2,
    formula: (level) => Math.floor(level * 0.15) + 5
  },
  {
    name: "Defence Potion",
    type: "combat",
    skills: ["defence"],
    priority: 1,
    formula: (level) => Math.floor(level * 0.1) + 3
  },
  {
    name: "Super Defence",
    type: "combat",
    skills: ["defence"],
    priority: 2,
    formula: (level) => Math.floor(level * 0.15) + 5
  },
  {
    name: "Ranging Potion",
    type: "combat",
    skills: ["ranged"],
    priority: 1,
    formula: (level) => Math.floor(level * 0.1) + 4
  },
  {
    name: "Magic Potion",
    type: "combat",
    skills: ["magic"],
    priority: 1,
    formula: (level) => 4
  },
  {
    name: "Saradomin Brew",
    type: "brew",
    skills: ["defence"],
    priority: 3,
    formula: (level) => Math.floor(level * 0.2) + 2,
    drains: {
      attack: (level) => Math.floor(level * 0.1),
      strength: (level) => Math.floor(level * 0.1),
      magic: (level) => Math.floor(level * 0.1),
      ranged: (level) => Math.floor(level * 0.1)
    }
  },
  {
    name: "Zamorak Brew",
    type: "brew",
    skills: ["attack", "strength"],
    priority: 3,
    formula: (level, skill) => {
      if (skill === "attack") return Math.floor(level * 0.2) + 2;
      if (skill === "strength") return Math.floor(level * 0.12) + 2;
      return 0;
    },
    drains: {
      defence: (level) => Math.floor(level * 0.1)
    }
  },
  {
    name: "Dragon Battleaxe Special",
    type: "special",
    skills: ["strength"],
    priority: 4,
    formula: (level, skill, allLevels) => {
      if (skill === "strength") {
        const drainAttack = Math.floor(allLevels.attack * 0.1);
        const drainDefence = Math.floor(allLevels.defence * 0.1);
        const drainRanged = Math.floor(allLevels.ranged * 0.1);
        const drainMagic = Math.floor(allLevels.magic * 0.1);
        return Math.floor(10 + 0.25 * (drainAttack + drainDefence + drainRanged + drainMagic));
      }
      return 0;
    },
    drains: {
      attack: (level) => Math.floor(level * 0.1),
      defence: (level) => Math.floor(level * 0.1),
      ranged: (level) => Math.floor(level * 0.1),
      magic: (level) => Math.floor(level * 0.1)
    }
  },
  {
    name: "Dragon Battleaxe + Restore",
    type: "special",
    skills: ["strength"],
    priority: 5,
    formula: (level, skill, allLevels) => {
      if (skill === "strength") {
        const drainAttack = Math.floor(allLevels.attack * 0.1);
        const drainDefence = Math.floor(allLevels.defence * 0.1);
        const drainRanged = Math.floor(allLevels.ranged * 0.1);
        const drainMagic = Math.floor(allLevels.magic * 0.1);
        return Math.floor(10 + 0.25 * (drainAttack + drainDefence + drainRanged + drainMagic));
      }
      return 0;
    },
    restores: {
      attack: (level, drained) => Math.min(Math.floor(level * 0.3) + 10, drained),
      defence: (level, drained) => Math.min(Math.floor(level * 0.3) + 10, drained),
      ranged: (level, drained) => Math.min(Math.floor(level * 0.3) + 10, drained),
      magic: (level, drained) => Math.min(Math.floor(level * 0.3) + 10, drained)
    }
  }
];

export default function BoostsSelector({ selectedBoosts, onBoostsChange, skills }) {
  const handleToggleBoost = (boost) => {
    const isSelected = selectedBoosts.some(b => b.name === boost.name);
    
    if (isSelected) {
      // Remove this boost
      onBoostsChange(selectedBoosts.filter(b => b.name !== boost.name));
    } else {
      // Check for conflicts with same skill type
      const conflictingBoosts = selectedBoosts.filter(b => 
        b.skills.some(skill => boost.skills.includes(skill)) && b.type === boost.type
      );
      
      if (conflictingBoosts.length > 0) {
        // Replace with higher priority boost
        const shouldReplace = conflictingBoosts.every(cb => boost.priority > cb.priority);
        if (shouldReplace) {
          onBoostsChange([
            ...selectedBoosts.filter(b => !conflictingBoosts.includes(b)),
            boost
          ]);
        }
      } else {
        // Add the boost
        onBoostsChange([...selectedBoosts, boost]);
      }
    }
  };

  const getBoostDescription = (boost) => {
    const relevantSkills = boost.skills.filter(skill => skills[skill] !== undefined);
    if (relevantSkills.length === 0) return "";
    
    const boostValues = relevantSkills.map(skill => {
      const baseLevel = skills[skill];
      const boostAmount = typeof boost.formula === 'function' 
        ? boost.formula(baseLevel, skill, skills)
        : 0;
      return `${skill}: +${boostAmount}`;
    });
    
    let description = boostValues.join(", ");
    
    if (boost.drains) {
      const drainDesc = Object.keys(boost.drains)
        .filter(skill => skills[skill] !== undefined)
        .map(skill => {
          const drainAmount = boost.drains[skill](skills[skill]);
          return `${skill}: -${drainAmount}`;
        })
        .join(", ");
      if (drainDesc) description += ` | ${drainDesc}`;
    }
    
    if (boost.restores) {
      const restoreDesc = Object.keys(boost.restores)
        .filter(skill => skills[skill] !== undefined)
        .map(skill => {
          const drainAmount = boost.drains?.[skill]?.(skills[skill]) || 0;
          const restoreAmount = boost.restores[skill](skills[skill], drainAmount);
          return `${skill}: +${restoreAmount}`;
        })
        .join(", ");
      if (restoreDesc) description += ` | Restore: ${restoreDesc}`;
    }
    
    return description;
  };

  return (
    <div className="space-y-2">
      <h4 className="text-amber-700 text-sm font-semibold mb-3">Boosts</h4>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {BOOSTS.map((boost) => {
          const isSelected = selectedBoosts.some(b => b.name === boost.name);
          return (
            <button
              key={boost.name}
              onClick={() => handleToggleBoost(boost)}
              className={cn(
                "w-full p-3 rounded border-2 transition-all text-left",
                isSelected
                  ? "bg-amber-900 border-amber-600"
                  : "bg-gray-800 border-gray-600 hover:border-gray-500"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-amber-200 font-semibold text-sm">{boost.name}</div>
                  <div className="text-gray-400 text-xs">
                    {getBoostDescription(boost)}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">
                    ✓
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { BOOSTS };