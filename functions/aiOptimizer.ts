import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PRAYER_STR_MULTIPLIERS = {
  none: 1.0, burst_of_strength: 1.05, superhuman_strength: 1.10, ultimate_strength: 1.15
};
const PRAYER_ATK_MULTIPLIERS = {
  none: 1.0, clarity_of_thought: 1.05, improved_reflexes: 1.10, incredible_reflexes: 1.15
};
const STYLE_BONUS = {
  aggressive: 3, aggressive_2: 3, aggressive_3: 3,
  controlled: 1, controlled_1: 1, controlled_2: 1, controlled_3: 1,
  accurate: 0, defensive: 0
};

function getEffectiveStr(lvl, prayer, style) {
  return Math.floor(lvl * prayer) + (STYLE_BONUS[style] || 0) + 8;
}
function getEffectiveAtk(lvl, prayer, style) {
  const bonus = style === 'accurate' ? 3 : (style.startsWith('controlled') ? 1 : 0);
  return Math.floor(lvl * prayer) + bonus + 8;
}
function getEffectiveRanged(lvl, prayer, style) {
  return Math.floor(lvl * prayer) + (style === 'accurate' ? 3 : 0) + 8;
}
function getAccuracy(atkRoll, defRoll) {
  if (atkRoll > defRoll) return 1 - (defRoll + 2) / (2 * (atkRoll + 1));
  return atkRoll / (2 * (defRoll + 1));
}
function getMeleeMaxHit(effStr, strBonus) {
  return Math.floor((effStr * (strBonus + 64) + 320) / 640);
}
function getRangedMaxHit(effRng, rngStrBonus) {
  return Math.floor((effRng * (rngStrBonus + 64) + 320) / 640);
}

function calcDPS({ combatType, playerStats, equipment, monster }) {
  const { attack, strength, ranged, magic, prayerActive, style } = playerStats;
  const atkPrayer = PRAYER_ATK_MULTIPLIERS[prayerActive?.attack || 'none'] || 1.0;
  const strPrayer = PRAYER_STR_MULTIPLIERS[prayerActive?.strength || 'none'] || 1.0;

  const getBonus = (key) => Object.values(equipment).reduce((s, i) => s + (i?.[key] || 0), 0);

  let maxHit = 0, attackRoll = 0, npcDefRoll = 0;

  if (combatType === 'melee') {
    const effStr = getEffectiveStr(strength, strPrayer, style);
    const effAtk = getEffectiveAtk(attack, atkPrayer, style);
    // determine attack type from weapon category
    let attackType = 'slash';
    const cat = equipment.weapon?.category || '';
    if (cat.includes('stab') || cat === 'weapon_stab') attackType = 'stab';
    else if (cat.includes('crush') || cat === 'weapon_blunt' || cat === 'weapon_spiked') attackType = 'crush';
    
    const eqBonus = getBonus(attackType);
    const strBonus = getBonus('strBonus');
    maxHit = getMeleeMaxHit(effStr, strBonus);
    attackRoll = effAtk * (eqBonus + 64);
    const monDef = attackType === 'stab' ? monster.defenceStab : attackType === 'crush' ? monster.defenceCrush : monster.defenceSlash;
    npcDefRoll = (monster.defence + 9) * ((monDef || 0) + 64);
  } else if (combatType === 'ranged') {
    const effRng = getEffectiveRanged(ranged, strPrayer, style);
    const rngStr = getBonus('rangedStrBonus');
    const rngAtk = getBonus('ranged');
    maxHit = getRangedMaxHit(effRng, rngStr);
    attackRoll = effRng * (rngAtk + 64);
    npcDefRoll = (monster.defence + 9) * ((monster.defenceRanged || 0) + 64);
  } else {
    return 0; // skip magic for now
  }

  const accuracy = getAccuracy(attackRoll, npcDefRoll);
  const weapon = equipment.weapon;
  let speedTicks = weapon?.attackRate || 4;
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
  if (cat.includes('bow') || cat.includes('thrown') || cat.includes('crossbow') || cat.includes('javelin') ||
      name.includes('bow') || name.includes('dart') || name.includes('knife') || name.includes('javelin') || name.includes('thrownaxe')) {
    return 'ranged';
  }
  return 'melee';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      playerStats,   // { attack, strength, ranged, magic, defence, prayer, prayerActive, style }
      monster,       // full monster object
      budgetGp = null, // null = no limit, number = gp cap
      combatStyle = 'all' // 'melee', 'ranged', 'magic', 'all'
    } = body;

    if (!playerStats || !monster) {
      return Response.json({ error: 'Missing playerStats or monster' }, { status: 400 });
    }

    // Fetch all game items via fetchGameData function
    const itemsResp = await base44.asServiceRole.functions.invoke('fetchGameData', { type: 'items' });
    const allItems = itemsResp?.items || [];

    if (!allItems.length) {
      return Response.json({ error: 'Could not load item database' }, { status: 500 });
    }

    // Filter equippable items, optionally by budget
    const usableItems = allItems.filter(item => {
      if (!item.equipable && !item.slot) return false;
      if (budgetGp !== null && item.price && item.price > budgetGp) return false;
      return true;
    });

    // Group items by slot
    const bySlot = {};
    for (const item of usableItems) {
      const slot = item.slot || 'unknown';
      if (!bySlot[slot]) bySlot[slot] = [];
      bySlot[slot].push(item);
    }

    // Determine which combat styles to try
    const stylesToTry = [];
    if (combatStyle === 'all' || combatStyle === 'melee') {
      stylesToTry.push({ type: 'melee', style: 'aggressive' });
    }
    if (combatStyle === 'all' || combatStyle === 'ranged') {
      stylesToTry.push({ type: 'ranged', style: 'rapid' });
    }

    // For each combat style, find the best weapon first then optimize other slots
    const results = [];

    for (const { type: cType, style: cStyle } of stylesToTry) {
      // Get candidate weapons
      const weapons = (bySlot['weapon'] || []).filter(w => {
        const detected = detectCombatType(w, cStyle);
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
          const weaponName = weapon.name?.toLowerCase() || '';
          const ammoOptions = bySlot['ammo'] || [];
          let bestAmmo = null;
          let bestAmmoBonus = -1;
          for (const ammo of ammoOptions) {
            const ammoName = ammo.name?.toLowerCase() || '';
            const ammoCategory = ammo.category?.toLowerCase() || '';
            const isArrow = ammoCategory === 'arrows' || ammoName.includes('arrow');
            const isBolt = ammoCategory === 'bolts' || ammoName.includes('bolt');
            const isBow = (weaponName.includes('bow') && !weaponName.includes('crossbow'));
            const isCrossbow = weaponName.includes('crossbow');
            const isThrown = !isBow && !isCrossbow;

            if (isThrown) break; // thrown weapons don't use ammo slot for damage

            if ((isBow && isArrow) || (isCrossbow && isBolt)) {
              const bonus = ammo.rangedStrBonus || 0;
              if (bonus > bestAmmoBonus) {
                bestAmmoBonus = bonus;
                bestAmmo = ammo;
              }
            }
          }
          if (bestAmmo) equipment.ammo = bestAmmo;
        }

        // Add best items for each other slot (maximize relevant bonus)
        const slots = ['head', 'cape', 'neck', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];
        
        // Skip shield if weapon is 2h
        const is2H = weapon.slot === 'weapon_2h' || weapon.is2h || 
                     (weapon.attackStyles && weapon.category === 'weapon_2h_sword') ||
                     weapon.name?.toLowerCase().includes('godsword') ||
                     weapon.name?.toLowerCase().includes('2h');

        for (const slot of slots) {
          if (slot === 'shield' && is2H) continue;
          const candidates = bySlot[slot] || [];
          if (!candidates.length) continue;

          // Pick item that maximizes DPS bonus for this combat type
          let best = null;
          let bestScore = -Infinity;
          for (const item of candidates) {
            let score = 0;
            if (cType === 'melee') {
              score = (item.strBonus || 0) * 2 + (item.slash || 0) + (item.stab || 0) + (item.crush || 0);
            } else if (cType === 'ranged') {
              score = (item.rangedStrBonus || 0) * 2 + (item.ranged || 0);
            }
            if (score > bestScore) {
              bestScore = score;
              best = item;
            }
          }
          if (best) equipment[slot] = best;
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
            const ammoOptions = tierBySlot['ammo'] || [];
            let bestAmmo = null, bestBonus = -1;
            for (const ammo of ammoOptions) {
              const wn = weapon.name?.toLowerCase() || '';
              const an = ammo.name?.toLowerCase() || '';
              const ac = ammo.category?.toLowerCase() || '';
              const isArrow = ac === 'arrows' || an.includes('arrow');
              const isBolt = ac === 'bolts' || an.includes('bolt');
              const isBow = wn.includes('bow') && !wn.includes('crossbow');
              const isCrossbow = wn.includes('crossbow');
              if ((isBow && isArrow) || (isCrossbow && isBolt)) {
                if ((ammo.rangedStrBonus || 0) > bestBonus) {
                  bestBonus = ammo.rangedStrBonus || 0;
                  bestAmmo = ammo;
                }
              }
            }
            if (bestAmmo) equipment.ammo = bestAmmo;
          }

          const slots = ['head', 'cape', 'neck', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];
          for (const slot of slots) {
            const candidates = tierBySlot[slot] || [];
            let best = null, bestScore = -Infinity;
            for (const item of candidates) {
              let score = topResult.combatType === 'melee'
                ? (item.strBonus || 0) * 2 + (item.slash || 0) + (item.stab || 0) + (item.crush || 0)
                : (item.rangedStrBonus || 0) * 2 + (item.ranged || 0);
              if (score > bestScore) { bestScore = score; best = item; }
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