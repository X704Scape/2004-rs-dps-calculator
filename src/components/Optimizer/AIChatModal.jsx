import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Wand2, Loader2, Send, ChevronDown, ChevronUp, User, Check } from 'lucide-react';

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

function LoadoutCard({ loadout, onApply, availableLoadouts }) {
  const [selectedSlot, setSelectedSlot] = useState(availableLoadouts?.[0]?.id ?? 1);
  return (
    <div className="bg-gray-950 border border-amber-800 rounded p-3 mt-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span className="text-amber-300 font-bold text-sm capitalize">{loadout.combatType}</span>
          <span className="ml-2 text-green-400 font-semibold text-sm">{loadout.dps} DPS</span>
        </div>
        <div className="flex items-center gap-1">
          {availableLoadouts && availableLoadouts.length > 1 && (
            <select
              value={selectedSlot}
              onChange={e => setSelectedSlot(Number(e.target.value))}
              className="bg-gray-800 border border-amber-800 rounded px-1 py-1 text-amber-100 text-xs"
            >
              {availableLoadouts.map((l, idx) => (
                <option key={l.id} value={l.id}>Loadout {idx + 1}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => onApply(loadout, selectedSlot)}
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

function ChatMessage({ msg, onApply, availableLoadouts }) {
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

        {/* Optimizer results */}
        {msg.optimizerResults?.loadouts?.map((loadout, i) => (
          <LoadoutCard
            key={i}
            loadout={loadout}
            availableLoadouts={availableLoadouts}
            onApply={(l, targetId) => onApply({ type: 'applyLoadout', loadout: l, monster: msg.optimizerResults.monster, targetLoadoutId: targetId })}
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

export default function AIChatModal({ playerStats, monster, availableMonsters, loadouts, onApplyLoadout, onSetMonster, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hey adventurer! Ask me anything — like "What\'s the best DPS for Blue Dragons?" or "What gear should I use against Lesser Demons?" I\'ll help you find the optimal loadout!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Username / stats lookup
  const [usernameInput, setUsernameInput] = useState('');
  const [fetchedStats, setFetchedStats] = useState(null);
  const [fetchedUsername, setFetchedUsername] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [usernameDismissed, setUsernameDismissed] = useState(false);

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

  // Merge fetched stats with playerStats (fetched takes priority for levels)
  const effectiveStats = fetchedStats
    ? { ...playerStats, ...fetchedStats }
    : playerStats;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (userText) => {
    if (!userText.trim()) return;
    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const resp = await base44.functions.invoke('aiChat', {
        messages: newMessages.filter(m => !m.styleChoices && !m.optimizerResults).map(m => ({
          role: m.role,
          content: m.content
        })),
        playerStats,
        availableMonsters: availableMonsters || [],
      });

      const data = resp.data;
      const aiMsg = {
        role: 'assistant',
        content: data.message || 'Sorry, something went wrong.',
        optimizerResults: data.optimizerResults || null,
      };

      // If action is to optimize but monster wasn't found, offer style choices anyway
      if (data.action?.type === 'optimize' && !data.optimizerResults) {
        aiMsg.content = data.message || `I found "${data.action.monsterName}" — which combat style would you like?`;
        aiMsg.styleChoices = STYLE_CHOICES;
        aiMsg.monsterName = data.action.monsterName;
      }

      // If optimizer ran successfully, set the monster automatically
      if (data.optimizerResults?.monster && onSetMonster) {
        onSetMonster(data.optimizerResults.monster);
      }

      setMessages(prev => [...prev, aiMsg]);
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
      const styles = interaction.value === 'both' ? ['melee', 'ranged'] :
                     interaction.value === 'melee' ? ['melee'] : ['ranged'];
      const styleLabel = interaction.value === 'both' ? 'melee and ranged' : interaction.value;
      const userMsg = { role: 'user', content: `${styleLabel}` };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setLoading(true);

      try {
        // Find the monster from available list
        const monsterName = interaction.monsterName?.toLowerCase() || '';
        const foundMonster = availableMonsters?.find(m =>
          m.name?.toLowerCase() === monsterName ||
          m.name?.toLowerCase().includes(monsterName) ||
          monsterName.includes(m.name?.toLowerCase())
        );

        const resp = await base44.functions.invoke('aiChat', {
          messages: [
            ...newMessages.filter(m => !m.styleChoices && !m.optimizerResults).map(m => ({ role: m.role, content: m.content })),
          ],
          playerStats,
          availableMonsters: availableMonsters || [],
        });

        const data = resp.data;
        const aiMsg = {
          role: 'assistant',
          content: data.message || `Here are the best ${styleLabel} loadouts!`,
          optimizerResults: data.optimizerResults || null,
        };

        if (data.optimizerResults?.monster && onSetMonster) {
          onSetMonster(data.optimizerResults.monster);
        }

        setMessages(prev => [...prev, aiMsg]);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
      } finally {
        setLoading(false);
      }
    } else if (interaction.type === 'applyLoadout') {
      if (interaction.monster && onSetMonster) {
        onSetMonster(interaction.monster);
      }
      onApplyLoadout(interaction.loadout.equipment, interaction.loadout.combatType, interaction.loadout.style, interaction.targetLoadoutId);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const QUICK_QUESTIONS = [
    'Best gear for Blue Dragons?',
    'What kills Lesser Demons fastest?',
    'Best ranged setup for Hill Giants?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-800 border-2 border-amber-900 rounded-lg w-full max-w-lg flex flex-col" style={{ height: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-amber-100 font-bold text-lg">AI Advisor</h2>
            <span className="text-amber-700 text-xs">Ask anything about gear & monsters</span>
          </div>
          <button onClick={onClose} className="text-amber-700 hover:text-amber-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} onApply={handleInteraction} availableLoadouts={loadouts} />
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
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-2 py-1 bg-gray-900 hover:bg-gray-700 border border-amber-900 rounded text-amber-400 transition"
              >
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
            placeholder="Ask about gear, monsters, best DPS..."
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