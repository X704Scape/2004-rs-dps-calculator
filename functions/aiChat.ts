import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { messages, playerStats, playerLevels, availableMonsters, opponentStats, opponentName: bodyOpponentName } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Missing messages array' }, { status: 400 });
    }

    const systemPrompt = `You are a chill, knowledgeable 2004 RuneScape veteran helping a friend optimise their gear on a specific 2004-era private server. Talk like a real player — casual, helpful, a bit of banter. No bullet point lists, no robotic formatting, just friendly chat. Keep replies short and punchy unless asked for detail.

CRITICAL RULE — GEAR RECOMMENDATIONS:
- NEVER name specific items, weapons, armour, or gear in your text responses. You do not have knowledge of what items exist on this server.
- ALL gear recommendations MUST come from the optimizer results. The optimizer reads directly from the server's item database and is the only source of truth.

You MUST always respond with a JSON object with these fields:
- "message": your conversational reply (string, required)
- "actionType": one of "optimize", "optimize_weapon_only", "stake", or "" (empty string if no action needed)
- "monsterName": the monster name (string) if actionType is optimize or optimize_weapon_only, else ""
- "combatStyles": array of styles like ["melee"], ["ranged"], ["melee","ranged"] — required if actionType is optimize or optimize_weapon_only
- "opponentName": opponent username if actionType is stake, else ""
- "weaponOnly": true if the user specifies only a specific weapon with no other gear (e.g. "only dragon longswords", "just dlong", "weapon only"), else false
- "forcedItems": list every specific item the user names (weapons, armour, ammo, shields — anything). E.g. if they say "rune scimitar and rune kiteshield", set forcedItems=["Rune scimitar","Rune kiteshield"]. If they say "iron knives", set forcedItems=["Iron knife"]. Empty array if no specific items named.

WHEN TO SET actionType:
- "optimize": user wants gear for a monster AND you know which monster AND which combat style(s). Set monsterName and combatStyles.
- "optimize_weapon_only": user wants only the best weapon (no full setup) for a monster. Set monsterName and combatStyles.
- "stake": user mentions staking/pvp/dueling against a specific player. Set opponentName if mentioned. ALWAYS trigger immediately — never ask for clarification on stake requests.
- "": any other case (asking questions, clarifying, general chat)

FLOW:
- Be aggressive about recognising intent. When in doubt, trigger the action rather than asking.
- If combat style is clear (e.g. "best melee for dragons") — set actionType immediately.
- If ambiguous, ask ONE casual question like "Want melee, ranged, magic, or a mix?" and set actionType to "".
- If the user answers a style question (e.g. "melee", "ranged"), look at the conversation history to find the monster name and set actionType = "optimize" with that monsterName.
- If no monster is mentioned, ask which monster and set actionType to "".

STAKE RECOGNITION — be smart:
- Any message like "stake X", "pk X", "fight X", "vs X", "1v1 X" where X is a username — set actionType = "stake", opponentName = X. Do NOT ask for clarification.
- If the message mentions "only [weapon]" or "with [weapon]" during a stake — still set actionType = "stake". The weapon constraint is noted in your message but the optimizer handles gear selection.
- Examples that should ALL immediately trigger stake:
  - "stake x7 with dragon longswords" → actionType=stake, opponentName=x7
  - "can you x7 stake pk with only dragon longswords" → actionType=stake, opponentName=x7
  - "1v1 zezima" → actionType=stake, opponentName=zezima
  - "pk fight vs noob123" → actionType=stake, opponentName=noob123

Available monsters: ${availableMonsters ? availableMonsters.slice(0, 80).map(m => m.name).join(', ') : 'various monsters'}`;

    const conversationText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\n--- CONVERSATION ---\n${conversationText}\nAssistant:`;

    const llmResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The conversational reply to show the user' },
          actionType: { type: 'string', description: 'One of: optimize, optimize_weapon_only, stake, or empty string if no action' },
          monsterName: { type: 'string', description: 'Monster name if actionType is optimize or optimize_weapon_only, else empty string' },
          combatStyles: { type: 'array', items: { type: 'string' }, description: 'e.g. ["melee"] or ["ranged"] or ["melee","ranged"]' },
          opponentName: { type: 'string', description: 'Opponent username if actionType is stake, else empty string' },
          weaponOnly: { type: 'boolean', description: 'true if user wants weapon-only (no armour), false otherwise' },
          forcedItems: { type: 'array', items: { type: 'string' }, description: 'List of specific item names the user wants locked in (e.g. ["Magic shortbow", "Rune arrow", "Rune kiteshield", "Rune scimitar"]). Include ALL items the user explicitly names. Empty array if none specified.' },
        },
        required: ['message', 'actionType']
      }
    });

    const message = llmResp?.message || 'Sorry, something went wrong.';
    const actionType = llmResp?.actionType || '';
    let action = null;

    if (actionType === 'optimize' || actionType === 'optimize_weapon_only') {
      action = {
        type: actionType,
        monsterName: llmResp?.monsterName || '',
        combatStyles: llmResp?.combatStyles?.length ? llmResp.combatStyles : ['melee'],
        forcedItems: llmResp?.forcedItems || [],
      };
    } else if (actionType === 'stake') {
      action = {
        type: 'stake',
        opponentName: llmResp?.opponentName || bodyOpponentName || null,
        weaponOnly: llmResp?.weaponOnly || false,
        forcedItems: llmResp?.forcedItems || [],
      };
      if (!opponentStats) {
        action.needsOpponentLookup = true;
      }
    }

    return Response.json({ message, action, optimizerResults: null });

  } catch (error) {
    console.error('AI Chat error:', error?.message, error?.stack);
    return Response.json({ message: `Error: ${error.message}`, action: null, optimizerResults: null });
  }
});