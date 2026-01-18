import React from 'react';

export default function ResultsPanel({ results }) {
  if (!results) {
    return (
      <div className="bg-gray-800 border-2 border-amber-900 rounded p-4">
        <h2 className="text-amber-600 font-bold text-lg mb-4 border-b border-amber-900 pb-2">Results</h2>
        <p className="text-amber-100 text-sm text-center py-8">Select equipment and a monster to calculate DPS</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded p-4">
      <h2 className="text-amber-600 font-bold text-lg mb-4 border-b border-amber-900 pb-2">Results</h2>
      
      <div className="space-y-3">
        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <p className="text-amber-700 text-xs font-bold">Max Hit</p>
          <p className="text-amber-100 text-2xl font-bold">{results.maxHit}</p>
        </div>

        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <p className="text-amber-700 text-xs font-bold">DPS</p>
          <p className="text-amber-100 text-2xl font-bold">{results.dps}</p>
        </div>

        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <p className="text-amber-700 text-xs font-bold">Accuracy</p>
          <p className="text-amber-100 text-2xl font-bold">{results.accuracy}%</p>
        </div>

        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <p className="text-amber-700 text-xs font-bold">Avg Hit</p>
          <p className="text-amber-100 text-2xl font-bold">{results.avgHit}</p>
        </div>

        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <p className="text-amber-700 text-xs font-bold">Time to Kill</p>
          <p className="text-amber-100 text-xl font-bold">{results.ttk}s</p>
        </div>

        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <p className="text-amber-700 text-xs font-bold">Attack roll</p>
          <p className="text-amber-100 text-2xl font-bold">{results.attackRoll}</p>
        </div>

        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <p className="text-amber-700 text-xs font-bold">NPC def roll</p>
          <p className="text-amber-100 text-2xl font-bold">{results.npcDefRoll}</p>
        </div>

        <div className="bg-gray-900 rounded p-3 border border-amber-900">
          <p className="text-amber-700 text-xs font-bold">Speed</p>
          <p className="text-amber-100 text-lg font-bold">{results.attackSpeedTicks} ticks ({(results.attackSpeedTicks * 0.6).toFixed(2)}s)</p>
        </div>
      </div>
    </div>
  );
}