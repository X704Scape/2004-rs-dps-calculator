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

// 2004 RSC formulas based on actual game code

// Player effective level calculation
function getEffectiveLevel(level, prayerMult, styleBonus, potionBoost = 0) {
  return Math.floor(level * prayerMult) + styleBonus + 8 + potionBoost;
}

// NPC effective level calculation (no prayer, always +9 for controlled stance)
function getNPCEffectiveLevel(level) {
  return level + 9;
}

// Combat stat calculation: effective_level * (bonus + 64)
function getCombatStat(effectiveLevel, bonus) {
  return effectiveLevel * (bonus + 64);
}

// Max hit formula: floor(0.5 + combat_strength / 640)
function getMaxHit(combatStrength) {
  return Math.floor(0.5 + combatStrength / 640);
}

// Matches 2004 accuracy formula
function getAccuracy(attackRoll, defenceRoll) {
  let accuracy;
  if (attackRoll > defenceRoll) {
    accuracy = 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
  } else {
    accuracy = attackRoll / (2 * (defenceRoll + 1));
  }
  return accuracy;
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
      magicBonus = 0,
      attackSpeedTicks = 4,
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
      monsterDefenceStab = 0,
      monsterDefenceSlash = 0,
      monsterDefenceCrush = 0,
      monsterDefenceRanged = 0,
      monsterDefenceMagic = 0,
      spellMaxHit = 0,
      hasChaosGauntlets = false,
      isBoltSpell = false
    } = body;

    const prayerMult = PRAYER_MULTS[prayerName] || 1.0;

    console.log('=== DPS Calculation Debug ===');
    console.log('Combat Type:', combatType);
    console.log('Ranged Level:', rangedLevel);
    console.log('Ranged Str Bonus:', rangedStrBonus);
    console.log('Equipment Bonus:', equipmentBonus);
    console.log('Prayer Mult:', prayerMult);

    let maxHit = 0;
    let accuracy = 0;
    let attackRoll = 0;
    let npcDefRoll = 0;
    let dps = 0;
    let ttk = 0;

    if (combatType === 'melee') {
      // Player melee calculation
      const styleBonus = STYLE_BONUS[styleName] || 0;
      const effectiveStr = getEffectiveLevel(strengthLevel, prayerMult, styleBonus, potionStr);
      const effectiveAtk = getEffectiveLevel(attackLevel, prayerMult, styleBonus, potionAttack);
      
      const combatStrength = getCombatStat(effectiveStr, strBonus);
      maxHit = getMaxHit(combatStrength);
      attackRoll = getCombatStat(effectiveAtk, equipmentBonus);

      // NPC defence: uses defence level with appropriate defence bonus
      let monsterDefBonus = monsterDefenceStab;
      if (styleName === 'aggressive') {
        monsterDefBonus = monsterDefenceSlash;
      } else if (styleName === 'controlled') {
        monsterDefBonus = monsterDefenceCrush;
      }

      const npcEffectiveDefence = getNPCEffectiveLevel(monsterDefence);
      npcDefRoll = getCombatStat(npcEffectiveDefence, monsterDefBonus);
      accuracy = getAccuracy(attackRoll, npcDefRoll);
      
    } else if (combatType === 'ranged') {
      // Player ranged calculation (always +1 style bonus for rapid/accurate)
      const effectiveRanged = getEffectiveLevel(rangedLevel, prayerMult, 1, potionRanged);
      
      const combatRanged = getCombatStat(effectiveRanged, rangedStrBonus);
      maxHit = getMaxHit(combatRanged);
      attackRoll = getCombatStat(effectiveRanged, equipmentBonus);

      // NPC defence vs ranged
      const npcEffectiveDefence = getNPCEffectiveLevel(monsterDefence);
      npcDefRoll = getCombatStat(npcEffectiveDefence, monsterDefenceRanged);
      accuracy = getAccuracy(attackRoll, npcDefRoll);
      
    } else if (combatType === 'magic') {
      // Magic max hit is spell-defined (no formula)
      maxHit = spellMaxHit;

      // Player magic accuracy
      const effectiveMagic = getEffectiveLevel(magicLevel, 1.0, 1, 0); // no prayer for magic accuracy, +1 style
      attackRoll = getCombatStat(effectiveMagic, equipmentBonus);
      
      // NPC magic defence uses magic level
      const npcEffectiveMagic = getNPCEffectiveLevel(monsterMagic);
      npcDefRoll = getCombatStat(npcEffectiveMagic, monsterDefenceMagic);
      accuracy = getAccuracy(attackRoll, npcDefRoll);
    }

    // DPS calculation
    // Expected damage: (maxHit / 2) when hit lands * accuracy of landing the hit
    const avgHit = (maxHit / 2) * accuracy;
    const attackSpeed = attackSpeedTicks * 0.6; // Convert ticks to seconds
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