import React, { useState } from 'react';
import KillSimulator from './KillSimulator';

export default function ResultsPanel({ loadouts, selectedMonster, npcCount, onNpcCountChange }) {
  const [showMore, setShowMore] = useState(false);

  if (!loadouts || loadouts.length === 0 || !loadouts.some(l => l.results)) {
    return (
      <div className="bg-gray-800 border-2 border-amber-900 rounded p-6 text-center">
        <p className="text-amber-700">Select equipment and a monster to see results</p>
      </div>
    );
  }

  const ColHeader = ({ loadout, idx }) => (
    <th
      key={loadout.id}
      className={`px-4 py-2 text-white text-sm font-bold text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}
      style={{ backgroundColor: idx === 0 ? '#b45309' : '#92400e' }}
    >
      {loadout.name}
    </th>
  );

  const DataRow = ({ label, getValue, color = 'text-amber-100', format }) => (
    <tr className="border-b border-amber-900">
      <td className="px-4 py-1.5 text-amber-300 text-xs border-r border-amber-900 underline decoration-dotted cursor-default">{label}</td>
      {loadouts.map((loadout, idx) => {
        const val = getValue(loadout);
        return (
          <td key={loadout.id} className={`px-4 py-1.5 ${color} text-sm text-center ${idx < loadouts.length - 1 ? 'border-r border-amber-900' : ''}`}>
            {val != null ? (format ? format(val) : val) : 'N/A'}
          </td>
        );
      })}
    </tr>
  );

  const SectionRow = ({ label }) => (
    <tr className="border-b border-amber-900 bg-gray-900">
      <td colSpan={loadouts.length + 1} className="px-4 py-1 text-amber-600 text-xs italic">{label}</td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-800 border-2 border-amber-900 rounded overflow-hidden">
        <div className="bg-gray-900 border-b-2 border-amber-900 p-3">
          <h2 className="text-amber-100 font-bold text-sm">Results</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-amber-900">
                <th className="text-left px-4 py-2 border-r border-amber-900 w-32"></th>
                {loadouts.map((loadout, idx) => <ColHeader key={loadout.id} loadout={loadout} idx={idx} />)}
              </tr>
            </thead>
            <tbody>
              {/* Always visible */}
              <DataRow label="Max hit" getValue={l => l.results?.maxHit} />
              <DataRow label="DPS" getValue={l => l.results?.dps} color="text-green-400" />
              <DataRow label="Avg. TTK" getValue={l => l.results?.ttk} format={v => `${v}s`} />
              <DataRow label="Accuracy" getValue={l => l.results?.accuracy} format={v => `${v}%`} />

              {!showMore && (
                <DataRow label="Spec expected hit" getValue={l => l.results?.specExpectedHit} />
              )}

              {showMore && (
                <>
                  <DataRow label="Expected hit" getValue={l => l.results?.avgHit} />
                  <SectionRow label="Rolls" />
                  <DataRow label="Attack roll" getValue={l => l.results?.attackRoll} />
                  <DataRow label="NPC def roll" getValue={l => l.results?.npcDefRoll} />
                  <SectionRow label="Special attack" />
                  <DataRow label="Accuracy" getValue={l => l.results?.specAccuracy} format={v => `${v}%`} />
                  <DataRow label="Max hit" getValue={l => l.results?.specMaxHit} />
                  <DataRow label="Expected hit" getValue={l => l.results?.specExpectedHit} />
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Show more/less toggle */}
        <div className="border-t-2 border-amber-900 bg-gray-900 flex items-center justify-between px-4 py-2">
          <span className="text-amber-600 text-sm">{showMore ? '↑' : '↓'}</span>
          <button
            onClick={() => setShowMore(v => !v)}
            className="text-amber-500 hover:text-amber-300 text-sm font-semibold transition"
          >
            {showMore ? 'Show less' : 'Show more'}
          </button>
          <span className="text-amber-600 text-sm">{showMore ? '↑' : '↓'}</span>
        </div>
      </div>

      <KillSimulator loadouts={loadouts} selectedMonster={selectedMonster} npcCount={npcCount} onNpcCountChange={onNpcCountChange} />
    </div>
  );
}