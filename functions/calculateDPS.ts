import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Prayer multipliers
const PRAYER_MULTS = {
  none: 1.0,
  burst_of_strength: 1.05,
  superhuman_strength: 1.10,
  ultimate_strength: 1.15
};

// Style bonuses for strength
const STYLE_BONUS = {
  aggressive: 3,
  controlled: 1,
  accurate: 0,
  defensive: 0
};

// Effective Level Calculations
function getEffectiveStrength(strengthLevel, prayerMult, styleName, potionBoost = 0) {
  const styleBonus = STYLE_BONUS[styleName] || 0;
  return Math.floor(strengthLevel * prayerMult) + styleBonus + 8 + potionBoost;
}

function getEffectiveRanged(rangedLevel, prayerMult, styleName, potionBoost = 0) {
  const styleBonus = STYLE_BONUS[styleName] || 0;
  return Math.floor(rangedLevel * prayerMult) + styleBonus + 8 + potionBoost;
}

// Max Hit Calculations
function getMeleeMaxHit(effectiveStr, strBonus) {
  return Math.floor(0.5 + (effectiveStr * (strBonus + 64)) / 640);
}

function getRangedMaxHit(effectiveRanged, rangedStrBonus) {
  return Math.floor(0.5 + (effectiveRanged * (rangedStrBonus + 64)) / 640);
}

function getMagicMaxHit(spellMaxHit, hasChaosGauntlets = false, isBoltSpell = false) {
  if (hasChaosGauntlets && isBoltSpell) {
    return spellMaxHit + 3;
  }
  return spellMaxHit;
}

// Accuracy calculations
function getEffectiveAttack(attackLevel, prayerMult, styleName, potionBoost = 0) {
  const styleBonus = styleName === 'accurate' ? 3 : 0;
  return Math.floor(attackLevel * prayerMult) + styleBonus + 8 + potionBoost;
}

function getAccuracy(effectiveAttack, equipmentBonus, monsterDefence) {
  const attackRoll = effectiveAttack * (equipmentBonus + 64);
  const defenceRoll = Math.floor(monsterDefence * 1.5 + 40);
  
  let accuracy;
  if (attackRoll > defenceRoll) {
    accuracy = Math.min(1.0, (2 * attackRoll - defenceRoll) / (2 * attackRoll));
  } else {
    accuracy = Math.max(0.0, (attackRoll - defenceRoll) / (2 * defenceRoll));
  }
  
  return { accuracy, attackRoll, defenceRoll };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const {
      combatType = 'melee', // melee, ranged, magic
      attackLevel = 1,
      strengthLevel = 1,
      rangedLevel = 1,
      magicLevel = 1,
      defenceLevel = 1,
      equipmentBonus = 0,
      strBonus = 0,
      rangedStrBonus = 0,
      prayerName = 'none',
      styleName = 'aggressive',
      potionStr = 0,
      potionRanged = 0,
      potionAttack = 0,
      monsterHitpoints = 10,
      monsterAttack = 1,
      monsterDefence = 1,
      monsterRanged = 1,
      monsterMagic = 1,
      spellMaxHit = 0,
      hasChaosGauntlets = false,
      isBoltSpell = false
    } = body;

    const prayerMult = PRAYER_MULTS[prayerName] || 1.0;

    let maxHit = 0;
    let accuracy = 0;
    let attackRoll = 0;
    let npcDefRoll = 0;
    let dps = 0;
    let ttk = 0;

    if (combatType === 'melee') {
      const effectiveStr = getEffectiveStrength(strengthLevel, prayerMult, styleName, potionStr);
      const effectiveAtk = getEffectiveAttack(attackLevel, prayerMult, styleName, potionAttack);
      maxHit = getMeleeMaxHit(effectiveStr, strBonus);
      const accuracyResult = getAccuracy(effectiveAtk, equipmentBonus, monsterDefence);
      accuracy = accuracyResult.accuracy;
      attackRoll = accuracyResult.attackRoll;
      npcDefRoll = accuracyResult.defenceRoll;
    } else if (combatType === 'ranged') {
      const effectiveRngStr = getEffectiveRanged(rangedLevel, prayerMult, styleName, potionRanged);
      const effectiveRngAtk = getEffectiveRanged(rangedLevel, prayerMult, styleName, potionRanged);
      maxHit = getRangedMaxHit(effectiveRngStr, rangedStrBonus);
      const accuracyResult = getAccuracy(effectiveRngAtk, equipmentBonus, monsterRanged);
      accuracy = accuracyResult.accuracy;
      attackRoll = accuracyResult.attackRoll;
      npcDefRoll = accuracyResult.defenceRoll;
    } else if (combatType === 'magic') {
      maxHit = getMagicMaxHit(spellMaxHit, hasChaosGauntlets, isBoltSpell);
      accuracy = 1.0; // Magic doesn't use accuracy in 2004
      attackRoll = 0;
      npcDefRoll = 0;
    }

    // DPS calculation (assuming 4 ticks per attack in 2004)
    const avgHit = maxHit * accuracy;
    const attackSpeed = 2.4; // Default 4 ticks = 2.4 seconds
    dps = avgHit / attackSpeed;

    // Time to kill
    if (dps > 0) {
      ttk = monsterHitpoints / dps;
    }

    return Response.json({
      attackRoll,
      npcDefRoll,
      maxHit,
      accuracy: (accuracy * 100).toFixed(2),
      dps: dps.toFixed(3),
      ttk: ttk.toFixed(1),
      avgHit: avgHit.toFixed(2)
    });
  } catch (error) {
    console.error('Calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});