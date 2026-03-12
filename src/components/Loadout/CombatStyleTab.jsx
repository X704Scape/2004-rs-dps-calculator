import React from 'react';
import { WEAPON_COMBAT_STYLES } from '../weaponStyles';

const DEFAULT_STYLES = [
  { id: 'accurate', name: 'Accurate', type: 'crush', bonus: '+3 Attack' },
  { id: 'aggressive', name: 'Aggressive', type: 'crush', bonus: '+3 Strength' },
  { id: 'defensive', name: 'Defensive', type: 'crush', bonus: '+3 Defence' }
];

const SPELL_STYLE = { id: 'spell', name: 'Spell', type: 'magic', bonus: 'Spell damage' };

export default function CombatStyleTab({ equipment, onCombatStyleChange, currentStyle }) {
  const selectedStyle = currentStyle || 'aggressive';
  const weapon = equipment?.weapon;

  const getAttackSpeed = () => {
    if (!weapon) return 4;
    let baseSpeed = weapon.attackRate || 4;
    if (weapon.speedOverrides?.length > 0) {
      const override = weapon.speedOverrides.find(o => o.styleId === selectedStyle);
      if (override) baseSpeed = override.speedTicks;
    }
    if (selectedStyle === 'rapid' && weapon.category &&
        (weapon.category.includes('bow') || weapon.category.includes('crossbow') ||
         weapon.category.includes('thrown') || weapon.category.includes('javelin'))) {
      baseSpeed = Math.max(1, baseSpeed - 1);
    }
    return baseSpeed;
  };

  let styles = DEFAULT_STYLES;
  if (weapon?.category && WEAPON_COMBAT_STYLES[weapon.category]) {
    styles = WEAPON_COMBAT_STYLES[weapon.category];
  } else if (weapon?.attackStyles?.length > 0) {
    styles = weapon.attackStyles.map(style => ({
      id: style.id,
      name: style.mode.charAt(0).toUpperCase() + style.mode.slice(1),
      type: style.type,
      bonus: style.id === 'rapid' ? 'Faster attacks' : ''
    }));
  }

  if (!styles.find(s => s.id === 'spell')) {
    styles = [...styles, SPELL_STYLE];
  }

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
            onClick={() => onCombatStyleChange(style.id)}
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