import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PRAYER_STR_MULTIPLIERS = {
  none: 1.0, burst_of_strength: 1.05, superhuman_strength: 1.10, ultimate_strength: 1.15
};
const PRAYER_ATK_MULTIPLIERS = {
  none: 1.0, clarity_of_thought: 1.05, improved_reflexes: 1.10, incredible_reflexes: 1.15
};
const STYLE_BONUS = {
  aggressive: 3, aggressive_2: 3, aggressive_3: 3,
  controlled: 1, controlled_1: 1, controlled_2: 1, controlled_3: 1,
  accurate: 0, defensive: 0
};

function getEffectiveStr(lvl, prayer, style) {
  return Math.floor(lvl * prayer) + (STYLE_BONUS[style] || 0) + 8;
}
function getEffectiveAtk(lvl, prayer, style) {
  const bonus = style === 'accurate' ? 3 : (style.startsWith('controlled') ? 1 : 0);
  return Math.floor(lvl * prayer) + bonus + 8;
}
function getEffectiveRanged(lvl, prayer, style) {
  return Math.floor(lvl * prayer) + (style === 'accurate' ? 3 : 0) + 8;
}
function getAccuracy(atkRoll, defRoll) {
  if (atkRoll > defRoll) return 1 - (defRoll + 2) / (2 * (atkRoll + 1));
  return atkRoll / (2 * (defRoll + 1));
}
function getMeleeMaxHit(effStr, strBonus) {
  return Math.floor((effStr * (strBonus + 64) + 320) / 640);
}
function getRangedMaxHit(effRng, rngStrBonus) {
  return Math.floor((effRng * (rngStrBonus + 64) + 320) / 640);
}

function calcDPS({ combatType, playerStats, equipment, monster }) {
  const { attack, strength, ranged, prayerActive, style } = playerStats;
  const atkPrayer = PRAYER_ATK_MULTIPLIERS[prayerActive?.attack || 'none'] || 1.0;
  const strPrayer = PRAYER_STR_MULTIPLIERS[prayerActive?.strength || 'none'] || 1.0;
  const getBonus = (key) => Object.values(equipment).reduce((s, i) => s + (i?.[key] || 0), 0);
  let maxHit = 0, attackRoll = 0, npcDefRoll = 0;
  if (combatType === 'melee') {
    const effStr = getEffectiveStr(strength, strPrayer, style);
    const effAtk = getEffectiveAtk(attack, atkPrayer, style);
    let attackType = 'slash';
    const cat = equipment.weapon?.category || '';
    if (cat.includes('stab') || cat === 'weapon_stab') attackType = 'stab';
    else if (cat.includes('crush') || cat === 'weapon_blunt' || cat === 'weapon_spiked') attackType = 'crush';
    const eqBonus = getBonus(attackType);
    const strBonus = getBonus('strBonus');
    maxHit = getMeleeMaxHit(effStr, strBonus);
    attackRoll = effAtk * (eqBonus + 64);
    const monDef = attackType === 'stab' ? monster.defenceStab : attackType === 'crush' ? monster.defenceCrush : monster.defenceSlash;
    npcDefRoll = (monster.defence + 9) * ((monDef || 0) + 64);
  } else if (combatType === 'ranged') {
    const effRng = getEffectiveRanged(ranged, strPrayer, style);
    const rngStr = getBonus('rangedStrBonus');
    const rngAtk = getBonus('ranged');
    maxHit = getRangedMaxHit(effRng, rngStr);
    attackRoll = effRng * (rngAtk + 64);
    npcDefRoll = (monster.defence + 9) * ((monster.defenceRanged || 0) + 64);
  } else {
    return 0;
  }
  const accuracy = getAccuracy(attackRoll, npcDefRoll);
  const weapon = equipment.weapon;
  let speedTicks = weapon?.attackRate || 4;
  if (combatType === 'ranged' && style === 'rapid') speedTicks = Math.max(1, speedTicks - 1);
  const avgHit = (maxHit / 2) * accuracy;
  return avgHit / (speedTicks * 0.6);
}

function detectCombatType(weapon) {
  if (!weapon) return 'melee';
  const cat = weapon.category?.toLowerCase() || '';
  const name = weapon.name?.toLowerCase() || '';
  if (cat.includes('bow') || cat.includes('thrown') || cat.includes('crossbow') ||
      name.includes('bow') || name.includes('dart') || name.includes('knife') ||
      name.includes('javelin') || name.includes('thrownaxe')) {
    return 'ranged';
  }
  return 'melee';
}

// Banned items (mod items, unobtainable, etc.)
const BANNED_SUBSTRINGS = [
  '(p)', 'poisoned', 'mod ', 'gm ', 'dev ', 'debug', 'null', 'placeholder',
  'staff of light', // future item
];

function isBannedItem(name) {
  const lower = name.toLowerCase();
  return BANNED_SUBSTRINGS.some(b => lower.includes(b));
}

async function fetchAllItems() {
  const ITEM_URL = 'https://2004.losthq.rs/js/itemdb/item_data.json?v=254';
  const SLOT_ALIASES = {
    'weapon': 'weapon', 'shield': 'shield', 'head': 'head', 'body': 'body',
    'legs': 'legs', 'hands': 'hands', 'feet': 'feet', 'cape': 'cape',
    'neck': 'neck', 'ammo': 'ammo', 'ring': 'ring', 'ammunition': 'ammo',
    'quiver': 'ammo', 'righthand': 'weapon', 'lefthand': 'shield'
  };

  const itemResp = await fetch(ITEM_URL);
  const itemData = await itemResp.json();

  return itemData
    .map((item, index) => {
      const hasWieldOp = item.iops && Object.values(item.iops).some(op => op === 'Wield' || op === 'Wear');
      if (!hasWieldOp || !item.equipable_item) return null;
      const eq = item.equipable_item;
      const wearpos = eq.wearpos?.toLowerCase();
      const slot = SLOT_ALIASES[wearpos] || wearpos;
      if (!slot) return null;
      const itemName = item.name?.toLowerCase() || '';
      let category = null;
      if (itemName.includes('staff') || itemName.includes('iban')) category = 'weapon_staff';
      else if (itemName.includes('bow') && !itemName.includes('crossbow')) category = 'weapon_bow';
      else if (itemName.includes('crossbow')) category = 'weapon_crossbow';
      else if (itemName.includes('dart') || itemName.includes('knife') || itemName.includes('thrownaxe') || itemName.includes('javelin')) category = 'weapon_thrown';
      else if (itemName.includes('sword') || itemName.includes('scimitar') || itemName.includes('longsword') || itemName.includes('2h')) category = 'weapon_slash';
      else if (itemName.includes('dagger') || itemName.includes('spear')) category = 'weapon_stab';
      else if (itemName.includes('mace') || itemName.includes('warhammer') || itemName.includes('maul')) category = 'weapon_blunt';
      else if (itemName.includes('axe') && slot === 'weapon') category = 'weapon_axe';
      return {
        id: index, name: item.name || 'Unknown', slot, category,
        icon: `https://raw.githubusercontent.com/X704Scape/2004-Runescape-DPS-Calculator-Rev-254/main/icons/${index}.png`,
        stab: eq.stabattack || 0, slash: eq.slashattack || 0, crush: eq.crushattack || 0,
        strBonus: eq.strengthbonus || 0,
        ranged: eq.rangedattack || eq.rangeattack || 0,
        rangedStrBonus: eq.rangedstrengthbonus || eq.rangestrengthbonus || eq.rangebonus || 0,
        magic: eq.magicattack || 0,
        defenceStab: eq.stabdefence || 0, defenceSlash: eq.slashdefence || 0,
        defenceCrush: eq.crushdefence || 0,
        defenceRanged: eq.rangeddefence || eq.rangedefence || 0,
        defenceMagic: eq.magicdefence || 0,
        attackRate: eq.attackrate || 4,
        equipable: true,
        price: item.cost || 0
      };
    })
    .filter(item => {
      if (!item) return false;
      if (isBannedItem(item.name)) return false;
      const maxStat = Math.max(item.stab, item.slash, item.crush, item.strBonus, item.ranged, item.rangedStrBonus);
      if (maxStat > 150) return false;
      return true;
    });
}

function buildBestLoadout({ allItems, combatType, style, playerStats, monster, budgetGp }) {
  const usable = allItems.filter(item => {
    if (budgetGp !== null && item.price && item.price > budgetGp) return false;
    return true;
  });
  const bySlot = {};
  for (const item of usable) {
    if (!bySlot[item.slot]) bySlot[item.slot] = [];
    bySlot[item.slot].push(item);
  }

  const weapons = (bySlot['weapon'] || []).filter(w => detectCombatType(w) === combatType);
  if (!weapons.length) return null;

  let bestDPS = -1, bestLoadout = null;
  for (const weapon of weapons) {
    const equipment = { weapon };

    if (combatType === 'ranged') {
      const ammoOptions = bySlot['ammo'] || [];
      let bestAmmo = null, bestBonus = -1;
      for (const ammo of ammoOptions) {
        const wn = weapon.name?.toLowerCase() || '';
        const an = ammo.name?.toLowerCase() || '';
        const ac = ammo.category?.toLowerCase() || '';
        const isArrow = ac === 'arrows' || an.includes('arrow');
        const isBolt = ac === 'bolts' || an.includes('bolt');
        const isBow = wn.includes('bow') && !wn.includes('crossbow');
        const isCrossbow = wn.includes('crossbow');
        const isThrown = !isBow && !isCrossbow;
        if (isThrown) break;
        if ((isBow && isArrow) || (isCrossbow && isBolt)) {
          if ((ammo.rangedStrBonus || 0) > bestBonus) {
            bestBonus = ammo.rangedStrBonus || 0;
            bestAmmo = ammo;
          }
        }
      }
      if (bestAmmo) equipment.ammo = bestAmmo;
    }

    const wn2 = weapon.name?.toLowerCase() || '';
    const wcat2 = weapon.category?.toLowerCase() || '';
    const is2H = wn2.includes('2h') || wn2.includes('godsword') ||
      wcat2.includes('bow') || wcat2.includes('crossbow') || wcat2.includes('thrown') ||
      wn2.includes('bow') || wn2.includes('crossbow') || wn2.includes('dart') ||
      wn2.includes('knife') || wn2.includes('javelin') || wn2.includes('thrownaxe') ||
      wn2.includes('blowpipe') || combatType === 'ranged';
    const slots = ['head', 'cape', 'neck', 'body', 'shield', 'legs', 'hands', 'feet', 'ring'];
    for (const slot of slots) {
      if (slot === 'shield' && is2H) continue;
      const candidates = bySlot[slot] || [];
      let best = null, bestScore = -Infinity;
      for (const item of candidates) {
        let score = 0;
        if (combatType === 'melee') {
          score = (item.strBonus || 0) * 2 + (item.slash || 0) + (item.stab || 0) + (item.crush || 0);
        } else {
          score = (item.rangedStrBonus || 0) * 2 + (item.ranged || 0);
        }
        if (score > bestScore) { bestScore = score; best = item; }
      }
      // If no offensive bonus found, fall back to best defensive bonus for that combat type
      if (bestScore <= 0) {
        let bestDefScore = -Infinity;
        for (const item of candidates) {
          let defScore = 0;
          if (combatType === 'melee') {
            defScore = (item.defenceStab || 0) + (item.defenceSlash || 0) + (item.defenceCrush || 0);
          } else {
            defScore = (item.defenceRanged || 0) + (item.defenceStab || 0) + (item.defenceSlash || 0) + (item.defenceCrush || 0);
          }
          if (defScore > bestDefScore) { bestDefScore = defScore; best = item; }
        }
      }
      if (best) equipment[slot] = best;
    }

    const dps = calcDPS({ combatType, playerStats: { ...playerStats, style }, equipment, monster });
    if (dps > bestDPS) { bestDPS = dps; bestLoadout = equipment; }
  }

  if (!bestLoadout) return null;
  return { equipment: bestLoadout, dps: parseFloat(bestDPS.toFixed(3)) };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { messages, playerStats, availableMonsters } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Missing messages array' }, { status: 400 });
    }

    // Build context for the LLM
    const systemPrompt = `You are a helpful 2004 RuneScape DPS calculator assistant. Your job is to help players find the best gear loadouts for killing monsters.

You have access to a calculator that can compute optimal gear for melee and ranged combat styles.

When a user asks about killing a monster or what the best DPS is for something:
1. Identify the monster name from their question
2. Ask which combat style(s) they want: melee, ranged, or both
3. Once they confirm, return a structured JSON action

When returning a structured action, always include it as a JSON block at the END of your message in this exact format:
\`\`\`action
{
  "type": "optimize",
  "monsterName": "<exact monster name to search for>",
  "combatStyles": ["melee"] or ["ranged"] or ["melee", "ranged"],
  "message": "OK! Optimizing <style> loadout for <monster>..."
}
\`\`\`

If the user selects a specific style (e.g., "melee" or "ranged" or "both"), immediately return the action block.

If the question is general (e.g. "what gear should I use?") without a monster, ask them to select a monster first.

If the user just wants to chat or ask general questions, answer helpfully without the action block.

Keep responses concise and in a 2004 RuneScape theme. Use terms like "gp", "prayer", "spec", etc.

Available monsters the user can search for: ${availableMonsters ? availableMonsters.slice(0, 50).map(m => m.name).join(', ') : 'various monsters'}`;

    // Call LLM
    const conversationText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\n--- CONVERSATION ---\n${conversationText}\nAssistant:`;

    const llmResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt
    });

    const aiText = typeof llmResp === 'string' ? llmResp : (llmResp?.text || llmResp?.content || JSON.stringify(llmResp));

    // Parse action block if present
    const actionMatch = aiText.match(/```action\s*([\s\S]*?)```/);
    let action = null;
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1].trim());
      } catch (e) {
        // ignore parse error
      }
    }

    // If there's an optimize action and we have playerStats + monsters, run optimizer
    let optimizerResults = null;
    if (action?.type === 'optimize' && playerStats && availableMonsters?.length) {
      // Find the monster
      const monsterName = action.monsterName?.toLowerCase() || '';
      const foundMonster = availableMonsters.find(m =>
        m.name?.toLowerCase() === monsterName ||
        m.name?.toLowerCase().includes(monsterName) ||
        monsterName.includes(m.name?.toLowerCase())
      );

      if (foundMonster) {
        const allItems = await fetchAllItems();
        optimizerResults = { monster: foundMonster, loadouts: [] };

        for (const cType of (action.combatStyles || ['melee'])) {
          const cStyle = cType === 'ranged' ? 'rapid' : 'aggressive';
          const result = buildBestLoadout({
            allItems,
            combatType: cType,
            style: cStyle,
            playerStats,
            monster: foundMonster,
            budgetGp: null
          });
          if (result) {
            optimizerResults.loadouts.push({
              combatType: cType,
              style: cStyle,
              dps: result.dps,
              equipment: result.equipment
            });
          }
        }

        // Sort by DPS
        optimizerResults.loadouts.sort((a, b) => b.dps - a.dps);
      }
    }

    // Clean the message text (remove action block)
    const cleanText = aiText.replace(/```action[\s\S]*?```/g, '').trim();

    return Response.json({
      message: cleanText,
      action,
      optimizerResults
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});