import React from 'react';

export default function ResultsPanel({ loadouts, selectedMonster }) {
  const [activeTab, setActiveTab] = React.useState('pve');

  if (!loadouts || loadouts.length === 0) {
    return (
      <div className="bg-gray-800 border-2 border-amber-900 rounded p-6 text-center">
        <p className="text-amber-700">Select equipment and a monster to see results</p>
      </div>
    );
  }

  const hasResults = loadouts.some(l => l.results);
  const isPvP = selectedMonster?.id === 'pvp';

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
        <div className="flex justify-between items-center">
          <h2 className="text-amber-600 font-bold text-sm">Results</h2>
          {isPvP && (
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('pve')}
                className={`px-3 py-1 text-xs rounded ${activeTab === 'pve' ? 'bg-amber-900 text-amber-100' : 'bg-gray-800 text-amber-700 hover:bg-gray-700'}`}
              >
                PvE
              </button>
              <button
                onClick={() => setActiveTab('pvp')}
                className={`px-3 py-1 text-xs rounded ${activeTab === 'pvp' ? 'bg-amber-900 text-amber-100' : 'bg-gray-800 text-amber-700 hover:bg-gray-700'}`}
              >
                PvP
              </button>
            </div>
          )}
        </div>
      </div>

      {isPvP && activeTab === 'pvp' ? (
        <div className="p-4">
          {loadouts.length < 2 ? (
            <p className="text-amber-700 text-center text-sm">Add a second loadout for PvP comparison</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 border-2 border-blue-900 rounded p-4">
                  <h3 className="text-blue-400 font-bold text-sm mb-3">Loadout 1</h3>
                  <div className="space-y-2 text-xs text-amber-100">
                    <div className="flex justify-between"><span>Max Hit:</span><span>{loadouts[0]?.results?.maxHit || '-'}</span></div>
                    <div className="flex justify-between"><span>DPS:</span><span className="text-green-400 font-bold">{loadouts[0]?.results?.dps || '-'}</span></div>
                    <div className="flex justify-between"><span>Accuracy:</span><span>{loadouts[0]?.results?.accuracy ? `${loadouts[0].results.accuracy}%` : '-'}</span></div>
                    <div className="flex justify-between"><span>Attack Speed:</span><span>{loadouts[0]?.results?.attackSpeedTicks ? `${loadouts[0].results.attackSpeedTicks} ticks` : '-'}</span></div>
                  </div>
                </div>

                <div className="bg-gray-900 border-2 border-red-900 rounded p-4">
                  <h3 className="text-red-400 font-bold text-sm mb-3">Loadout 2</h3>
                  <div className="space-y-2 text-xs text-amber-100">
                    <div className="flex justify-between"><span>Max Hit:</span><span>{loadouts[1]?.results?.maxHit || '-'}</span></div>
                    <div className="flex justify-between"><span>DPS:</span><span className="text-green-400 font-bold">{loadouts[1]?.results?.dps || '-'}</span></div>
                    <div className="flex justify-between"><span>Accuracy:</span><span>{loadouts[1]?.results?.accuracy ? `${loadouts[1].results.accuracy}%` : '-'}</span></div>
                    <div className="flex justify-between"><span>Attack Speed:</span><span>{loadouts[1]?.results?.attackSpeedTicks ? `${loadouts[1].results.attackSpeedTicks} ticks` : '-'}</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border-2 border-amber-900 rounded p-4 text-center">
                <h3 className="text-amber-600 font-bold text-sm mb-2">Winner</h3>
                {(() => {
                  const dps1 = loadouts[0]?.results?.dps || 0;
                  const dps2 = loadouts[1]?.results?.dps || 0;
                  if (dps1 > dps2) {
                    return <p className="text-blue-400 text-lg font-bold">Loadout 1</p>;
                  } else if (dps2 > dps1) {
                    return <p className="text-red-400 text-lg font-bold">Loadout 2</p>;
                  } else {
                    return <p className="text-amber-100 text-lg">Tie</p>;
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}