import React from 'react';

// Map weapon categories to their combat styles based on 2004 formulas
const WEAPON_COMBAT_STYLES = {
  weapon_2h_sword: [
    { id: 'accurate', name: 'Accurate', type: 'slash', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'slash', bonus: '+3 Strength' },
    { id: 'aggressive_2', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'slash', bonus: '+3 Defence' }
  ],
  weapon_axe: [
    { id: 'accurate', name: 'Accurate', type: 'slash', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'slash', bonus: '+3 Strength' },
    { id: 'aggressive_2', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'slash', bonus: '+3 Defence' }
  ],
  weapon_blunt: [
    { id: 'accurate', name: 'Accurate', type: 'crush', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'crush', bonus: '+3 Defence' }
  ],
  weapon_pickaxe: [
    { id: 'accurate', name: 'Accurate', type: 'stab', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'stab', bonus: '+3 Strength' },
    { id: 'aggressive_2', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'stab', bonus: '+3 Defence' }
  ],
  weapon_scythe: [
    { id: 'accurate', name: 'Accurate', type: 'slash', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'stab', bonus: '+3 Strength' },
    { id: 'aggressive_2', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'slash', bonus: '+3 Defence' }
  ],
  weapon_slash: [
    { id: 'accurate', name: 'Accurate', type: 'slash', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'slash', bonus: '+3 Strength' },
    { id: 'controlled', name: 'Controlled', type: 'stab', bonus: '+1 All' },
    { id: 'defensive', name: 'Defensive', type: 'slash', bonus: '+3 Defence' }
  ],
  weapon_spear: [
    { id: 'controlled_1', name: 'Controlled', type: 'stab', bonus: '+1 All' },
    { id: 'controlled_2', name: 'Controlled', type: 'slash', bonus: '+1 All' },
    { id: 'controlled_3', name: 'Controlled', type: 'crush', bonus: '+1 All' },
    { id: 'defensive', name: 'Defensive', type: 'stab', bonus: '+3 Defence' }
  ],
  weapon_spiked: [
    { id: 'accurate', name: 'Accurate', type: 'crush', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'controlled', name: 'Controlled', type: 'stab', bonus: '+1 All' },
    { id: 'defensive', name: 'Defensive', type: 'crush', bonus: '+3 Defence' }
  ],
  weapon_stab: [
    { id: 'accurate', name: 'Accurate', type: 'stab', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'stab', bonus: '+3 Strength' },
    { id: 'aggressive_2', name: 'Aggressive', type: 'slash', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'stab', bonus: '+3 Defence' }
  ],
  weapon_bow: [
    { id: 'accurate', name: 'Accurate', type: 'ranged', bonus: '+3 Attack' },
    { id: 'rapid', name: 'Rapid', type: 'ranged', bonus: 'Faster attacks' },
    { id: 'longrange', name: 'Longrange', type: 'ranged', bonus: '+3 Defence' }
  ],
  weapon_crossbow: [
    { id: 'accurate', name: 'Accurate', type: 'ranged', bonus: '+3 Attack' },
    { id: 'rapid', name: 'Rapid', type: 'ranged', bonus: 'Faster attacks' },
    { id: 'longrange', name: 'Longrange', type: 'ranged', bonus: '+3 Defence' }
  ],
  weapon_thrown: [
    { id: 'accurate', name: 'Accurate', type: 'ranged', bonus: '+3 Attack' },
    { id: 'rapid', name: 'Rapid', type: 'ranged', bonus: 'Faster attacks' },
    { id: 'longrange', name: 'Longrange', type: 'ranged', bonus: '+3 Defence' }
  ],
  weapon_javelin: [
    { id: 'accurate', name: 'Accurate', type: 'ranged', bonus: '+3 Attack' },
    { id: 'rapid', name: 'Rapid', type: 'ranged', bonus: 'Faster attacks' },
    { id: 'longrange', name: 'Longrange', type: 'ranged', bonus: '+3 Defence' }
  ],
  weapon_unarmed: [
    { id: 'accurate', name: 'Accurate', type: 'crush', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'crush', bonus: '+3 Defence' }
  ],
  weapon_staff: [
    { id: 'accurate', name: 'Accurate', type: 'crush', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'crush', bonus: '+3 Defence' },
    { id: 'spell', name: 'Spell', type: 'magic', bonus: 'Spell damage' }
  ],
  weapon_claws: [
    { id: 'accurate', name: 'Accurate', type: 'slash', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'slash', bonus: '+3 Strength' },
    { id: 'controlled', name: 'Controlled', type: 'stab', bonus: '+1 All' },
    { id: 'defensive', name: 'Defensive', type: 'slash', bonus: '+3 Defence' }
  ]
};

const DEFAULT_STYLES = [
  { id: 'accurate', name: 'Accurate', type: 'crush', bonus: '+3 Attack' },
  { id: 'aggressive', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
  { id: 'defensive', name: 'Defensive', type: 'crush', bonus: '+3 Defence' }
];

export default function CombatStyleTab({ equipment, onCombatStyleChange, currentStyle }) {
  const selectedStyle = currentStyle || 'aggressive';

  // Detect weapon type from equipment
  const weapon = equipment?.weapon;
  
  // Calculate attack speed for selected style
  const getAttackSpeed = () => {
    if (!weapon) return 4;
    
    // Use attackRate from weapon data (from config)
    let baseSpeed = weapon.attackRate || 4;
    
    // Check for metadata overrides
    if (weapon.speedOverrides && weapon.speedOverrides.length > 0) {
      const override = weapon.speedOverrides.find(o => o.styleId === selectedStyle);
      if (override) {
        baseSpeed = override.speedTicks;
      }
    }
    
    // Apply rapid style bonus for ranged
    if (selectedStyle === 'rapid' && weapon.category && 
        (weapon.category.includes('bow') || weapon.category.includes('crossbow') || 
         weapon.category.includes('thrown') || weapon.category.includes('javelin'))) {
      baseSpeed = Math.max(1, baseSpeed - 1);
    }
    
    return baseSpeed;
  };
  
  // Use weapon category to determine styles
  let styles = DEFAULT_STYLES;
  if (weapon?.category && WEAPON_COMBAT_STYLES[weapon.category]) {
    styles = WEAPON_COMBAT_STYLES[weapon.category];
  } else if (weapon?.attackStyles && weapon.attackStyles.length > 0) {
    // Fallback to metadata if available
    styles = weapon.attackStyles.map(style => ({
      id: style.id,
      name: style.mode.charAt(0).toUpperCase() + style.mode.slice(1),
      type: style.type,
      bonus: style.id === 'rapid' ? 'Faster attacks' : ''
    }));
  }

  const handleStyleChange = (styleId) => {
    onCombatStyleChange(styleId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-amber-600 font-bold text-sm">
          Combat Style {!weapon && <span className="text-amber-700 text-xs">(Fists)</span>}
        </h3>
        <span className="text-amber-500 text-xs font-semibold">{getAttackSpeed()} ticks ({(getAttackSpeed() * 0.6).toFixed(1)}s)</span>
      </div>
      <div className="space-y-2">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => handleStyleChange(style.id)}
            className={`w-full text-left p-3 rounded border-2 transition ${
              selectedStyle === style.id
                ? 'bg-amber-900 border-amber-700'
                : 'bg-gray-900 border-gray-700 hover:border-amber-900'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-amber-100 font-semibold text-sm">{style.name}</p>
                <p className="text-amber-700 text-xs">{style.type}</p>
              </div>
              <p className="text-amber-500 text-xs">{style.bonus}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}