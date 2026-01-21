import React from 'react';

export default function ResultsPanel({ loadouts }) {
  if (!loadouts || loadouts.length === 0) {
    return (
      <div className="bg-gray-800 border-2 border-amber-900 rounded p-6 text-center">
        <p className="text-amber-700">Select equipment and a monster to see results</p>
      </div>
    );
  }

  const hasResults = loadouts.some(l => l.results);

  if (!hasResults) {
    return (
      <div className="bg-gray-800 border-2 border-amber-900 rounded p-6 text-center">
        <p className="text-amber-700">Select a monster to calculate DPS</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-2 border-amber-900 rounded overflow-hidden">
      <div className="bg-gray-900 border-b-2 border-amber-900 p-3">
        <h2 className="text-amber-600 font-bold text-sm">Results</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 border-b-2 border-amber-900">
              <th className="text-left px-4 py-2 text-amber-600 text-sm font-semibold border-r border-amber-900">Stat</th>
              {loadouts.map((loadout, idx) => (
                <th key={loadout.id} className={`px-4 py-2 text-amber-600 text-sm font-semibold ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Max hit</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 text-amber-100 text-sm text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.results?.maxHit || '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Expected hit</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 text-amber-100 text-sm text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.results?.avgHit || '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">DPS</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 text-green-400 text-sm text-center font-semibold ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.results?.dps || '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Avg. TTK</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 text-amber-100 text-sm text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.results?.ttk ? `${loadout.results.ttk}s` : '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Accuracy</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 text-amber-100 text-sm text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.results?.accuracy ? `${loadout.results.accuracy}%` : '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900 bg-gray-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900 italic">Rolls</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}></td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Attack roll</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 text-amber-100 text-sm text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.results?.attackRoll || '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-amber-900">
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">NPC def roll</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 text-amber-100 text-sm text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.results?.npcDefRoll || '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-amber-700 text-xs border-r border-amber-900">Attack speed</td>
              {loadouts.map((loadout, idx) => (
                <td key={loadout.id} className={`px-4 py-2 text-amber-100 text-sm text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
                  {loadout.results?.attackSpeedTicks ? `${loadout.results.attackSpeedTicks} ticks (${(loadout.results.attackSpeedTicks * 0.6).toFixed(1)}s)` : '-'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}