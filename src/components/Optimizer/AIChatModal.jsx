import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Wand2, Loader2, Send, ChevronDown, ChevronUp, User, Check, Swords } from 'lucide-react';

function GearList({ equipment }) {
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
        {expanded ? 'Hide gear' : `Show gear (${filled.length} slots)`}
      </button>
      {expanded && (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {filled.map(slot => {
            const item = equipment[slot];
            return (
              <div key={slot} className="flex items-center gap-1.5 bg-gray-950 rounded px-2 py-1">
                {item.icon && (
                  <img src={item.icon} alt={item.name} className="w-5 h-5 object-contain" onError={e => e.target.style.display = 'none'} />
                )}
                <div className="min-w-0">
                  <div className="text-amber-500 text-xs capitalize">{slot}</div>
                  <div className="text-amber-200 text-xs truncate">{item.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const NEW_LOADOUT_SENTINEL = '__new__';

function LoadoutCard({ loadout, onApply, availableLoadouts, onCreateAndApply }) {
  const [selectedSlot, setSelectedSlot] = useState(String(availableLoadouts?.[0]?.id ?? 1));

  const handleApply = () => {
    if (selectedSlot === NEW_LOADOUT_SENTINEL) {
      onCreateAndApply(loadout);
    } else {
      onApply(loadout, Number(selectedSlot));
    }
  };

  return (
    <div className="bg-gray-950 border border-amber-800 rounded p-3 mt-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span className="text-amber-300 font-bold text-sm capitalize">{loadout.combatType}</span>
          <span className="ml-2 text-green-400 font-semibold text-sm">{loadout.dps} DPS</span>
        </div>
        <div className="flex items-center gap-1">
          <select
            value={selectedSlot}
            onChange={e => setSelectedSlot(e.target.value)}
            className="bg-gray-800 border border-amber-800 rounded px-1 py-1 text-amber-100 text-xs"
          >
            {availableLoadouts.map((l, idx) => (
              <option key={l.id} value={String(l.id)}>Loadout {idx + 1}</option>
            ))}
            <option value={NEW_LOADOUT_SENTINEL}>+ Create New Loadout</option>
          </select>
          <button
            onClick={handleApply}
            className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-amber-100 text-xs rounded font-semibold transition"
          >
            Apply
          </button>
        </div>
      </div>
      <div className="text-amber-600 text-xs mt-1">
        {loadout.equipment?.weapon?.name || 'No weapon'}
        {loadout.equipment?.ammo ? ` + ${loadout.equipment.ammo.name}` : ''}
      </div>
      <GearList equipment={loadout.equipment || {}} />
    </div>
  );
}

function StakeResults({ optimizerResults }) {
  const myBestDps = optimizerResults.loadouts[0]?.dps || 0;
  const oppDps = optimizerResults.opponentDps || 0;
  const myWins = myBestDps > oppDps;
  const tie = myBestDps === oppDps;

  return (
    <div className="mt-3 border border-amber-700 rounded overflow-hidden">
      <div className="bg-amber-900/40 px-3 py-2 text-xs font-bold text-amber-300 flex items-center gap-2">
        <Swords className="w-3 h-3" />
        Stake Analysis vs {optimizerResults.opponentName}
      </div>
      <div className="grid grid-cols-2 divide-x divide-amber-900/50">
        <div className="p-3 text-center">
          <div className="text-amber-500 text-xs mb-1">Your best DPS</div>
          <div className="text-green-400 font-bold text-lg">{myBestDps}</div>
          <div className="text-amber-700 text-xs capitalize">{optimizerResults.loadouts[0]?.combatType}</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-amber-500 text-xs mb-1">{optimizerResults.opponentName}'s est. DPS</div>
          <div className="text-red-400 font-bold text-lg">{oppDps || '?'}</div>
          <div className="text-amber-700 text-xs">melee (gear unknown)</div>
        </div>
      </div>
      {(myBestDps > 0 || oppDps > 0) && (
        <div className={`px-3 py-2 text-center text-xs font-bold ${tie ? 'text-amber-400 bg-amber-900/20' : myWins ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
          {tie ? '🤝 Roughly even' : myWins ? `✅ You win (${((myBestDps / (oppDps || 1) - 1) * 100).toFixed(0)}% more DPS)` : `⚠️ They out-DPS you — change your setup!`}
        </div>
      )}
      <div className="px-3 py-1 text-amber-800 text-xs bg-gray-950">
        Note: opponent DPS is estimated without knowing their gear.
      </div>
    </div>
  );
}

function ChatMessage({ msg, onApply, onCreateAndApply, availableLoadouts }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? 'bg-amber-900/40 border border-amber-800' : 'bg-gray-900 border border-gray-700'} rounded-lg px-3 py-2`}>
        {!isUser && (
          <div className="flex items-center gap-1 mb-1">
            <Wand2 className="w-3 h-3 text-amber-500" />
            <span className="text-amber-500 text-xs font-semibold">AI Advisor</span>
          </div>
        )}
        <p className="text-amber-100 text-sm whitespace-pre-wrap">{msg.content}</p>

        {/* Style selection buttons */}
        {msg.styleChoices && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.styleChoices.map(choice => (
              <button
                key={choice.value}
                onClick={() => onApply({ type: 'styleChoice', value: choice.value, monsterName: msg.monsterName })}
                className="px-3 py-1.5 bg-amber-800 hover:bg-amber-700 border border-amber-600 rounded text-amber-100 text-xs font-semibold transition"
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        {/* Stake results summary */}
        {msg.optimizerResults?.stakeMode && (
          <StakeResults optimizerResults={msg.optimizerResults} />
        )}

        {/* Weapon-only label */}
        {msg.optimizerResults?.weaponOnly && (
          <div className="mt-2 text-amber-600 text-xs">Weapon-only setup (no armour)</div>
        )}

        {/* Optimizer results */}
        {msg.optimizerResults?.loadouts?.map((loadout, i) => (
          <LoadoutCard
            key={i}
            loadout={loadout}
            availableLoadouts={availableLoadouts}
            onApply={(l, targetId) => onApply({ type: 'applyLoadout', loadout: l, monster: msg.optimizerResults.monster, targetLoadoutId: targetId })}
            onCreateAndApply={(l) => onCreateAndApply({ loadout: l, monster: msg.optimizerResults.monster })}
          />
        ))}
      </div>
    </div>
  );
}

const STYLE_CHOICES = [
  { label: '⚔️ Melee', value: 'melee' },
  { label: '🏹 Ranged', value: 'ranged' },
  { label: '⚔️🏹 Both', value: 'both' },
];

export default function AIChatModal({ playerStats, monster, availableMonsters, loadouts, onApplyLoadout, onSetMonster, onCreateLoadout, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hey! Ask me anything — "best gear for Blue Dragons", "weapon only for Lesser Demons", or "I want to stake [username]" and I\'ll run the numbers for you.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Player username lookup
  const [usernameInput, setUsernameInput] = useState('');
  const [fetchedStats, setFetchedStats] = useState(null);
  const [fetchedUsername, setFetchedUsername] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [usernameDismissed, setUsernameDismissed] = useState(false);

  // Stake opponent lookup
  const [pendingStake, setPendingStake] = useState(false);
  const [stakeOpponentInput, setStakeOpponentInput] = useState('');
  const [stakeOpponentStats, setStakeOpponentStats] = useState(null);
  const [stakeOpponentName, setStakeOpponentName] = useState('');
  const [stakeLoading, setStakeLoading] = useState(false);
  const [stakeError, setStakeError] = useState('');

  const handleLookupStats = async () => {
    if (!usernameInput.trim()) return;
    setStatsLoading(true);
    setStatsError('');
    try {
      const resp = await base44.functions.invoke('fetchHiscores', { username: usernameInput.trim() });
      if (resp.data?.stats) {
        setFetchedStats(resp.data.stats);
        setFetchedUsername(usernameInput.trim());
      } else {
        setStatsError('Player not found.');
      }
    } catch (e) {
      setStatsError('Could not fetch stats. Try again.');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleStakeLookup = async () => {
    if (!stakeOpponentInput.trim()) return;
    setStakeLoading(true);
    setStakeError('');
    try {
      const resp = await base44.functions.invoke('fetchHiscores', { username: stakeOpponentInput.trim() });
      if (resp.data?.stats) {
        const stats = resp.data.stats;
        const name = stakeOpponentInput.trim();
        setStakeOpponentStats(stats);
        setStakeOpponentName(name);
        setPendingStake(false);
        setStakeOpponentInput('');
        // Auto-send with opponent stats
        await sendMessage(`Stake analysis vs ${name}`, { opponentStats: stats, opponentName: name });
      } else {
        setStakeError('Player not found on hiscores.');
      }
    } catch (e) {
      setStakeError('Could not look up that player. Try again.');
    } finally {
      setStakeLoading(false);
    }
  };

  const effectiveStats = fetchedStats ? { ...playerStats, ...fetchedStats } : playerStats;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const runOptimizer = async (action, oppStats, oppName) => {
    const monsterName = action.monsterName?.toLowerCase() || '';
    const foundMonster = availableMonsters?.find(m =>
      m.name?.toLowerCase() === monsterName ||
      m.name?.toLowerCase().includes(monsterName) ||
      monsterName.includes(m.name?.toLowerCase())
    );

    if (action.type === 'stake' && oppStats) {
      // PVP stake mode — use aiOptimizer with PVP monster (0 bonuses, use opponent defence level)
      const pvpMonster = {
        name: oppName || 'Opponent',
        defence: oppStats.defence || 1,
        defenceStab: 0, defenceSlash: 0, defenceCrush: 0,
        defenceRanged: 0, defenceMagic: 0,
        hitpoints: oppStats.hitpoints || 99
      };
      const myPvpMonster = {
        name: 'You', defence: effectiveStats.defence || 1,
        defenceStab: 0, defenceSlash: 0, defenceCrush: 0, defenceRanged: 0, defenceMagic: 0,
        hitpoints: effectiveStats.hitpoints || 99
      };

      const weaponOnly = action.weaponOnly || false;
      const forcedItems = action.forcedItems || [];
      const [myResp, oppResp] = await Promise.all([
        base44.functions.invoke('aiOptimizer', { playerStats: effectiveStats, monster: pvpMonster, combatStyle: 'melee', playerLevels: fetchedStats || null, weaponOnly, forcedItems }),
        base44.functions.invoke('aiOptimizer', { playerStats: { attack: oppStats.attack || 1, strength: oppStats.strength || 1, ranged: oppStats.ranged || 1, magic: oppStats.magic || 1, defence: oppStats.defence || 1, prayerActive: { attack: 'none', strength: 'none' }, style: 'aggressive' }, monster: myPvpMonster, combatStyle: 'melee', playerLevels: oppStats, weaponOnly, forcedItems }),
      ]);

      const myLoadouts = myResp.data?.results || [];
      const oppLoadouts = oppResp.data?.results || [];

      return {
        monster: pvpMonster,
        loadouts: myLoadouts,
        stakeMode: true,
        opponentName: oppName || 'Opponent',
        opponentDps: oppLoadouts[0]?.dps || null,
        opponentStats: oppStats
      };
    }

    if (!foundMonster) return null;

    const combatStyles = action.combatStyles || ['melee'];
    const weaponOnly = action.type === 'optimize_weapon_only';
    const styleStr = combatStyles.length > 1 ? 'all' : combatStyles[0];

    const resp = await base44.functions.invoke('aiOptimizer', {
      playerStats: effectiveStats,
      monster: foundMonster,
      combatStyle: styleStr,
      playerLevels: fetchedStats || null,
      weaponOnly: weaponOnly || false,
      forcedItems: action.forcedItems || [],
    });

    const results = resp.data?.results || [];
    return { monster: foundMonster, loadouts: results, weaponOnly };
  };

  const sendMessage = async (userText, extraPayload = {}) => {
    if (!userText.trim()) return;
    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Step 1: fast LLM chat call
      const resp = await base44.functions.invoke('aiChat', {
        messages: newMessages.filter(m => !m.styleChoices && !m.optimizerResults).map(m => ({
          role: m.role,
          content: m.content
        })),
        playerStats: effectiveStats,
        playerLevels: fetchedStats || null,
        availableMonsters: availableMonsters || [],
        opponentStats: extraPayload.opponentStats || stakeOpponentStats || null,
        opponentName: extraPayload.opponentName || stakeOpponentName || null,
      });

      const data = resp.data;
      const action = data.action;

      const aiMsg = {
        role: 'assistant',
        content: data.message || 'Sorry, something went wrong.',
        optimizerResults: null,
      };

      // Stake with no opponent — show lookup banner
      if (action?.type === 'stake' && action?.needsOpponentLookup) {
        setPendingStake(true);
        if (action.opponentName) setStakeOpponentInput(action.opponentName);
        setMessages(prev => [...prev, aiMsg]);
        setLoading(false);
        return;
      }

      // Show the AI text immediately, then run optimizer in background
      setMessages(prev => [...prev, aiMsg]);

      const needsOptimizer = action?.type === 'optimize' || action?.type === 'optimize_weapon_only' ||
        (action?.type === 'stake' && (extraPayload.opponentStats || stakeOpponentStats));

      if (needsOptimizer) {
        setLoading(true);
        try {
          const optimizerResults = await runOptimizer(
            action,
            extraPayload.opponentStats || stakeOpponentStats,
            extraPayload.opponentName || stakeOpponentName
          );

          if (optimizerResults) {
            if (optimizerResults.monster && onSetMonster) onSetMonster(optimizerResults.monster);
            // Update the last assistant message with results
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = { ...updated[lastIdx], optimizerResults };
              }
              return updated;
            });
          } else if (action?.type === 'optimize') {
            // Monster not found — offer style choices
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = { ...updated[lastIdx], styleChoices: STYLE_CHOICES, monsterName: action.monsterName };
              }
              return updated;
            });
          }
        } catch (e) {
          console.error('Optimizer error:', e);
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e.message || 'Something went wrong. Please try again.'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (interaction) => {
    if (interaction.type === 'styleChoice') {
      const styleLabel = interaction.value === 'both' ? 'melee and ranged' : interaction.value;
      const combatStyles = interaction.value === 'both' ? ['melee', 'ranged'] : [interaction.value];
      const userMsg = { role: 'user', content: styleLabel };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setLoading(true);
      try {
        const aiMsg = { role: 'assistant', content: `Running optimizer for ${styleLabel}...`, optimizerResults: null };
        setMessages(prev => [...prev, aiMsg]);

        const optimizerResults = await runOptimizer(
          { type: 'optimize', monsterName: interaction.monsterName, combatStyles },
          null, null
        );

        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: optimizerResults ? `Here are the best ${styleLabel} loadouts!` : `Couldn't find that monster. Try a different name?`,
              optimizerResults: optimizerResults || null,
            };
          }
          return updated;
        });

        if (optimizerResults?.monster && onSetMonster) onSetMonster(optimizerResults.monster);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
      } finally {
        setLoading(false);
      }
    } else if (interaction.type === 'applyLoadout') {
      if (interaction.monster && onSetMonster) onSetMonster(interaction.monster);
      onApplyLoadout(interaction.loadout.equipment, interaction.loadout.combatType, interaction.loadout.style, interaction.targetLoadoutId, fetchedStats || null);
    }
  };

  const handleCreateAndApply = ({ loadout, monster }) => {
    if (monster && onSetMonster) onSetMonster(monster);
    const newId = onCreateLoadout?.();
    if (newId != null) {
      onApplyLoadout(loadout.equipment, loadout.combatType, loadout.style, newId, fetchedStats || null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const QUICK_QUESTIONS = [
    'Best gear for Blue Dragons?',
    'Weapon only for Lesser Demons?',
    'I want to stake someone',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-800 border-2 border-amber-900 rounded-lg w-full max-w-lg flex flex-col" style={{ height: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-amber-100 font-bold text-lg">AI Advisor</h2>
            <span className="text-amber-700 text-xs">gear · staking · weapon-only</span>
          </div>
          <button onClick={onClose} className="text-amber-700 hover:text-amber-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player username lookup banner */}
        {!usernameDismissed && !fetchedStats && (
          <div className="px-4 py-3 bg-gray-900 border-b border-amber-900/50 flex-shrink-0">
            <p className="text-amber-400 text-xs mb-2 flex items-center gap-1">
              <User className="w-3 h-3" />
              Enter your username to filter gear by your skill levels (optional)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookupStats()}
                placeholder="Your Lost City username..."
                className="flex-1 bg-gray-800 border border-amber-900 rounded px-2 py-1 text-amber-100 text-xs placeholder-amber-800 focus:outline-none focus:border-amber-600"
              />
              <button onClick={handleLookupStats} disabled={statsLoading || !usernameInput.trim()} className="px-2 py-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-100 text-xs rounded transition">
                {statsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Lookup'}
              </button>
              <button onClick={() => setUsernameDismissed(true)} className="px-2 py-1 text-amber-700 hover:text-amber-400 text-xs transition">Skip</button>
            </div>
            {statsError && <p className="text-red-400 text-xs mt-1">{statsError}</p>}
          </div>
        )}

        {/* Fetched stats confirmation bar */}
        {fetchedStats && (
          <div className="px-4 py-2 bg-green-900/30 border-b border-green-800/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-300 text-xs font-semibold">{fetchedUsername}</span>
              <span className="text-green-600 text-xs">
                — Atk {fetchedStats.attack} · Str {fetchedStats.strength} · Def {fetchedStats.defence} · Rng {fetchedStats.ranged} · Mag {fetchedStats.magic}
              </span>
            </div>
            <button onClick={() => { setFetchedStats(null); setFetchedUsername(''); setUsernameDismissed(false); }} className="text-green-700 hover:text-green-400 text-xs transition">×</button>
          </div>
        )}

        {/* Stake opponent lookup banner */}
        {pendingStake && (
          <div className="px-4 py-3 bg-gray-900 border-b border-amber-700 flex-shrink-0">
            <p className="text-amber-300 text-xs mb-2 flex items-center gap-1">
              <Swords className="w-3 h-3" />
              Who are you staking? Enter their username to look up their stats.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={stakeOpponentInput}
                onChange={e => setStakeOpponentInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStakeLookup()}
                placeholder="Opponent's username..."
                className="flex-1 bg-gray-800 border border-amber-700 rounded px-2 py-1 text-amber-100 text-xs placeholder-amber-800 focus:outline-none focus:border-amber-500"
              />
              <button onClick={handleStakeLookup} disabled={stakeLoading || !stakeOpponentInput.trim()} className="px-2 py-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-amber-100 text-xs rounded transition">
                {stakeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Lookup'}
              </button>
              <button onClick={() => setPendingStake(false)} className="px-2 py-1 text-amber-700 hover:text-amber-400 text-xs transition">Cancel</button>
            </div>
            {stakeError && <p className="text-red-400 text-xs mt-1">{stakeError}</p>}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} onApply={handleInteraction} onCreateAndApply={handleCreateAndApply} availableLoadouts={loadouts} />
          ))}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                <span className="text-amber-600 text-xs">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1 flex-shrink-0">
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)} className="text-xs px-2 py-1 bg-gray-900 hover:bg-gray-700 border border-amber-900 rounded text-amber-400 transition">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-amber-900 flex gap-2 flex-shrink-0">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about gear, staking, best weapon..."
            className="flex-1 bg-gray-900 border border-amber-900 rounded px-3 py-2 text-amber-100 text-sm placeholder-amber-800 focus:outline-none focus:border-amber-600"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-amber-100 rounded transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}