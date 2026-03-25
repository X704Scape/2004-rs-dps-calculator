import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Prayer bonus values from source (check_attack_prayer / check_strength_prayer)
// Returns integer percentage: 100 = no prayer, 105 = +5%, 110 = +10%, 115 = +15%
const PRAYER_ATK_BONUS = {
  none: 100,
  clarity_of_thought: 105,
  improved_reflexes: 110,
  incredible_reflexes: 115
};
const PRAYER_STR_BONUS = {
  none: 100,
  burst_of_strength: 105,
  superhuman_strength: 110,
  ultimate_strength: 115
};

// combat_effective_stat: scale(max(100, prayerbonus), 100, stat_level)
// = floor(stat_level * prayerbonus / 100)
function effectiveStat(level, prayerBonus) {
  return Math.floor(level * Math.max(100, prayerBonus) / 100);
}

// Style bonuses from combat_get_damagestyle_bonuses in source (combat.rs2)
// returns (attack_bonus, strength_bonus, defence_bonus, ranged_bonus)
// style_melee_accurate:   (3, 0, 0, 0)
// style_melee_aggressive: (0, 3, 0, 0)
// style_melee_defensive:  (0, 0, 3, 0)
// style_melee_controlled: (1, 1, 1, 0)
// style_ranged_accurate:  (0, 0, 0, 3)
// style_ranged_longrange: (0, 0, 3, 0)  <-- ranged bonus = 0 !
// style_ranged_rapid:     (0, 0, 0, 0)  <-- hits default case
// magic: always +1 (per JMod tweet referenced in source comment)

function getAttackStyleBonus(styleName) {
  if (styleName === 'accurate') return 3;
  if (styleName === 'controlled' || styleName === 'controlled_1' || styleName === 'controlled_2' || styleName === 'controlled_3') return 1;
  return 0;
}
// Strength style bonus applies to effective_strength → melee max hit AND is distinct from attack bonus
function getStrengthStyleBonus(styleName) {
  if (styleName === 'aggressive' || styleName === 'aggressive_2' || styleName === 'aggressive_3') return 3;
  if (styleName === 'controlled' || styleName === 'controlled_1' || styleName === 'controlled_2' || styleName === 'controlled_3') return 1;
  return 0;
}
// Ranged style bonus: accurate=+3, rapid=+0, longrange=+0 (longrange only gives +3 defence, not ranged)
function getRangedStyleBonus(styleName) {
  if (styleName === 'accurate') return 3;
  return 0;
}

// Melee attack roll: attack level + prayer + 8 + attack style bonus
function getEffectiveAttack(attackLevel, attackPrayerBonus, styleName, potionBoost = 0) {
  return effectiveStat(attackLevel + potionBoost, attackPrayerBonus) + 8 + getAttackStyleBonus(styleName);
}

// Melee max hit: strength level + prayer + 8 + strength style bonus
// Source: $effective_strength used for both melee_strength (max hit) with style bonus applied
function getEffectiveStrength(strengthLevel, strPrayerBonus, styleName, potionBoost = 0) {
  return effectiveStat(strengthLevel + potionBoost, strPrayerBonus) + 8 + getStrengthStyleBonus(styleName);
}

// Ranged: no prayer bonus. Same effective_ranged used for both attack roll AND max hit.
function getEffectiveRanged(rangedLevel, styleName, potionBoost = 0) {
  return effectiveStat(rangedLevel + potionBoost, 100) + 8 + getRangedStyleBonus(styleName);
}

// Magic: no prayer bonus, always +1 style bonus (source comment: "magic always has a style bonus of 1")
function getEffectiveMagic(magicLevel) {
  return effectiveStat(magicLevel, 100) + 8 + 1;
}

// combat_stat: effective_stat * (bonus + 64)
function combatStat(effectiveLevel, bonus) {
  return effectiveLevel * (bonus + 64);
}

// combat_maxhit: floor((combat_stat + 320) / 640)
function combatMaxHit(stat) {
  return Math.floor((stat + 320) / 640);
}

function getMeleeMaxHit(effectiveStr, strBonus) {
  return combatMaxHit(combatStat(effectiveStr, strBonus));
}

function getRangedMaxHit(effectiveRanged, rangedStrBonus) {
  return combatMaxHit(combatStat(effectiveRanged, rangedStrBonus));
}

// Source accuracy: randominc(attackRoll) > randominc(defenceRoll)
// Expected probability of this: same as OSRS formula
function getAccuracy(attackRoll, defenceRoll) {
  if (attackRoll > defenceRoll) {
    return 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
  }
  return attackRoll / (2 * (defenceRoll + 1));
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



    let maxHit = 0;
    let accuracy = 0;
    let attackRoll = 0;
    let npcDefRoll = 0;
    let dps = 0;
    let ttk = 0;

    if (combatType === 'melee') {
      const atkPrayerBonus = PRAYER_ATK_BONUS[attackPrayer] || 100;
      const strPrayerBonus = PRAYER_STR_BONUS[strengthPrayer] || 100;
      // Source: effective_strength includes strength style bonus → feeds melee max hit
      const effectiveStr = getEffectiveStrength(strengthLevel, strPrayerBonus, styleName, potionStr);
      const effectiveAtk = getEffectiveAttack(attackLevel, atkPrayerBonus, styleName, potionAttack);
      maxHit = getMeleeMaxHit(effectiveStr, strBonus);

      let monsterDefBonus = body.monsterDefenceStab || 0;
      if (body.weaponAttackType === 'slash') monsterDefBonus = body.monsterDefenceSlash || 0;
      else if (body.weaponAttackType === 'crush') monsterDefBonus = body.monsterDefenceCrush || 0;

      attackRoll = combatStat(effectiveAtk, equipmentBonus);
      npcDefRoll = combatStat(monsterDefence + 9, monsterDefBonus);
      accuracy = getAccuracy(attackRoll, npcDefRoll);

    } else if (combatType === 'ranged') {
      // Source: same effective_ranged (with style bonus) used for both attack roll and max hit
      const effRng = getEffectiveRanged(rangedLevel, styleName, potionRanged);
      maxHit = getRangedMaxHit(effRng, rangedStrBonus);

      const monsterDefBonus = body.monsterDefenceRanged || 0;
      attackRoll = combatStat(effRng, equipmentBonus);
      npcDefRoll = combatStat(monsterDefence + 9, monsterDefBonus);
      accuracy = getAccuracy(attackRoll, npcDefRoll);

    } else if (combatType === 'magic') {
      maxHit = spellMaxHit;

      // Source: effective_magic = combat_effective_stat(magic_level, 100) + 8 + 1
      // (no magic prayers, always +1 style bonus per JMod tweet referenced in source)
      const effectiveMagic = getEffectiveMagic(magicLevel);
      attackRoll = combatStat(effectiveMagic, equipmentBonus);

      // NPC magic defence roll uses magic_defence stat (not defence level)
      // Source uses effective_magic_defence = (7*effective_magic + 3*effective_defence) / 10
      // For NPCs we approximate using monsterMagic as the defence stat
      const npcEffectiveMagic = monsterMagic + 9;
      npcDefRoll = combatStat(npcEffectiveMagic, monsterDefenceMagic);
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
      // Source (pvm_dragon_dagger.rs2):
      // maxhit = scale(115, 100, %com_maxhit)
      // attackroll = scale(115, 100, player_attack_roll_specific(damagetype))
      // defenceroll = npc_defence_roll_specific(^slash_style)  <-- always slash def
      const specMaxHitVal = Math.floor(maxHit * 115 / 100);
      const specAttackRoll = Math.floor(attackRoll * 115 / 100);
      const slashNpcDefRoll = combatStat(monsterDefence + 9, monsterDefenceSlash || 0);
      const specHitAccuracy = getAccuracy(specAttackRoll, slashNpcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specMaxHitVal;
      specExpectedHit = ((specMaxHitVal / 2) * specHitAccuracy * 2).toFixed(2); // 2 hits

    } else if (isDragonLongsword && combatType === 'melee') {
      // Source (pvm_dragon_longsword.rs2):
      // maxhit = scale(125, 100, %com_maxhit)
      // attackroll = player_attack_roll_specific(damagetype)  <-- normal accuracy
      // defenceroll = npc_defence_roll_specific(^slash_style) <-- always slash def
      const specMaxHitVal = Math.floor(maxHit * 125 / 100);
      const slashNpcDefRoll = combatStat(monsterDefence + 9, monsterDefenceSlash || 0);
      const specHitAccuracy = getAccuracy(attackRoll, slashNpcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specMaxHitVal;
      specExpectedHit = ((specMaxHitVal / 2) * specHitAccuracy).toFixed(2);

    } else if (isDragonMace && combatType === 'melee') {
      // Source (pvm_dragon_mace.rs2):
      // maxhit = scale(150, 100, %com_maxhit)
      // attackroll = scale(125, 100, player_attack_roll_specific(damagetype))
      // defenceroll = npc_defence_roll_specific(^crush_style) <-- always crush def
      const specMaxHitVal = Math.floor(maxHit * 150 / 100);
      const specAttackRoll = Math.floor(attackRoll * 125 / 100);
      const crushNpcDefRoll = combatStat(monsterDefence + 9, monsterDefenceCrush || 0);
      const specHitAccuracy = getAccuracy(specAttackRoll, crushNpcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specMaxHitVal;
      specExpectedHit = ((specMaxHitVal / 2) * specHitAccuracy).toFixed(2);

    } else if (isMagicLongbow && combatType === 'ranged') {
      // Source (pvm_magic_longbow.rs2):
      // combat_stat = combat_stat(stat(ranged) + 10, ammo_rangebonus)  <-- raw ranged + 10, NOT effective
      // maxhit = combat_maxhit(combat_stat)
      // ALWAYS HITS (no accuracy roll in source)
      const specCombatStat = combatStat(rangedLevel + 10, rangedStrBonus);
      const specMaxHitVal = combatMaxHit(specCombatStat);
      specAccuracy = '100.00'; // always hits
      specMaxHit = specMaxHitVal;
      specExpectedHit = (specMaxHitVal / 2).toFixed(2); // always hits, expected = maxhit/2

    } else if (isMagicShortbow && combatType === 'ranged') {
      // Source (pvm_magic_shortbow.rs2):
      // combat_stat = combat_stat(stat(ranged) + 10, ammo_rangebonus)  <-- raw ranged + 10, NOT effective
      // maxhit = combat_maxhit(combat_stat)
      // attackroll = scale(10, 7, player_attack_roll_specific(damagetype))  <-- 10/7 = ~143%
      // 2 hits
      const specCombatStat = combatStat(rangedLevel + 10, rangedStrBonus);
      const specMaxHitVal = combatMaxHit(specCombatStat);
      const specAttackRoll = Math.floor(attackRoll * 10 / 7);
      const rangedNpcDefRoll = combatStat(monsterDefence + 9, monsterDefenceRanged || 0);
      const specHitAccuracy = getAccuracy(specAttackRoll, rangedNpcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specMaxHitVal;
      specExpectedHit = ((specMaxHitVal / 2) * specHitAccuracy * 2).toFixed(2); // 2 hits

    } else if (isRuneClaws && combatType === 'melee') {
      // Source (pvm_rune_claws.rs2):
      // maxhit = scale(110, 100, %com_maxhit)
      // normal hit roll (player_npc_hit_roll)
      const specMaxHitVal = Math.floor(maxHit * 110 / 100);
      const specHitAccuracy = getAccuracy(attackRoll, npcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specMaxHitVal;
      specExpectedHit = ((specMaxHitVal / 2) * specHitAccuracy).toFixed(2);

    } else if (isRuneThrownaxe && combatType === 'ranged') {
      // Source (pvm_rune_thrownaxe.rs2):
      // combat_stat = combat_stat(stat(ranged) + 10, ammo_rangebonus)  <-- raw ranged + 10
      // maxhit = combat_maxhit(combat_stat)
      // normal hit roll, chains up to 5 targets — show single-target stats
      const specCombatStat = combatStat(rangedLevel + 10, rangedStrBonus);
      const specMaxHitVal = combatMaxHit(specCombatStat);
      const specHitAccuracy = getAccuracy(attackRoll, npcDefRoll);
      specAccuracy = (specHitAccuracy * 100).toFixed(2);
      specMaxHit = specMaxHitVal;
      specExpectedHit = ((specMaxHitVal / 2) * specHitAccuracy).toFixed(2);
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