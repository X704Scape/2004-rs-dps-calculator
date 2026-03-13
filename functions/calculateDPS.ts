import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Prayer multipliers
const PRAYER_STR_MULTIPLIERS = {
  none: 1.0,
  burst_of_strength: 1.05,
  superhuman_strength: 1.10,
  ultimate_strength: 1.15
};

const PRAYER_ATK_MULTIPLIERS = {
  none: 1.0,
  clarity_of_thought: 1.05,
  improved_reflexes: 1.10,
  incredible_reflexes: 1.15
};

// Style bonuses for strength
const STYLE_BONUS = {
  aggressive: 3,
  aggressive_2: 3,
  aggressive_3: 3,
  controlled: 1,
  controlled_1: 1,
  controlled_2: 1,
  controlled_3: 1,
  accurate: 0,
  defensive: 0
};

// Effective Level Calculations
function getEffectiveStrength(strengthLevel, prayerMult, styleName, potionBoost = 0) {
  const styleBonus = STYLE_BONUS[styleName] || 0;
  return Math.floor(strengthLevel * prayerMult) + styleBonus + 8 + potionBoost;
}

function getEffectiveRanged(rangedLevel, prayerMult, styleName, potionBoost = 0) {
  // Ranged styles: accurate = +3, rapid = +0, longrange = +0
  const styleBonus = styleName === 'accurate' ? 3 : 0;
  return Math.floor(rangedLevel * prayerMult) + styleBonus + 8 + potionBoost;
}

// Max Hit Calculations
function getMeleeMaxHit(effectiveStr, strBonus) {
  const combatStat = effectiveStr * (strBonus + 64);
  return Math.floor((combatStat + 320) / 640);
}

function getRangedMaxHit(effectiveRanged, rangedStrBonus) {
  const combatStat = effectiveRanged * (rangedStrBonus + 64);
  return Math.floor((combatStat + 320) / 640);
}

function getMagicMaxHit(spellMaxHit, magicBonus, hasChaosGauntlets = false, isBoltSpell = false) {
  let maxHit = spellMaxHit;
  
  // Apply chaos gauntlets bonus for bolt spells
  if (hasChaosGauntlets && isBoltSpell) {
    maxHit += 3;
  }
  
  // Magic damage bonus from equipment (in 2004, this is a % bonus)
  // Each point of magic bonus adds 0.5% to damage
  const damageMultiplier = 1 + (magicBonus * 0.005);
  maxHit = Math.floor(maxHit * damageMultiplier);
  
  return maxHit;
}

// Accuracy calculations
function getEffectiveAttack(attackLevel, prayerMult, styleName, potionBoost = 0) {
  const styleBonus = styleName === 'accurate' ? 3 : (styleName.startsWith('controlled') ? 1 : 0);
  return Math.floor(attackLevel * prayerMult) + styleBonus + 8 + potionBoost;
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
      attackPrayer = 'none',
      strengthPrayer = 'none',
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
      isBoltSpell = false,
      weaponName = ''
    } = body;

    console.log('=== DPS Calculation Debug ===');
    console.log('Combat Type:', combatType);
    console.log('Attack Level:', attackLevel);
    console.log('Strength Level:', strengthLevel);
    console.log('Ranged Level:', rangedLevel);
    console.log('Magic Level:', magicLevel);
    console.log('Equipment Bonus (for attack):', equipmentBonus);
    console.log('Str Bonus:', strBonus);
    console.log('Ranged Str Bonus:', rangedStrBonus);
    console.log('Style Name:', styleName);
    console.log('Attack Prayer:', attackPrayer);
    console.log('Strength Prayer:', strengthPrayer);

    let maxHit = 0;
    let accuracy = 0;
    let attackRoll = 0;
    let npcDefRoll = 0;
    let dps = 0;
    let ttk = 0;

    if (combatType === 'melee') {
      const prayerStrMult = PRAYER_STR_MULTIPLIERS[strengthPrayer] || 1.0;
      const prayerAtkMult = PRAYER_ATK_MULTIPLIERS[attackPrayer] || 1.0;
      const effectiveStr = getEffectiveStrength(strengthLevel, prayerStrMult, styleName, potionStr);
      const effectiveAtk = getEffectiveAttack(attackLevel, prayerAtkMult, styleName, potionAttack);
      maxHit = getMeleeMaxHit(effectiveStr, strBonus);
      
      console.log('=== Melee Attack Roll Debug ===');
      console.log('Attack Level:', attackLevel);
      console.log('Prayer Atk Mult:', prayerAtkMult);
      console.log('Prayer Str Mult:', prayerStrMult);
      console.log('Style Name:', styleName);
      console.log('Effective Attack:', effectiveAtk);
      console.log('Effective Strength:', effectiveStr);
      console.log('Equipment Bonus:', equipmentBonus);
      console.log('Str Bonus:', strBonus);
      console.log('Calculated Max Hit:', maxHit);

      // Use the appropriate monster defense bonus based on attack type
      // The equipment bonus passed in already corresponds to the correct attack type (stab/slash/crush)
      // We need to determine which defense to use based on which attack bonus is being used
      let monsterDefBonus = body.monsterDefenceStab || 0;
      
      // Check which melee attack type we're using by comparing equipment bonus values
      // The frontend should pass the correct equipmentBonus for the active attack type
      if (body.weaponAttackType === 'slash') {
        monsterDefBonus = body.monsterDefenceSlash || 0;
      } else if (body.weaponAttackType === 'crush') {
        monsterDefBonus = body.monsterDefenceCrush || 0;
      }

      attackRoll = effectiveAtk * (equipmentBonus + 64);
      const npcEffectiveDefence = monsterDefence + 9;
      npcDefRoll = npcEffectiveDefence * (monsterDefBonus + 64);
      console.log('Attack Roll:', attackRoll, '=', effectiveAtk, '*', (equipmentBonus + 64));
      console.log('NPC Defense Roll:', npcDefRoll);
      accuracy = getAccuracy(attackRoll, npcDefRoll);
    } else if (combatType === 'ranged') {
      const prayerRangedMult = PRAYER_STR_MULTIPLIERS[strengthPrayer] || 1.0;
      const effectiveRanged = getEffectiveRanged(rangedLevel, prayerRangedMult, styleName, potionRanged);
      maxHit = getRangedMaxHit(effectiveRanged, rangedStrBonus);

      console.log('=== Ranged Attack Roll Debug ===');
      console.log('Ranged Level:', rangedLevel);
      console.log('Prayer Ranged Mult:', prayerRangedMult);
      console.log('Effective Ranged:', effectiveRanged);
      console.log('Equipment Bonus:', equipmentBonus);
      console.log('Ranged Str Bonus:', rangedStrBonus);

      // Use monster's defence level with ranged defence bonus
      const monsterDefBonus = body.monsterDefenceRanged || 0;
      attackRoll = effectiveRanged * (equipmentBonus + 64);
      const npcEffectiveDefence = monsterDefence + 9;
      npcDefRoll = npcEffectiveDefence * (monsterDefBonus + 64);
      console.log('Attack Roll:', attackRoll, '=', effectiveRanged, '*', (equipmentBonus + 64));
      console.log('NPC Defense Roll:', npcDefRoll);
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

    // Overkill calculation using HP distribution simulation.
    // We track P(monster is at exactly r HP) before each swing, propagate through attacks,
    // and accumulate expected overkill when a killing blow lands.
    let overkill = 0;
    if (maxHit > 0 && accuracy > 0 && monsterHitpoints > 0) {
      const hp = monsterHitpoints;
      // hpDist[r] = probability monster is alive with exactly r HP remaining
      const hpDist = new Float64Array(hp + 1);
      hpDist[hp] = 1.0;

      const hitProb = accuracy / (maxHit + 1); // prob of rolling each specific hit value h in [0..maxHit]
      const missProb = 1 - accuracy;

      let expectedOverkill = 0;
      const maxIter = 5000;

      for (let iter = 0; iter < maxIter; iter++) {
        // Check if enough probability mass remains
        let totalRemaining = 0;
        for (let r = 1; r <= hp; r++) totalRemaining += hpDist[r];
        if (totalRemaining < 1e-9) break;

        const newDist = new Float64Array(hp + 1);

        for (let r = 1; r <= hp; r++) {
          const p = hpDist[r];
          if (p < 1e-14) continue;

          // Miss: stay at r
          newDist[r] += p * missProb;

          // Each hit value h from 0 to maxHit
          for (let h = 0; h <= maxHit; h++) {
            const remaining = r - h;
            if (remaining <= 0) {
              // Killing blow — overkill = h - r = -remaining
              expectedOverkill += p * hitProb * (-remaining);
            } else {
              newDist[remaining] += p * hitProb;
            }
          }
        }

        for (let r = 0; r <= hp; r++) hpDist[r] = newDist[r];
      }

      overkill = expectedOverkill;
    }

    // Special attack calculations (informational only, not included in DPS/TTK)
    let specAccuracy = null;
    let specMaxHit = null;
    let specExpectedHit = null;

    const wepName = weaponName.toLowerCase();
    const isDragonDagger = wepName.includes('dragon dagger');
    const isDragonLongsword = wepName.includes('dragon longsword');
    const isDragonMace = wepName.includes('dragon mace');
    const isMagicLongbow = wepName.includes('magic longbow');
    const isMagicShortbow = wepName.includes('magic shortbow');
    const isRuneClaws = wepName.includes('rune claws');
    const isRuneThrownaxe = wepName.includes('rune thrownaxe');

    if (isDragonDagger && combatType === 'melee') {
      // DD spec: 2 hits, +15% max hit, +15% attack roll, rolls vs slash def
      const specAttackRoll = Math.floor(attackRoll * 1.15);
      const specHitMaxHit = Math.floor(maxHit * 1.15);
      const specHitAccuracy = getAccuracy(specAttackRoll, npcDefRoll);
      const specAvgHitPerHit = (specHitMaxHit / 2) * specHitAccuracy;
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specHitMaxHit;
      specExpectedHit = (specAvgHitPerHit * 2).toFixed(2); // 2 hits total
    } else if (isDragonLongsword && combatType === 'melee') {
      // DLS spec: 1 hit, +25% max hit, normal accuracy, rolls vs slash def
      const specHitMaxHit = Math.floor(maxHit * 1.25);
      const specHitAccuracy = getAccuracy(attackRoll, npcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specHitMaxHit;
      specExpectedHit = ((specHitMaxHit / 2) * specHitAccuracy).toFixed(2);
    } else if (isDragonMace && combatType === 'melee') {
      // DM spec: 1 hit, +50% max hit, +25% attack roll, rolls vs crush def
      // npcDefRoll for crush — recalculate using crush defence
      const crushDefBonus = body.monsterDefenceCrush || 0;
      const npcEffectiveDefence = monsterDefence + 9;
      const crushNpcDefRoll = npcEffectiveDefence * (crushDefBonus + 64);
      const specAttackRoll = Math.floor(attackRoll * 1.25);
      const specHitMaxHit = Math.floor(maxHit * 1.50);
      const specHitAccuracy = getAccuracy(specAttackRoll, crushNpcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specHitMaxHit;
      specExpectedHit = ((specHitMaxHit / 2) * specHitAccuracy).toFixed(2);
    } else if (isMagicLongbow && combatType === 'ranged') {
      // MLB spec: 1 hit, +10 ranged levels for max hit, no accuracy boost
      const prayerRangedMult = PRAYER_STR_MULTIPLIERS[strengthPrayer] || 1.0;
      const specEffectiveRanged = getEffectiveRanged(rangedLevel + 10, prayerRangedMult, styleName, potionRanged);
      const specHitMaxHit = getRangedMaxHit(specEffectiveRanged, rangedStrBonus);
      const specHitAccuracy = getAccuracy(attackRoll, npcDefRoll); // normal accuracy
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specHitMaxHit;
      specExpectedHit = ((specHitMaxHit / 2) * specHitAccuracy).toFixed(2);
    } else if (isMagicShortbow && combatType === 'ranged') {
      // MSB spec: 2 hits, +10 ranged levels for max hit, +43% attack roll each
      const prayerRangedMult = PRAYER_STR_MULTIPLIERS[strengthPrayer] || 1.0;
      const specEffectiveRanged = getEffectiveRanged(rangedLevel + 10, prayerRangedMult, styleName, potionRanged);
      const specHitMaxHit = getRangedMaxHit(specEffectiveRanged, rangedStrBonus);
      const specAttackRoll = Math.floor(attackRoll * (10 / 7)); // scale(10,7,...) = ~143%
      const specHitAccuracy = getAccuracy(specAttackRoll, npcDefRoll);
      const specAvgHitPerHit = (specHitMaxHit / 2) * specHitAccuracy;
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specHitMaxHit;
      specExpectedHit = (specAvgHitPerHit * 2).toFixed(2); // 2 hits total
    } else if (isRuneClaws && combatType === 'melee') {
      // Rune claws spec: 1 hit, +10% max hit, normal accuracy
      const specHitMaxHit = Math.floor(maxHit * 1.10);
      const specHitAccuracy = getAccuracy(attackRoll, npcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specHitMaxHit;
      specExpectedHit = ((specHitMaxHit / 2) * specHitAccuracy).toFixed(2);
    } else if (isRuneThrownaxe && combatType === 'ranged') {
      // Rune thrownaxe spec: chains up to 5 targets — show single-target stats (+10 ranged levels, normal accuracy)
      const prayerRangedMult = PRAYER_STR_MULTIPLIERS[strengthPrayer] || 1.0;
      const specEffectiveRanged = getEffectiveRanged(rangedLevel + 10, prayerRangedMult, styleName, potionRanged);
      const specHitMaxHit = getRangedMaxHit(specEffectiveRanged, rangedStrBonus);
      const specHitAccuracy = getAccuracy(attackRoll, npcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specHitMaxHit;
      specExpectedHit = ((specHitMaxHit / 2) * specHitAccuracy).toFixed(2);
    }

    return Response.json({
      attackRoll,
      npcDefRoll,
      maxHit,
      accuracy: (accuracy * 100).toFixed(2),
      dps: dps.toFixed(3),
      ttk: ttk.toFixed(1),
      avgHit: avgHit.toFixed(2),
      overkill: overkill.toFixed(2),
      attackSpeedTicks,
      specAccuracy,
      specMaxHit,
      specExpectedHit
    });
  } catch (error) {
    console.error('Calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});