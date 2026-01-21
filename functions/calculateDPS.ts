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
      const effectiveStr = getEffectiveStrength(strengthLevel, prayerMult, styleName, potionStr);
      const effectiveAtk = getEffectiveAttack(attackLevel, prayerMult, styleName, potionAttack);
      maxHit = getMeleeMaxHit(effectiveStr, strBonus);

      // Determine which monster defense bonus to use based on player's attack style
      let monsterDefBonus = body.monsterDefenceStab || 0;
      if (styleName === 'aggressive') {
        monsterDefBonus = body.monsterDefenceSlash || 0;
      } else if (styleName === 'accurate') {
        monsterDefBonus = body.monsterDefenceStab || 0;
      } else if (styleName === 'controlled') {
        monsterDefBonus = body.monsterDefenceStab || 0;
      }

      attackRoll = effectiveAtk * (equipmentBonus + 64);
      const npcEffectiveDefence = monsterDefence + 9;
      npcDefRoll = npcEffectiveDefence * (monsterDefBonus + 64);
      accuracy = getAccuracy(attackRoll, npcDefRoll);
    } else if (combatType === 'ranged') {
      const effectiveRanged = getEffectiveRanged(rangedLevel, prayerMult, potionRanged);
      maxHit = getRangedMaxHit(effectiveRanged, rangedStrBonus);

      // Use monster's defence level with ranged defence bonus
      const monsterDefBonus = body.monsterDefenceRanged || 0;
      attackRoll = effectiveRanged * (equipmentBonus + 64);
      const npcEffectiveDefence = monsterDefence + 9;
      npcDefRoll = npcEffectiveDefence * (monsterDefBonus + 64);
      accuracy = getAccuracy(attackRoll, npcDefRoll);
    } else if (combatType === 'magic') {
      // Spell max hit is already calculated (base spell damage + charge boost if applicable)
      maxHit = spellMaxHit;

      // Magic accuracy in 2004 - from npc_magic_attack_roll
      // effective_magic = magic_level + 9 (style bonus of 1 = +9)
      const effectiveMagic = magicLevel + 9;
      attackRoll = effectiveMagic * (equipmentBonus + 64);
      
      // NPC magic defence roll
      const npcEffectiveMagic = monsterMagic + 9;
      npcDefRoll = npcEffectiveMagic * (monsterDefenceMagic + 64);
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