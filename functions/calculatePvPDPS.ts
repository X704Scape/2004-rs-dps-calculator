import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attacker, defender } = await req.json();

    // Get effective levels with prayer bonuses
    const effectiveAttack = Math.floor(attacker.attackLevel * (attacker.attackPrayer / 100));
    const effectiveStrength = Math.floor(attacker.strengthLevel * (attacker.strengthPrayer / 100));
    const effectiveDefence = Math.floor(defender.defenceLevel * (defender.defencePrayer / 100));

    // Calculate attack roll
    const attackRoll = effectiveAttack * (attacker.attackBonus + 64);

    // Calculate defence roll
    const defenceRoll = effectiveDefence * (defender.defenceBonus + 64);

    // Calculate hit chance
    let hitChance;
    if (attackRoll < defenceRoll) {
      hitChance = (attackRoll + 1) / (2 * (defenceRoll + 1));
    } else {
      hitChance = 1 - ((defenceRoll + 1) / (2 * (attackRoll + 1)));
    }

    // Calculate max hit
    const combatStat = effectiveStrength * (attacker.strengthBonus + 64);
    const maxHit = Math.floor((combatStat + 320) / 640);

    // Calculate expected damage per hit
    const expectedDamage = hitChance * (maxHit / 2);

    // Calculate DPS
    const cycleSeconds = attacker.attackSpeed * 0.6;
    const dps = expectedDamage / cycleSeconds;

    return Response.json({
      maxHit,
      avgHit: expectedDamage.toFixed(2),
      dps: dps.toFixed(2),
      accuracy: (hitChance * 100).toFixed(1),
      attackRoll,
      defenceRoll,
      attackSpeedTicks: attacker.attackSpeed
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});