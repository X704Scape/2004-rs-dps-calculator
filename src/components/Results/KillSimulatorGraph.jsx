import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Seeded PRNG (mulberry32)
function makePrng(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulateAvgTTK(npcCount, npcHp, maxHit, accuracy, attackSpeedTicks, baseSeed, runs = 500) {
  if (!maxHit || !attackSpeedTicks || !npcHp || !npcCount) return null;
  let sumSeconds = 0;
  for (let i = 0; i < runs; i++) {
    const rand = makePrng(baseSeed + i);
    let tick = 0;
    let currentHp = npcHp;
    let killed = 0;
    while (killed < npcCount) {
      tick += attackSpeedTicks;
      const hit = rand() < accuracy ? Math.floor(rand() * (maxHit + 1)) : 0;
      currentHp -= Math.min(hit, currentHp);
      if (currentHp <= 0) { killed++; currentHp = npcHp; }
    }
    sumSeconds += tick * 0.6;
  }
  return parseFloat((sumSeconds / runs).toFixed(1));
}

const LOADOUT_COLORS = ['#22d3ee', '#facc15', '#f87171', '#a78bfa', '#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-gray-900 border border-amber-800 rounded px-3 py-2 text-xs shadow-lg">
      <p className="text-amber-500 font-semibold mb-1">{label} NPCs killed</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-amber-200">{p.name}</span>
          <span className="text-amber-100 font-semibold">{p.value}s</span>
        </div>
      ))}
    </div>
  );
};

export default function KillSimulatorGraph({ loadouts, selectedMonster, npcCount }) {
  const hasResults = loadouts?.some(l => l.results);
  if (!hasResults || !selectedMonster || selectedMonster.id === 'pvp') return null;

  const npcHp = selectedMonster.hitpoints || 1;
  const BASE_SEED = 42;

  // Build x-axis points: evenly spaced from 1 to npcCount (max 20 points)
  const xPoints = useMemo(() => {
    const count = Math.min(npcCount, 20);
    const step = Math.max(1, Math.floor(npcCount / count));
    const pts = [];
    for (let i = step; i <= npcCount; i += step) pts.push(i);
    if (pts[pts.length - 1] !== npcCount) pts.push(npcCount);
    return pts;
  }, [npcCount]);

  const chartData = useMemo(() => {
    return xPoints.map(n => {
      const point = { npcs: n };
      loadouts.forEach((loadout, idx) => {
        const r = loadout.results;
        if (!r) return;
        const maxHit = r.maxHit;
        const accuracy = parseFloat(r.accuracy) / 100;
        const speedTicks = r.attackSpeedTicks || 4;
        const statSeed = (maxHit * 10000 + Math.round(accuracy * 10000) * 100 + speedTicks) ^ BASE_SEED;
        point[loadout.name] = simulateAvgTTK(n, npcHp, maxHit, accuracy, speedTicks, statSeed);
      });
      return point;
    });
  }, [loadouts.map(l => JSON.stringify(l.results)).join(','), xPoints.join(','), npcHp]);

  const activeLoadouts = loadouts.filter(l => l.results);

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded overflow-hidden">
      <div className="bg-gray-900 border-b-2 border-amber-900 p-3">
        <h2 className="text-amber-600 font-bold text-sm">Loadout Comparison Graph</h2>
        <p className="text-amber-700 text-xs mt-0.5">Time to kill all NPCs vs. kill count</p>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3d3427" />
            <XAxis
              dataKey="npcs"
              tick={{ fill: '#d4c4a8', fontSize: 10 }}
              label={{ value: 'NPCs killed', position: 'insideBottom', offset: -4, fill: '#8b7355', fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: '#d4c4a8', fontSize: 10 }}
              tickFormatter={v => `${v}s`}
              label={{ value: 'Time (s)', angle: -90, position: 'insideLeft', offset: 10, fill: '#8b7355', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => <span style={{ color: '#d4c4a8' }}>{value}</span>}
            />
            {activeLoadouts.map((loadout, idx) => (
              <Line
                key={loadout.id}
                type="monotone"
                dataKey={loadout.name}
                stroke={LOADOUT_COLORS[idx % LOADOUT_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}