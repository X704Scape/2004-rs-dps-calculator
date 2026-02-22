import React, { useState, useMemo } from 'react';

// Seeded PRNG (mulberry32) so identical stats produce identical results
function makePrng(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simulates killing `npcCount` NPCs with a given weapon speed, accuracy, max hit, and NPC HP.
 */
function simulate(npcCount, npcHp, maxHit, accuracy, attackSpeedTicks, seed) {
  if (!maxHit || !attackSpeedTicks || !npcHp || !npcCount) return null;

  const rand = makePrng(seed != null ? seed : Math.random() * 2147483647);

  let totalTicks = 0;
  let totalDamage = 0;
  let totalOverkill = 0;
  let totalAttacks = 0;
  let totalHits = 0;
  let npcsKilled = 0;

  let currentHp = npcHp;

  let tick = 0;

  while (npcsKilled < npcCount) {
    tick += attackSpeedTicks;
    totalAttacks++;

    const hit = rand() < accuracy
      ? Math.floor(rand() * (maxHit + 1))
      : 0;

    if (hit > 0) totalHits++;

    const actualDamage = Math.min(hit, currentHp);
    totalDamage += actualDamage;
    currentHp -= actualDamage;

    if (currentHp <= 0) {
      // Overkill = what we rolled minus what was remaining before this hit
      totalOverkill += hit - actualDamage;
      npcsKilled++;
      currentHp = npcHp; // reset for next NPC — weapon still respects its tick rate
    }
  }

  totalTicks = tick;
  const totalSeconds = totalTicks * 0.6;
  const effectiveDps = totalDamage / totalSeconds;
  const avgOverkillPerKill = totalOverkill / npcCount;
  const wastedDamage = totalOverkill; // damage that landed but did nothing
  const hitRate = (totalHits / totalAttacks) * 100;

  return {
    totalTicks,
    totalSeconds: totalSeconds.toFixed(1),
    totalDamage,
    totalOverkill: totalOverkill.toFixed(1),
    avgOverkillPerKill: avgOverkillPerKill.toFixed(2),
    wastedTickPct: ((totalOverkill / totalDamage) * 100).toFixed(1),
    effectiveDps: effectiveDps.toFixed(3),
    hitRate: hitRate.toFixed(1),
    totalAttacks
  };
}

const RUNS = 5000; // Monte Carlo runs

function runMonteCarlo(npcCount, npcHp, maxHit, accuracy, attackSpeedTicks, baseSeed) {
  let sumSeconds = 0;
  let sumOverkill = 0;
  let sumDamage = 0;
  let sumTotalOverkill = 0;

  for (let i = 0; i < RUNS; i++) {
    const r = simulate(npcCount, npcHp, maxHit, accuracy, attackSpeedTicks, baseSeed + i);
    if (!r) return null;
    sumSeconds += parseFloat(r.totalSeconds);
    sumOverkill += parseFloat(r.avgOverkillPerKill);
    sumDamage += r.totalDamage;
    sumTotalOverkill += parseFloat(r.totalOverkill);
  }

  const avgSeconds = sumSeconds / RUNS;
  const avgOverkillPerKill = sumOverkill / RUNS;
  const avgDamage = sumDamage / RUNS;
  const avgTotalOverkill = sumTotalOverkill / RUNS;
  const effectiveDps = avgDamage / avgSeconds;
  const wastedPct = (avgTotalOverkill / avgDamage) * 100;

  return {
    totalSeconds: avgSeconds.toFixed(1),
    avgOverkillPerKill: avgOverkillPerKill.toFixed(2),
    effectiveDps: effectiveDps.toFixed(3),
    wastedPct: wastedPct.toFixed(1),
    avgDamage: avgDamage.toFixed(0),
    avgTotalOverkill: avgTotalOverkill.toFixed(1)
  };
}

export default function KillSimulator({ loadouts, selectedMonster, npcCount, onNpcCountChange }) {

  const hasResults = loadouts?.some(l => l.results);
  if (!hasResults || !selectedMonster || selectedMonster.id === 'pvp') return null;

  const npcHp = selectedMonster.hitpoints || 1;

  const simResults = useMemo(() => {
    // Use a fixed base seed so identical stats always produce identical results
    const BASE_SEED = 42;
    return loadouts.map(loadout => {
      const r = loadout.results;
      if (!r) return null;
      const maxHit = r.maxHit;
      const accuracy = parseFloat(r.accuracy) / 100;
      const speedTicks = r.attackSpeedTicks || 4;
      // Seed derived from the actual stats so same stats → same seed → same numbers
      const statSeed = (maxHit * 10000 + Math.round(accuracy * 10000) * 100 + speedTicks) ^ BASE_SEED;
      return runMonteCarlo(npcCount, npcHp, maxHit, accuracy, speedTicks, statSeed);
    });
  }, [loadouts.map(l => JSON.stringify(l.results)).join(','), npcCount, npcHp]);

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded overflow-hidden mt-4">
      <div className="bg-gray-900 border-b-2 border-amber-900 p-3 flex items-center justify-between">
        <h2 className="text-amber-600 font-bold text-sm">Kill Simulator</h2>
        <div className="flex items-center gap-2">
          <label className="text-amber-700 text-xs">NPCs to kill:</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={npcCount}
            onChange={e => onNpcCountChange && onNpcCountChange(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
            className="w-20 text-xs px-2 py-1 rounded border border-amber-900 bg-gray-900 text-amber-100 text-center"
          />
        </div>
      </div>

      <div className="p-3 text-xs text-amber-700 border-b border-amber-900 bg-gray-900/50">
        Simulates killing {npcCount}× <span className="text-amber-400 font-semibold">{selectedMonster.name}</span> ({npcHp} HP).
        Weapon attack rate is fixed — no speed bonus between kills. Results averaged over {RUNS.toLocaleString()} runs.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 border-b-2 border-amber-900">
              <th className="text-left px-4 py-2 text-amber-600 text-xs font-semibold border-r border-amber-900">Metric</th>
              {loadouts.map((loadout, idx) => (
                <th key={loadout.id} className={`px-4 py-2 text-amber-600 text-xs font-semibold ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Time to kill all</td>
              {simResults.map((sim, idx) => (
                <td key={idx} className={`px-4 py-2 text-green-400 text-xs text-center font-semibold ${idx < simResults.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {sim ? `${sim.totalSeconds}s` : '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Effective DPS</td>
              {simResults.map((sim, idx) => (
                <td key={idx} className={`px-4 py-2 text-green-400 text-xs text-center ${idx < simResults.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {sim ? sim.effectiveDps : '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Avg overkill / kill</td>
              {simResults.map((sim, idx) => (
                <td key={idx} className={`px-4 py-2 text-purple-400 text-xs text-center ${idx < simResults.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {sim ? sim.avgOverkillPerKill : '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Total overkill dmg</td>
              {simResults.map((sim, idx) => (
                <td key={idx} className={`px-4 py-2 text-purple-400 text-xs text-center ${idx < simResults.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {sim ? sim.avgTotalOverkill : '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Damage wasted %</td>
              {simResults.map((sim, idx) => (
                <td key={idx} className={`px-4 py-2 text-red-400 text-xs text-center ${idx < simResults.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {sim ? `${sim.wastedPct}%` : '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Total damage dealt</td>
              {simResults.map((sim, idx) => (
                <td key={idx} className={`px-4 py-2 text-amber-100 text-xs text-center ${idx < simResults.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {sim ? sim.avgDamage : '-'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}