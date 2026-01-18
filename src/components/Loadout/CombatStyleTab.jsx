import React from 'react';
import { WEAPON_COMBAT_STYLES, DEFAULT_STYLES } from '../../utils/weaponCombatStyles';

export default function CombatStyleTab({ equipment, onCombatStyleChange }) {
  const [selectedStyle, setSelectedStyle] = React.useState('aggressive');

  // Detect weapon type from equipment
  const weapon = equipment?.weapon;
  
  // Calculate attack speed for selected style
  const getAttackSpeed = () => {
    if (!weapon) return null;
    
    let baseSpeed = weapon.speedTicks || 4;
    if (weapon.speedOverrides && weapon.speedOverrides.length > 0) {
      const override = weapon.speedOverrides.find(o => o.styleId === selectedStyle);
      if (override) {
        baseSpeed = override.speedTicks;
      }
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
    setSelectedStyle(styleId);
    onCombatStyleChange(styleId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-amber-600 font-bold text-sm">
          Combat Style {!weapon && <span className="text-amber-700 text-xs">(Fists)</span>}
        </h3>
        {getAttackSpeed() && (
          <span className="text-amber-500 text-xs font-semibold">{getAttackSpeed()} ticks ({(getAttackSpeed() * 0.6).toFixed(2)}s)</span>
        )}
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