import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Prayer bonus values (integer percentage) matching source check_*_prayer procs
const PRAYER_ATK_BONUS = {
  none: 100, clarity_of_thought: 105, improved_reflexes: 110, incredible_reflexes: 115
};
const PRAYER_STR_BONUS = {
  none: 100, burst_of_strength: 105, superhuman_strength: 110, ultimate_strength: 115
};

// combat_effective_stat: floor(level * prayerBonus / 100)
function effectiveStat(level, prayerBonus) {
  return Math.floor(level * Math.max(100, prayerBonus) / 100);
}
// combat_stat: effectiveLevel * (bonus + 64)
function combatStatRoll(effectiveLevel, bonus) {
  return effectiveLevel * (bonus + 64);
}
// combat_maxhit: floor((combat_stat + 320) / 640)
function combatMaxHit(stat) {
  return Math.floor((stat + 320) / 640);
}

// Melee: style bonus applies to BOTH effective_attack (accuracy) AND effective_strength (max hit)
// Source: combat_get_damagestyle_bonuses — aggressive=(0,3,0,0), controlled=(1,1,1,0), accurate=(3,0,0,0)
function getStrengthStyleBonus(style) {
  if (style === 'aggressive' || style.startsWith('aggressive')) return 3;
  if (style.startsWith('controlled')) return 1;
  return 0;
}
function getAttackStyleBonus(style) {
  if (style === 'accurate') return 3;
  if (style.startsWith('controlled')) return 1;
  return 0;
}
function getEffectiveStr(lvl, strPrayerBonus, style) {
  return effectiveStat(lvl, strPrayerBonus) + 8 + getStrengthStyleBonus(style);
}
function getEffectiveAtk(lvl, atkPrayerBonus, style) {
  return effectiveStat(lvl, atkPrayerBonus) + 8 + getAttackStyleBonus(style);
}
// Ranged: accurate=+3, rapid=+0, longrange=+0 (longrange only grants +3 defence, not ranged)
// Same effective_ranged used for both attack roll and max hit
function getEffectiveRanged(lvl, style) {
  const styleBonus = style === 'accurate' ? 3 : 0;
  return effectiveStat(lvl, 100) + 8 + styleBonus;
}
function getAccuracy(atkRoll, defRoll) {
  if (atkRoll > defRoll) return 1 - (defRoll + 2) / (2 * (atkRoll + 1));
  return atkRoll / (2 * (defRoll + 1));
}
function getMeleeMaxHit(effStr, strBonus) {
  return combatMaxHit(combatStatRoll(effStr, strBonus));
}
function getRangedMaxHit(effRng, rngStrBonus) {
  return combatMaxHit(combatStatRoll(effRng, rngStrBonus));
}

function calcDPS({ combatType, playerStats, equipment, monster }) {
  const { attack, strength, ranged, magic, prayerActive, style } = playerStats;
  const atkPrayerBonus = PRAYER_ATK_BONUS[prayerActive?.attack || 'none'] || 100;
  const strPrayerBonus = PRAYER_STR_BONUS[prayerActive?.strength || 'none'] || 100;

  const getBonus = (key) => Object.values(equipment).reduce((s, i) => s + (i?.[key] || 0), 0);

  let maxHit = 0, attackRoll = 0, npcDefRoll = 0;

  if (combatType === 'melee') {
    const effStr = getEffectiveStr(strength, strPrayerBonus, style);
    const effAtk = getEffectiveAtk(attack, atkPrayerBonus, style);
    let attackType = 'slash';
    const cat = equipment.weapon?.category || '';
    if (cat.includes('stab') || cat === 'weapon_stab') attackType = 'stab';
    else if (cat.includes('crush') || cat === 'weapon_blunt' || cat === 'weapon_spiked') attackType = 'crush';

    const eqBonus = getBonus(attackType);
    const strBonus = getBonus('strBonus');
    maxHit = getMeleeMaxHit(effStr, strBonus);
    attackRoll = combatStatRoll(effAtk, eqBonus);
    const monDef = attackType === 'stab' ? monster.defenceStab : attackType === 'crush' ? monster.defenceCrush : monster.defenceSlash;
    npcDefRoll = combatStatRoll(monster.defence + 9, monDef || 0);

  } else if (combatType === 'ranged') {
    const effRng = getEffectiveRanged(ranged, style);
    const rngStr = getBonus('rangedStrBonus');
    const rngAtk = getBonus('ranged');
    maxHit = getRangedMaxHit(effRng, rngStr);
    attackRoll = combatStatRoll(effRng, rngAtk);
    npcDefRoll = combatStatRoll(monster.defence + 9, monster.defenceRanged || 0);

  } else if (combatType === 'magic') {
    const magicLvl = magic || 1;
    const spell = getBestSpell(magicLvl);
    maxHit = spell[1];
    // effective_magic = combat_effective_stat(magic, 100) + 8 + 1 (no magic prayers, always +1 style)
    const effMagic = effectiveStat(magicLvl, 100) + 8 + 1;
    const magicAtk = getBonus('magic');
    attackRoll = combatStatRoll(effMagic, magicAtk);
    npcDefRoll = combatStatRoll(monster.defence + 9, monster.defenceMagic || 0);
  } else {
    return 0;
  }

  const accuracy = getAccuracy(attackRoll, npcDefRoll);
  const weapon = equipment.weapon;
  let speedTicks = combatType === 'magic' ? 5 : (weapon?.attackRate || 4);
  if (combatType === 'ranged' && style === 'rapid') speedTicks = Math.max(1, speedTicks - 1);
  const avgHit = (maxHit / 2) * accuracy;
  return avgHit / (speedTicks * 0.6);
}

// Item categories mapped to equipment slots
const SLOT_MAP = {
  head: 'head', cape: 'cape', neck: 'neck', ammo: 'ammo',
  weapon: 'weapon', body: 'body', shield: 'shield', legs: 'legs',
  hands: 'hands', feet: 'feet', ring: 'ring'
};

// Determine combat type from weapon
function detectCombatType(weapon, style) {
  if (!weapon) return 'melee';
  if (style === 'spell') return 'magic';
  const cat = weapon.category?.toLowerCase() || '';
  const name = weapon.name?.toLowerCase() || '';
  if (cat.includes('staff') || name.includes('staff') || name.includes('wand') || name.includes("iban's")) {
    return 'magic';
  }
  if (cat.includes('bow') || cat.includes('thrown') || cat.includes('crossbow') || cat.includes('javelin') ||
      name.includes('bow') || name.includes('dart') || name.includes('knife') || name.includes('javelin') || name.includes('thrownaxe')) {
    return 'ranged';
  }
  return 'melee';
}

// Standard spellbook combat spells: [name, maxHit, magicLevelReq]
const COMBAT_SPELLS = [
  ['Wind Strike', 2, 1], ['Water Strike', 4, 5], ['Earth Strike', 6, 9], ['Fire Strike', 8, 13],
  ['Wind Bolt', 9, 17], ['Water Bolt', 10, 23], ['Earth Bolt', 11, 29], ['Fire Bolt', 12, 35],
  ['Wind Blast', 13, 41], ['Water Blast', 14, 47], ['Earth Blast', 15, 53], ['Fire Blast', 16, 59],
  ['Wind Wave', 17, 62], ['Water Wave', 18, 65], ['Earth Wave', 19, 70], ['Fire Wave', 20, 75],
];

function getBestSpell(magicLevel) {
  let best = COMBAT_SPELLS[0];
  for (const spell of COMBAT_SPELLS) {
    if (magicLevel >= spell[2]) best = spell;
  }
  return best;
}

// Item level requirements inferred from name patterns
const RANGED_REQS = [
  { pattern: /\bblack d'?hide\b|\bblack dragonhide\b/i, level: 70 },
  { pattern: /\bred d'?hide\b|\bred dragonhide\b/i, level: 60 },
  { pattern: /\bblue d'?hide\b|\bblue dragonhide\b/i, level: 50 },
  { pattern: /\bgreen d'?hide\b|\bgreen dragonhide\b/i, level: 40 },
  { pattern: /\bmagic shortbow\b/i, level: 50 },
  { pattern: /\bmagic longbow\b/i, level: 50 },
  { pattern: /\byew shortbow\b/i, level: 40 },
  { pattern: /\byew longbow\b/i, level: 40 },
  { pattern: /\bmaple shortbow\b/i, level: 30 },
  { pattern: /\bmaple longbow\b/i, level: 30 },
  { pattern: /\bwillow shortbow\b/i, level: 20 },
  { pattern: /\bwillow longbow\b/i, level: 20 },
  { pattern: /\brune arrow\b/i, level: 40 },
  { pattern: /\bkaril\b/i, level: 70 },
];
const ATTACK_REQS = [
  { pattern: /\bdragon\b/i, level: 60 },
  { pattern: /\brune\b/i, level: 40 },
  { pattern: /\badamant\b/i, level: 30 },
  { pattern: /\bmithril\b/i, level: 20 },
  { pattern: /\bblack\b/i, level: 10 },
  { pattern: /\bsteel\b/i, level: 5 },
  { pattern: /\btorag\b|\bverac\b|\bguthan\b|\bkaril\b|\bahrims\b/i, level: 70 },
];
const DEFENCE_REQS = [
  { pattern: /\bdragon (platelegs|plateskirt|chainbody|med helm|sq shield|full helm|square shield)\b/i, level: 60 },
  { pattern: /\brune (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 40 },
  { pattern: /\badamant (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 30 },
  { pattern: /\bmithril (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 20 },
  { pattern: /\bblack (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 10 },
  { pattern: /\bsteel (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 5 },
  { pattern: /\btorag\b|\bverac\b|\bguthan\b/i, level: 70 },
  { pattern: /\bblack d'?hide (body|chaps|vamb)\b|\bblack dragonhide (body|chaps)\b/i, level: 70 },
  { pattern: /\bred d'?hide (body|chaps|vamb)\b|\bred dragonhide (body|chaps)\b/i, level: 60 },
  { pattern: /\bblue d'?hide (body|chaps|vamb)\b|\bblue dragonhide (body|chaps)\b/i, level: 50 },
  { pattern: /\bgreen d'?hide (body|chaps|vamb)\b|\bgreen dragonhide (body|chaps)\b/i, level: 40 },
];
const MAGIC_REQS = [
  { pattern: /\bahrims?\b/i, level: 70 },
  { pattern: /\biban\b/i, level: 50 },
  { pattern: /\bmaster wand\b/i, level: 60 },
  { pattern: /\bteacher wand\b/i, level: 55 },
  { pattern: /\bpupil wand\b/i, level: 50 },
  { pattern: /\bapprentice wand\b/i, level: 40 },
];

function getBowMaxArrowStrBonus(weaponName) {
  const wn = weaponName.toLowerCase();
  if (wn.includes('crossbow')) return Infinity;
  if (wn.includes('magic')) return 49;
  if (wn.includes('yew')) return 49;
  if (wn.includes('maple')) return 31;
  if (wn.includes('willow')) return 22;
  if (wn.includes('oak')) return 14;
  if (wn.includes('bow')) return 10;
  return Infinity;
}

function meetsRequirements(item, playerLevels) {
  if (!playerLevels) return true;
  const name = item.name;
  const slot = item.slot;
  for (const req of RANGED_REQS) {
    if (req.pattern.test(name)) {
      if ((playerLevels.ranged || 1) < req.level) return false;
      break;
    }
  }
  if (slot === 'weapon') {
    for (const req of ATTACK_REQS) {
      if (req.pattern.test(name)) {
        if ((playerLevels.attack || 1) < req.level) return false;
        break;
      }
    }
  }
  for (const req of DEFENCE_REQS) {
    if (req.pattern.test(name)) {
      if ((playerLevels.defence || 1) < req.level) return false;
      break;
    }
  }
  for (const req of MAGIC_REQS) {
    if (req.pattern.test(name)) {
      if ((playerLevels.magic || 1) < req.level) return false;
      break;
    }
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      playerStats,
      monster,
      budgetGp = null,
      combatStyle = 'all',
      playerLevels = null,
      weaponOnly = false,
      forcedItems = [],
    } = body;

    if (!playerStats || !monster) {
      return Response.json({ error: 'Missing playerStats or monster' }, { status: 400 });
    }

    // Fetch item data directly from external sources (same as fetchGameData)
    const ITEM_URL = 'https://2004.losthq.rs/js/itemdb/item_data.json?v=254';
    const SLOT_ALIASES = {
      'weapon': 'weapon', 'shield': 'shield', 'head': 'head', 'body': 'body',
      'legs': 'legs', 'hands': 'hands', 'feet': 'feet', 'cape': 'cape',
      'neck': 'neck', 'ammo': 'ammo', 'ring': 'ring', 'ammunition': 'ammo',
      'quiver': 'ammo', 'righthand': 'weapon', 'lefthand': 'shield'
    };

    const itemResp = await fetch(ITEM_URL);
    const itemData = await itemResp.json();

    const allItems = itemData
      .map((item, index) => {
        const hasWieldOp = item.iops && Object.values(item.iops).some(op => op === 'Wield' || op === 'Wear');
        if (!hasWieldOp || !item.equipable_item) return null;
        const eq = item.equipable_item;
        const wearpos = eq.wearpos?.toLowerCase();
        const slot = SLOT_ALIASES[wearpos] || wearpos;
        if (!slot) return null;
        const itemName = item.name?.toLowerCase() || '';
        let category = null;
        if (itemName.includes('staff') || itemName.includes('iban')) category = 'weapon_staff';
        else if (itemName.includes('bow') && !itemName.includes('crossbow')) category = 'weapon_bow';
        else if (itemName.includes('crossbow')) category = 'weapon_crossbow';
        else if (itemName.includes('dart') || itemName.includes('knife') || itemName.includes('thrownaxe') || itemName.includes('javelin')) category = 'weapon_thrown';
        else if (itemName.includes('sword') || itemName.includes('scimitar') || itemName.includes('longsword') || itemName.includes('2h')) category = 'weapon_slash';
        else if (itemName.includes('dagger') || itemName.includes('spear')) category = 'weapon_stab';
        else if (itemName.includes('mace') || itemName.includes('warhammer') || itemName.includes('maul')) category = 'weapon_blunt';
        else if (itemName.includes('axe') && slot === 'weapon') category = 'weapon_axe';
        return {
          id: index, name: item.name || 'Unknown', slot, category,
          icon: `https://raw.githubusercontent.com/X704Scape/2004-Runescape-DPS-Calculator-Rev-254/main/icons/${index}.png`,
          stab: eq.stabattack || 0, slash: eq.slashattack || 0, crush: eq.crushattack || 0,
          strBonus: eq.strengthbonus || 0,
          ranged: eq.rangedattack || eq.rangeattack || 0,
          rangedStrBonus: eq.rangedstrengthbonus || eq.rangestrengthbonus || eq.rangebonus || 0,
          magic: eq.magicattack || 0,
          defenceStab: eq.stabdefence || 0, defenceSlash: eq.slashdefence || 0,
          defenceCrush: eq.crushdefence || 0,
          defenceRanged: eq.rangeddefence || eq.rangedefence || 0,
          defenceMagic: eq.magicdefence || 0,
          attackRate: eq.attackrate || 4,
          equipable: true,
          price: item.cost || 0
        };
      })
      .filter(item => {
        if (!item) return false;
        // Filter out corrupted/mod items
        const maxStat = Math.max(item.stab, item.slash, item.crush, item.strBonus, item.ranged, item.rangedStrBonus);
        if (maxStat > 150) return false;
        const lower = item.name.toLowerCase();
        const banned = ['(p)', 'poisoned', 'mod ', 'gm ', 'dev ', 'debug', 'null', 'placeholder'];
        if (banned.some(b => lower.includes(b))) return false;
        return true;
      });

    if (!allItems.length) {
      return Response.json({ error: 'Could not load item database' }, { status: 500 });
    }

    // Filter equippable items, optionally by budget and player level requirements
    const usableItems = allItems.filter(item => {
      if (!item.equipable && !item.slot) return false;
      if (budgetGp !== null && item.price && item.price > budgetGp) return false;
      if (!meetsRequirements(item, playerLevels)) return false;
      return true;
    });

    // Group items by slot
    const bySlot = {};
    for (const item of usableItems) {
      const slot = item.slot || 'unknown';
      if (!bySlot[slot]) bySlot[slot] = [];
      bySlot[slot].push(item);
    }

    // Resolve forced items by name — match each to a real item in the database
    const lockedBySlot = {}; // slot -> item
    if (forcedItems && forcedItems.length > 0) {
      for (const forcedName of forcedItems) {
        const fn = forcedName.toLowerCase();
        // Search all items for the best name match
        const match = usableItems.find(i => i.name.toLowerCase() === fn) ||
                      usableItems.find(i => i.name.toLowerCase().includes(fn)) ||
                      allItems.find(i => i.name.toLowerCase() === fn) ||
                      allItems.find(i => i.name.toLowerCase().includes(fn));
        if (match) lockedBySlot[match.slot] = match;
      }
    }
    const lockedWeapon = lockedBySlot['weapon'] || null;

    // Determine which combat styles to try
    const stylesToTry = [];
    if (lockedWeapon) {
      const detectedType = detectCombatType(lockedWeapon, 'aggressive');
      const styleForType = detectedType === 'ranged' ? 'rapid' : detectedType === 'magic' ? 'spell' : 'aggressive';
      stylesToTry.push({ type: detectedType, style: styleForType });
    } else {
      if (combatStyle === 'all' || combatStyle === 'melee') {
        stylesToTry.push({ type: 'melee', style: 'aggressive' });
      }
      if (combatStyle === 'all' || combatStyle === 'ranged') {
        stylesToTry.push({ type: 'ranged', style: 'rapid' });
      }
      if (combatStyle === 'all' || combatStyle === 'magic') {
        stylesToTry.push({ type: 'magic', style: 'spell' });
      }
    }

    // For each combat style, find the best weapon first then optimize other slots
    const results = [];

    for (const { type: cType, style: cStyle } of stylesToTry) {
      // Get candidate weapons — if locked, only use that one
      const weapons = lockedWeapon
        ? [lockedWeapon]
        : (bySlot['weapon'] || []).filter(w => {
            const detected = detectCombatType(w, cType === 'magic' ? 'spell' : cStyle);
            return detected === cType;
          });

      if (!weapons.length) continue;

      // Score each weapon by the DPS it provides when fully geared (use remaining best-in-slot items)
      // First pass: find best weapon assuming neutral other equipment
      let bestDPS = -1;
      let bestLoadout = null;

      for (const weapon of weapons) {
        // Build equipment object: start with the weapon, add best supporting items
        const equipment = { weapon };

        // For ranged, we need ammo that matches the weapon
        if (cType === 'ranged') {
          if (lockedBySlot['ammo']) {
            equipment.ammo = lockedBySlot['ammo'];
          } else {
            const wn = weapon.name?.toLowerCase() || '';
            const isBow = wn.includes('bow') && !wn.includes('crossbow');
            const isCrossbow = wn.includes('crossbow');
            const isThrown = !isBow && !isCrossbow;
            if (!isThrown) {
              const maxArrowBonus = isBow ? getBowMaxArrowStrBonus(weapon.name) : Infinity;
              const ammoOptions = bySlot['ammo'] || [];
              let bestAmmo = null, bestAmmoBonus = -1;
              for (const ammo of ammoOptions) {
                const an = ammo.name?.toLowerCase() || '';
                const ac = ammo.category?.toLowerCase() || '';
                const isArrow = ac === 'arrows' || an.includes('arrow');
                const isBolt = ac === 'bolts' || an.includes('bolt');
                const bonus = ammo.rangedStrBonus || 0;
                if (isBow && isArrow && bonus <= maxArrowBonus && bonus > bestAmmoBonus) {
                  bestAmmoBonus = bonus; bestAmmo = ammo;
                } else if (isCrossbow && isBolt && bonus > bestAmmoBonus) {
                  bestAmmoBonus = bonus; bestAmmo = ammo;
                }
              }
              if (bestAmmo) equipment.ammo = bestAmmo;
            }
          }
        }

        // Add best items for each other slot (maximize relevant bonus)
        const slots = ['head', 'cape', 'neck', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];

        if (!weaponOnly) {
          const wname2H = weapon.name?.toLowerCase() || '';
          const is2H = weapon.slot === 'weapon_2h' || weapon.is2h ||
                       (weapon.attackStyles && weapon.category === 'weapon_2h_sword') ||
                       wname2H.includes('godsword') ||
                       wname2H.includes('2h') ||
                       wname2H.includes('bow') ||
                       wname2H.includes('halberd') ||
                       wname2H.includes('spear') ||
                       wname2H.includes('staff') ||
                       wname2H.includes('maul');

          for (const slot of slots) {
            if (slot === 'shield' && is2H) continue;
            // If user forced this slot, use their item
            if (lockedBySlot[slot]) { equipment[slot] = lockedBySlot[slot]; continue; }
            const candidates = bySlot[slot] || [];
            if (!candidates.length) continue;

            let best = null;
            let bestScore = -Infinity;
            for (const item of candidates) {
              let score = 0;
              if (cType === 'melee') {
                score = (item.strBonus || 0) * 2 + (item.slash || 0) + (item.stab || 0) + (item.crush || 0);
              } else if (cType === 'ranged') {
                score = (item.rangedStrBonus || 0) * 2 + (item.ranged || 0);
              } else if (cType === 'magic') {
                score = (item.magic || 0) * 3 + (item.defenceMagic || 0);
              }
              if (score > bestScore) { bestScore = score; best = item; }
            }
            if (cType === 'melee' && bestScore === 0) {
              let bestDefScore = -Infinity;
              for (const item of candidates) {
                const defScore = (item.defenceStab || 0) + (item.defenceSlash || 0) + (item.defenceCrush || 0);
                if (defScore > bestDefScore) { bestDefScore = defScore; best = item; }
              }
            }
            if (best) equipment[slot] = best;
          }
        } else {
          // weaponOnly: still apply any forced non-weapon slots
          for (const [slot, item] of Object.entries(lockedBySlot)) {
            if (slot !== 'weapon') equipment[slot] = item;
          }
        }

        const dps = calcDPS({ combatType: cType, playerStats: { ...playerStats, style: cStyle }, equipment, monster });
        if (dps > bestDPS) {
          bestDPS = dps;
          bestLoadout = equipment;
        }
      }

      if (bestLoadout && bestDPS > 0) {
        results.push({
          combatType: cType,
          style: cStyle,
          dps: parseFloat(bestDPS.toFixed(3)),
          equipment: bestLoadout
        });
      }
    }

    // Sort by DPS descending
    results.sort((a, b) => b.dps - a.dps);

    // Also produce budget tiers if no budget was set
    let budgetTiers = null;
    if (budgetGp === null && results.length > 0) {
      const topResult = results[0];
      
      // Re-run with budget constraints to generate tiers
      const tierBudgets = [
        { label: 'Starter (≤25k)', gp: 25000 },
        { label: 'Mid (≤500k)', gp: 500000 },
        { label: 'Best in Slot', gp: null }
      ];

      budgetTiers = [];
      for (const tier of tierBudgets) {
        const tierItems = allItems.filter(item => {
          if (!item.equipable && !item.slot) return false;
          if (tier.gp !== null && item.price && item.price > tier.gp) return false;
          if (!meetsRequirements(item, playerLevels)) return false;
          return true;
        });

        const tierBySlot = {};
        for (const item of tierItems) {
          const slot = item.slot || 'unknown';
          if (!tierBySlot[slot]) tierBySlot[slot] = [];
          tierBySlot[slot].push(item);
        }

        // Find best weapon for this tier matching best combat type
        const tierWeapons = (tierBySlot['weapon'] || []).filter(w => {
          return detectCombatType(w, topResult.style) === topResult.combatType;
        });

        let tierBestDPS = 0;
        let tierBestEquip = null;
        for (const weapon of tierWeapons) {
          const equipment = { weapon };
          if (topResult.combatType === 'ranged') {
            const wn = weapon.name?.toLowerCase() || '';
            const isBow = wn.includes('bow') && !wn.includes('crossbow');
            const isCrossbow = wn.includes('crossbow');
            const isThrown = !isBow && !isCrossbow;
            if (!isThrown) {
              const maxArrowBonus = isBow ? getBowMaxArrowStrBonus(weapon.name) : Infinity;
              const ammoOptions = tierBySlot['ammo'] || [];
              let bestAmmo = null, bestBonus = -1;
              for (const ammo of ammoOptions) {
                const an = ammo.name?.toLowerCase() || '';
                const ac = ammo.category?.toLowerCase() || '';
                const isArrow = ac === 'arrows' || an.includes('arrow');
                const isBolt = ac === 'bolts' || an.includes('bolt');
                const bonus = ammo.rangedStrBonus || 0;
                if (isBow && isArrow && bonus <= maxArrowBonus && bonus > bestBonus) {
                  bestBonus = bonus; bestAmmo = ammo;
                } else if (isCrossbow && isBolt && bonus > bestBonus) {
                  bestBonus = bonus; bestAmmo = ammo;
                }
              }
              if (bestAmmo) equipment.ammo = bestAmmo;
            }
          }

          const tierWname = weapon.name?.toLowerCase() || '';
          const tierIs2H = weapon.slot === 'weapon_2h' || weapon.is2h ||
                           tierWname.includes('godsword') || tierWname.includes('2h') ||
                           tierWname.includes('bow') || tierWname.includes('halberd') ||
                           tierWname.includes('spear') || tierWname.includes('staff') ||
                           tierWname.includes('maul');
          const slots = ['head', 'cape', 'neck', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];
          for (const slot of slots) {
            if (slot === 'shield' && tierIs2H) continue;
            const candidates = tierBySlot[slot] || [];
            let best = null, bestScore = -Infinity;
            for (const item of candidates) {
              let score = 0;
              if (topResult.combatType === 'melee') {
                score = (item.strBonus || 0) * 2 + (item.slash || 0) + (item.stab || 0) + (item.crush || 0);
              } else if (topResult.combatType === 'ranged') {
                score = (item.rangedStrBonus || 0) * 2 + (item.ranged || 0);
              } else if (topResult.combatType === 'magic') {
                score = (item.magic || 0) * 3 + (item.defenceMagic || 0);
              }
              if (score > bestScore) { bestScore = score; best = item; }
            }
            // For melee only: if no item gives any offensive bonus, pick best melee defence instead
            if (topResult.combatType === 'melee' && bestScore === 0) {
              let bestDefScore = -Infinity;
              for (const item of candidates) {
                const defScore = (item.defenceStab || 0) + (item.defenceSlash || 0) + (item.defenceCrush || 0);
                if (defScore > bestDefScore) { bestDefScore = defScore; best = item; }
              }
            }
            if (best) equipment[slot] = best;
          }

          const dps = calcDPS({ combatType: topResult.combatType, playerStats: { ...playerStats, style: topResult.style }, equipment, monster });
          if (dps > tierBestDPS) { tierBestDPS = dps; tierBestEquip = equipment; }
        }

        if (tierBestEquip) {
          budgetTiers.push({
            label: tier.label,
            gp: tier.gp,
            dps: parseFloat(tierBestDPS.toFixed(3)),
            equipment: tierBestEquip
          });
        }
      }
    }

    return Response.json({ results, budgetTiers });
  } catch (error) {
    console.error('AI Optimizer error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});