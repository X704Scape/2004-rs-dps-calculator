import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Wand2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const BUDGET_OPTIONS = [
  { label: 'No limit (Best in Slot)', value: null },
  { label: '≤ 25,000 gp (Starter)', value: 25000 },
  { label: '≤ 100,000 gp', value: 100000 },
  { label: '≤ 500,000 gp', value: 500000 },
  { label: '≤ 1,000,000 gp (1M)', value: 1000000 },
  { label: '≤ 5,000,000 gp (5M)', value: 5000000 },
];

const COMBAT_OPTIONS = [
  { label: 'All styles', value: 'all' },
  { label: 'Melee only', value: 'melee' },
  { label: 'Ranged only', value: 'ranged' },
];

function EquipmentDisplay({ equipment, combatType }) {
  const [expanded, setExpanded] = useState(false);
  const slots = ['weapon', 'ammo', 'head', 'neck', 'cape', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];
  const filled = slots.filter(s => equipment[s]);

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-amber-500 hover:text-amber-300 text-xs"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide gear' : 'Show gear'}
      </button>
      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {filled.map(slot => {
            const item = equipment[slot];
            return (
              <div key={slot} className="flex items-center gap-1.5 bg-gray-900 rounded px-2 py-1">
                {item.icon && (
                  <img src={item.icon} alt={item.name} className="w-5 h-5 object-contain" onError={e => e.target.style.display = 'none'} />
                )}
                <div className="min-w-0">
                  <div className="text-amber-200 text-xs truncate capitalize">{slot}</div>
                  <div className="text-amber-400 text-xs truncate">{item.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result, onApply, label }) {
  return (
    <div className="bg-gray-900 border border-amber-900 rounded p-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-amber-300 font-bold text-sm">{label || `${result.combatType} (${result.style})`}</span>
          <span className="ml-2 text-green-400 font-bold text-sm">{result.dps} DPS</span>
        </div>
        <button
          onClick={() => onApply(result)}
          className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-amber-100 text-xs rounded font-semibold transition"
        >
          Apply
        </button>
      </div>
      <div className="text-amber-600 text-xs">
        {result.equipment?.weapon?.name || 'No weapon'}
        {result.equipment?.ammo ? ` + ${result.equipment.ammo.name}` : ''}
      </div>
      <EquipmentDisplay equipment={result.equipment || {}} combatType={result.combatType} />
    </div>
  );
}

export default function OptimizerModal({ playerStats, monster, onApplyLoadout, onClose }) {
  const [budget, setBudget] = useState(null);
  const [combatStyle, setCombatStyle] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showTiers, setShowTiers] = useState(false);

  const runOptimizer = async () => {
    if (!monster) {
      setError('Please select a monster first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const resp = await base44.functions.invoke('aiOptimizer', {
        playerStats,
        monster: {
          hitpoints: monster.hitpoints,
          attack: monster.attack,
          defence: monster.defence,
          ranged: monster.ranged,
          magic: monster.magic,
          defenceStab: monster.defenceStab,
          defenceSlash: monster.defenceSlash,
          defenceCrush: monster.defenceCrush,
          defenceRanged: monster.defenceRanged,
          defenceMagic: monster.defenceMagic,
        },
        budgetGp: budget,
        combatStyle,
      });
      setResults(resp.data);
    } catch (e) {
      setError(e.message || 'Optimization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (result) => {
    onApplyLoadout(result.equipment, result.combatType, result.style);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-800 border-2 border-amber-900 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-amber-100 font-bold text-lg">AI Gear Optimizer</h2>
          </div>
          <button onClick={onClose} className="text-amber-700 hover:text-amber-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 border-b border-amber-900 flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-amber-400 text-xs block mb-1">Budget</label>
              <select
                value={budget === null ? 'null' : budget}
                onChange={e => setBudget(e.target.value === 'null' ? null : Number(e.target.value))}
                className="w-full bg-gray-900 border border-amber-900 rounded px-2 py-1.5 text-amber-100 text-sm"
              >
                {BUDGET_OPTIONS.map(o => (
                  <option key={String(o.value)} value={o.value === null ? 'null' : o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-amber-400 text-xs block mb-1">Combat Style</label>
              <select
                value={combatStyle}
                onChange={e => setCombatStyle(e.target.value)}
                className="w-full bg-gray-900 border border-amber-900 rounded px-2 py-1.5 text-amber-100 text-sm"
              >
                {COMBAT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!monster && (
            <p className="text-amber-600 text-xs">⚠ Select a monster on the calculator first for accurate results.</p>
          )}

          <button
            onClick={runOptimizer}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-amber-100 font-bold rounded transition"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing...</> : <><Wand2 className="w-4 h-4" /> Find Best Gear</>}
          </button>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {results && (
            <>
              {results.results?.length > 0 && (
                <div>
                  <h3 className="text-amber-400 font-semibold text-sm mb-2">
                    {budget !== null ? `Best gear within budget` : 'Best in Slot'}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {results.results.map((r, i) => (
                      <ResultCard
                        key={i}
                        result={r}
                        label={`#${i + 1} ${r.combatType.charAt(0).toUpperCase() + r.combatType.slice(1)} (${r.style})`}
                        onApply={handleApply}
                      />
                    ))}
                  </div>
                </div>
              )}

              {results.budgetTiers?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowTiers(v => !v)}
                    className="flex items-center gap-1 text-amber-500 hover:text-amber-300 text-sm font-semibold mb-2"
                  >
                    {showTiers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Budget Tiers
                  </button>
                  {showTiers && (
                    <div className="flex flex-col gap-2">
                      {results.budgetTiers.map((tier, i) => (
                        <ResultCard
                          key={i}
                          result={tier}
                          label={tier.label}
                          onApply={handleApply}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!results.results?.length && (
                <p className="text-amber-600 text-sm text-center">No results found. Try adjusting your budget or combat style.</p>
              )}
            </>
          )}

          {!results && !loading && (
            <p className="text-amber-700 text-sm text-center mt-4">Configure your options and click "Find Best Gear" to get recommendations based on your stats and the selected monster.</p>
          )}
        </div>
      </div>
    </div>
  );
}