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

const COMBAT_SPELLS = [
  ['Wind Strike', 2, 1], ['Water Strike', 4, 5], ['Earth Strike', 6, 9], ['Fire Strike', 8, 13],
  ['Wind Bolt', 9, 17], ['Water Bolt', 10, 23], ['Earth Bolt', 11, 29], ['Fire Bolt', 12, 35],
  ['Wind Blast', 13, 41], ['Water Blast', 14, 47], ['Earth Blast', 15, 53], ['Fire Blast', 16, 59],
  ['Wind Wave', 17, 62], ['Water Wave', 18, 65], ['Earth Wave', 19, 70], ['Fire Wave', 20, 75],
];

function getBestSpell(magicLevel) {
  let best = COMBAT_SPELLS[0];
  for (const spell of COMBAT_SPELLS) {
    if (magicLevel >= spell[2]) best = spell;
  }
  return best;
}

function calcDPS({ combatType, playerStats, equipment, monster }) {
  const { attack, strength, ranged, magic, prayerActive, style } = playerStats;
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
  } else if (combatType === 'magic') {
    const magicLvl = magic || 1;
    const spell = getBestSpell(magicLvl);
    maxHit = spell[1];
    const magicAtk = getBonus('magic');
    const effMagic = magicLvl + 9;
    attackRoll = effMagic * (magicAtk + 64);
    npcDefRoll = (monster.defence + 9) * ((monster.defenceMagic || 0) + 64);
  } else {
    return 0;
  }
  const accuracy = getAccuracy(attackRoll, npcDefRoll);
  const weapon = equipment.weapon;
  let speedTicks = combatType === 'magic' ? 5 : (weapon?.attackRate || 4);
  if (combatType === 'ranged' && style === 'rapid') speedTicks = Math.max(1, speedTicks - 1);
  const avgHit = (maxHit / 2) * accuracy;
  return avgHit / (speedTicks * 0.6);
}

function detectCombatType(weapon) {
  if (!weapon) return 'melee';
  const cat = weapon.category?.toLowerCase() || '';
  const name = weapon.name?.toLowerCase() || '';
  if (cat.includes('staff') || name.includes('staff') || name.includes('wand') || name.includes("iban's")) return 'magic';
  if (cat.includes('bow') || cat.includes('thrown') || cat.includes('crossbow') ||
      name.includes('bow') || name.includes('dart') || name.includes('knife') ||
      name.includes('javelin') || name.includes('thrownaxe')) return 'ranged';
  return 'melee';
}

// Build a PVP "monster" from opponent's stats (without knowing their gear — assumes 0 bonus)
function createPvpMonster(stats, name) {
  return {
    name: name || 'Opponent',
    defence: stats.defence || 1,
    defenceStab: 0, defenceSlash: 0, defenceCrush: 0,
    defenceRanged: 0, defenceMagic: 0,
    hitpoints: stats.hitpoints || 99
  };
}

const BANNED_SUBSTRINGS = ['(p)', 'poisoned', 'mod ', 'gm ', 'dev ', 'debug', 'null', 'placeholder', 'staff of light'];
function isBannedItem(name) {
  const lower = name.toLowerCase();
  return BANNED_SUBSTRINGS.some(b => lower.includes(b));
}

const RANGED_REQS = [
  { pattern: /\bblack d'?hide\b|\bblack dragonhide\b/i, level: 70 },
  { pattern: /\bred d'?hide\b|\bred dragonhide\b/i, level: 60 },
  { pattern: /\bblue d'?hide\b|\bblue dragonhide\b/i, level: 50 },
  { pattern: /\bgreen d'?hide\b|\bgreen dragonhide\b/i, level: 40 },
  { pattern: /\brune arrow\b/i, level: 40 },
  { pattern: /\bmagic shortbow\b/i, level: 50 }, { pattern: /\bmagic longbow\b/i, level: 50 },
  { pattern: /\byew shortbow\b/i, level: 40 }, { pattern: /\byew longbow\b/i, level: 40 },
  { pattern: /\bmaple shortbow\b/i, level: 30 }, { pattern: /\bmaple longbow\b/i, level: 30 },
  { pattern: /\bwillow shortbow\b/i, level: 20 }, { pattern: /\bwillow longbow\b/i, level: 20 },
  { pattern: /\bkaril\b/i, level: 70 },
];
const ATTACK_REQS = [
  { pattern: /\brune\b/i, level: 40 }, { pattern: /\badamant\b/i, level: 30 },
  { pattern: /\bmithril\b/i, level: 20 }, { pattern: /\bblack\b/i, level: 10 },
  { pattern: /\bsteel\b/i, level: 5 }, { pattern: /\bdragon\b/i, level: 60 },
  { pattern: /\btorag\b|\bverac\b|\bguthan\b|\bdhara\b|\bkaril\b|\bahrims\b/i, level: 70 },
];
const DEFENCE_REQS = [
  { pattern: /\bdragon (platelegs|plateskirt|chainbody|med helm|sq shield|full helm|square shield)\b/i, level: 60 },
  { pattern: /\brune (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 40 },
  { pattern: /\badamant (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 30 },
  { pattern: /\bmithril (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 20 },
  { pattern: /\bblack (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 10 },
  { pattern: /\bsteel (platebody|platelegs|plateskirt|full helm|kiteshield|sq shield|chainbody|med helm)\b/i, level: 5 },
  { pattern: /\btorag\b|\bverac\b|\bguthan\b|\bdhara\b/i, level: 70 },
  { pattern: /\bblack d'?hide (body|chaps|vamb)\b|\bblack dragonhide (body|chaps)\b/i, level: 70 },
  { pattern: /\bred d'?hide (body|chaps|vamb)\b|\bred dragonhide (body|chaps)\b/i, level: 60 },
  { pattern: /\bblue d'?hide (body|chaps|vamb)\b|\bblue dragonhide (body|chaps)\b/i, level: 50 },
  { pattern: /\bgreen d'?hide (body|chaps|vamb)\b|\bgreen dragonhide (body|chaps)\b/i, level: 40 },
];
const MAGIC_REQS = [
  { pattern: /\bahrims?\b/i, level: 70 },
  { pattern: /\bstaff of iban\b|\biban's staff\b/i, level: 50 },
  { pattern: /\bmaster wand\b/i, level: 60 }, { pattern: /\bteacher wand\b/i, level: 55 },
  { pattern: /\bpupil wand\b/i, level: 50 }, { pattern: /\bapprentice wand\b/i, level: 40 },
];

function meetsRequirements(item, playerLevels) {
  if (!playerLevels) return true;
  const name = item.name;
  const slot = item.slot;
  for (const req of RANGED_REQS) {
    if (req.pattern.test(name)) { if ((playerLevels.ranged || 1) < req.level) return false; break; }
  }
  if (slot === 'weapon') {
    for (const req of ATTACK_REQS) {
      if (req.pattern.test(name)) { if ((playerLevels.attack || 1) < req.level) return false; break; }
    }
  }
  for (const req of DEFENCE_REQS) {
    if (req.pattern.test(name)) { if ((playerLevels.defence || 1) < req.level) return false; break; }
  }
  for (const req of MAGIC_REQS) {
    if (req.pattern.test(name)) { if ((playerLevels.magic || 1) < req.level) return false; break; }
  }
  return true;
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

function getBowMaxArrowStrBonus(weaponName) {
  const wn = weaponName.toLowerCase();
  if (wn.includes('crossbow')) return Infinity;
  if (wn.includes('magic')) return 49;
  if (wn.includes('yew')) return 49;
  if (wn.includes('maple')) return 31;
  if (wn.includes('willow')) return 22;
  if (wn.includes('oak')) return 14;
  if (wn.includes('bow')) return 10;
  return Infinity;
}

// weaponOnly: if true, only include weapon (and ammo for ranged) — no armour
function buildBestLoadout({ allItems, combatType, style, playerStats, monster, budgetGp, playerLevels, weaponOnly = false }) {
  const usable = allItems.filter(item => {
    if (budgetGp !== null && item.price && item.price > budgetGp) return false;
    if (!meetsRequirements(item, playerLevels)) return false;
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
      const wn = weapon.name?.toLowerCase() || '';
      const isBow = wn.includes('bow') && !wn.includes('crossbow');
      const isCrossbow = wn.includes('crossbow');
      const isThrown = !isBow && !isCrossbow;
      if (!isThrown) {
        const maxArrowBonus = isBow ? getBowMaxArrowStrBonus(weapon.name) : Infinity;
        for (const ammo of ammoOptions) {
          const an = ammo.name?.toLowerCase() || '';
          const ac = ammo.category?.toLowerCase() || '';
          const isArrow = ac === 'arrows' || an.includes('arrow');
          const isBolt = ac === 'bolts' || an.includes('bolt');
          const ammoBonus = ammo.rangedStrBonus || 0;
          if (isBow && isArrow && ammoBonus <= maxArrowBonus && ammoBonus > bestBonus) {
            bestBonus = ammoBonus; bestAmmo = ammo;
          } else if (isCrossbow && isBolt && ammoBonus > bestBonus) {
            bestBonus = ammoBonus; bestAmmo = ammo;
          }
        }
      }
      if (bestAmmo) equipment.ammo = bestAmmo;
    }

    // Skip armour slots if weapon-only
    if (!weaponOnly) {
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
          if (combatType === 'melee') score = (item.strBonus || 0) * 2 + (item.slash || 0) + (item.stab || 0) + (item.crush || 0);
          else if (combatType === 'ranged') score = (item.rangedStrBonus || 0) * 2 + (item.ranged || 0);
          else if (combatType === 'magic') score = (item.magic || 0) * 3 + (item.defenceMagic || 0);
          if (score > bestScore) { bestScore = score; best = item; }
        }
        if (combatType === 'melee' && bestScore === 0) {
          let bestDefScore = -Infinity;
          for (const item of candidates) {
            const defScore = (item.defenceStab || 0) + (item.defenceSlash || 0) + (item.defenceCrush || 0);
            if (defScore > bestDefScore) { bestDefScore = defScore; best = item; }
          }
        }
        if (best) equipment[slot] = best;
      }
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
    const { messages, playerStats, playerLevels, availableMonsters, opponentStats, opponentName: bodyOpponentName } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Missing messages array' }, { status: 400 });
    }

    const systemPrompt = `You are a chill, knowledgeable 2004 RuneScape veteran helping a friend optimise their gear on a specific 2004-era private server. Talk like a real player — casual, helpful, a bit of banter. No bullet point lists, no robotic formatting, just friendly chat. Keep replies short and punchy unless asked for detail.

CRITICAL RULE — GEAR RECOMMENDATIONS:
- NEVER name specific items, weapons, armour, or gear in your text responses. You do not have knowledge of what items exist on this server.
- ALL gear recommendations MUST come from the optimizer results. The optimizer reads directly from the server's item database and is the only source of truth.
- You may discuss general concepts (e.g. "melee is strong here") but never say item names.

RECOGNISING SPECIAL REQUESTS:

1. WEAPON-ONLY: If the user says things like "just give me a weapon", "weapon only", "no armour", "only show the weapon", "best weapon for X" (implying no full setup) — trigger:
\`\`\`action
{"type":"optimize_weapon_only","monsterName":"<monster>","combatStyles":["melee"]}
\`\`\`

2. STAKING / PVP / DUELING: If user mentions "stake", "staking", "pvp", "1v1", "duel", "fight [player]", "vs [player]" — trigger:
\`\`\`action
{"type":"stake","opponentName":"<opponent username if mentioned, else null>"}
\`\`\`
Don't ask for style — staking always calculates melee + ranged. If no opponent is mentioned, just trigger the action anyway and the system will prompt for one.

3. NORMAL OPTIMIZE: For all other gear/monster questions:
\`\`\`action
{"type":"optimize","monsterName":"<monster>","combatStyles":["melee"]}
\`\`\`

FLOW:
- If combat style is implied (e.g. "best melee for dragons") — skip asking and fire the action immediately.
- If ambiguous, ask casually in ONE sentence: "Want melee, ranged, magic, or a mix?"
- Never ask more than one question at a time.
- If no monster is mentioned for non-stake queries, ask which monster.
- Never mention "JSON", "action block", or technical terms to the user.

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
        },
        required: ['message', 'actionType']
      }
    });

    console.log('llmResp raw:', JSON.stringify(llmResp));
    const message = llmResp?.message || 'Sorry, something went wrong.';
    const actionType = llmResp?.actionType || '';
    let action = null;

    if (actionType === 'optimize' || actionType === 'optimize_weapon_only') {
      action = {
        type: actionType,
        monsterName: llmResp?.monsterName || '',
        combatStyles: llmResp?.combatStyles?.length ? llmResp.combatStyles : ['melee'],
      };
    } else if (actionType === 'stake') {
      action = {
        type: 'stake',
        opponentName: llmResp?.opponentName || bodyOpponentName || null,
      };
      if (!opponentStats) {
        action.needsOpponentLookup = true;
      }
    }

    return Response.json({ message, action, optimizerResults: null });

  } catch (error) {
    console.error('AI Chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});