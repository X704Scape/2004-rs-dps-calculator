export const WEAPON_COMBAT_STYLES = {
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

/**
 * Resolves the attack type (stab/slash/crush/ranged/magic) for a given weapon and style ID.
 * Uses the category-based WEAPON_COMBAT_STYLES as the authoritative source,
 * falling back to weapon metadata attackStyles.
 */
export function resolveAttackType(weapon, styleId) {
  if (!weapon) return 'crush';

  // First try category-based styles (authoritative - handles aggressive_2 etc.)
  if (weapon.category && WEAPON_COMBAT_STYLES[weapon.category]) {
    const categoryStyle = WEAPON_COMBAT_STYLES[weapon.category].find(s => s.id === styleId);
    if (categoryStyle) return categoryStyle.type;
  }

  // Fallback to weapon metadata attackStyles
  if (weapon.attackStyles) {
    const metaStyle = weapon.attackStyles.find(s => s.id === styleId);
    if (metaStyle) return metaStyle.type;
  }

  return 'stab'; // last resort
}