import React from 'react';

// Weapon-based combat styles
const WEAPON_STYLES = {
  fists: [
    { id: 'accurate', name: 'Accurate', type: 'crush', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'crush', bonus: '+3 Defence' }
  ],
  default: [
    { id: 'accurate', name: 'Accurate', type: 'stab', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'slash', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'stab', bonus: '+3 Defence' },
    { id: 'controlled', name: 'Controlled', type: 'stab', bonus: '+1 All' }
  ],
  sword: [
    { id: 'accurate', name: 'Accurate', type: 'stab', bonus: '+3 Attack' },
    { id: 'aggressive', name: 'Aggressive', type: 'slash', bonus: '+3 Strength' },
    { id: 'defensive', name: 'Defensive', type: 'slash', bonus: '+3 Defence' },
    { id: 'controlled', name: 'Controlled', type: 'stab', bonus: '+1 All' }
  ],
  ranged: [
    { id: 'accurate', name: 'Accurate', type: 'ranged', bonus: '+3 Attack' },
    { id: 'rapid', name: 'Rapid', type: 'ranged', bonus: 'Faster attacks' },
    { id: 'longrange', name: 'Longrange', type: 'ranged', bonus: '+3 Defence' }
  ]
};

export default function CombatStyleTab({ equipment, onCombatStyleChange }) {
  const [selectedStyle, setSelectedStyle] = React.useState('aggressive');

  // Detect weapon type from equipment
  const weapon = equipment?.weapon;
  
  // Use weapon metadata attack styles if available
  let styles = WEAPON_STYLES.fists;
  if (weapon?.attackStyles && weapon.attackStyles.length > 0) {
    // Map metadata styles to display format
    styles = weapon.attackStyles.map(style => ({
      id: style.id,
      name: style.mode.charAt(0).toUpperCase() + style.mode.slice(1),
      type: style.type,
      bonus: style.id === 'rapid' ? 'Faster attacks' : ''
    }));
  } else if (weapon) {
    const weaponName = weapon?.name?.toLowerCase() || '';
    if (weaponName.includes('bow') || weaponName.includes('crossbow')) {
      styles = WEAPON_STYLES.ranged;
    } else {
      styles = WEAPON_STYLES.default;
    }
  }

  const handleStyleChange = (styleId) => {
    setSelectedStyle(styleId);
    onCombatStyleChange(styleId);
  };

  return (
    <div>
      <h3 className="text-amber-600 font-bold text-sm mb-3">
        Combat Style {!weapon && <span className="text-amber-700 text-xs">(Fists)</span>}
      </h3>
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