import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ITEM_URL = 'https://2004.losthq.rs/js/itemdb/item_data.json?v=254';
const NPC_URL = 'https://2004.losthq.rs/js/npcdb/npc_data.json?v=254';
const GH_RAW = 'https://raw.githubusercontent.com/LostCityRS/Content/refs/heads/274/scripts/skill_combat/configs';

const MELEE_FILES = ['2hswords','battleaxes','claws','daggers','halberds','longswords','maces','polearms','scimitars','shortswords','spears','kiteshields'];
const RANGED_FILES = ['bows','crossbows','arrows','bolts','darts','javelins','knives','thrownaxes'];
const MAGIC_FILES = ['battlestaves','mysticstaves','staves'];
const NPC_274_URL = 'https://raw.githubusercontent.com/LostCityRS/Content/refs/heads/274/scripts/_unpack/274/all.npc';

const SLOT_ALIASES = {
  'weapon': 'weapon', 'shield': 'shield', 'head': 'head', 'body': 'body',
  'legs': 'legs', 'hands': 'hands', 'feet': 'feet', 'cape': 'cape',
  'neck': 'neck', 'ammo': 'ammo', 'ring': 'ring', 'ammunition': 'ammo'
};

async function fetchConfigFile(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    return res.text();
  } catch { return ''; }
}

function parseConfigWeapons(configText) {
  const weapons = [];
  const lines = configText.split('\n');
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('//')) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      if (current?.name) weapons.push(current);
      current = {
        id: line.slice(1, -1),
        name: null,
        stab: 0, slash: 0, crush: 0, magic: 0, ranged: 0,
        strBonus: 0, rangedStrBonus: 0, prayerBonus: 0,
        defenceStab: 0, defenceSlash: 0, defenceCrush: 0, defenceMagic: 0, defenceRanged: 0,
        attackRate: 4, slot: 'weapon', wearpos: 'righthand', wearpos2: null,
        category: null, equipable: true, requirement: 1, hasSpec: false, specEnergy: 0
      };
    } else if (current) {
      if (line.startsWith('name=')) current.name = line.slice(5);
      else if (line.startsWith('wearpos=')) current.wearpos = line.slice(8);
      else if (line.startsWith('wearpos2=')) current.wearpos2 = line.slice(9);
      else if (line.startsWith('category=')) current.category = line.slice(9);
      else if (line.startsWith('param=stabattack,')) current.stab = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=slashattack,')) current.slash = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=crushattack,')) current.crush = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=magicattack,')) current.magic = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=rangeattack,')) current.ranged = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=strengthbonus,')) current.strBonus = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=rangebonus,') || line.startsWith('param=rangestrengthbonus,')) current.rangedStrBonus = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=prayerbonus,')) current.prayerBonus = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=attackrate,')) current.attackRate = parseInt(line.split(',')[1]) || 4;
      else if (line.startsWith('param=stabdefence,')) current.defenceStab = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=slashdefence,')) current.defenceSlash = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=crushdefence,')) current.defenceCrush = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=magicdefence,')) current.defenceMagic = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=rangedefence,')) current.defenceRanged = parseInt(line.split(',')[1]) || 0;
      else if (line.startsWith('param=levelrequire,')) current.requirement = parseInt(line.split(',')[1]) || 1;
      else if (line.startsWith('param=specwep,')) current.hasSpec = true;
      else if (line.startsWith('param=sa_energy,')) current.specEnergy = parseInt(line.split(',')[1]) || 0;
    }
  }
  if (current?.name) weapons.push(current);

  // Post-process to set correct slots and filter armor
  return weapons
    .map(weapon => {
      // Set correct slot based on wearpos
      if (weapon.wearpos) {
        const wearpos = weapon.wearpos.toLowerCase();
        if (wearpos === 'quiver') {
          weapon.slot = 'ammo';
        } else if (wearpos === 'lefthand' && weapon.wearpos2 !== 'lefthand') {
          weapon.slot = 'shield';
        }
      }
      return weapon;
    })
    .filter(weapon => {
      // If it has an armor category, exclude it
      if (weapon.category && weapon.category.includes('armour_')) {
        return false;
      }
      
      // If wearpos indicates armor slot, exclude it
      if (weapon.wearpos) {
        const wearpos = weapon.wearpos.toLowerCase();
        if (['head', 'body', 'legs', 'hands', 'feet', 'cape', 'neck', 'ring'].includes(wearpos)) {
          return false;
        }
      }
      
      // Keep weapons, shields, and ammo
      return true;
    });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const dataType = body.type;
    
    console.log('fetchGameData called with type:', dataType);

    if (dataType === 'items') {
      // Fetch all weapon config files directly from GitHub 274 branch
      const [meleeTexts, rangedTexts, magicTexts] = await Promise.all([
        Promise.all(MELEE_FILES.map(f => fetchConfigFile(`${GH_RAW}/melee/${f}.obj`))),
        Promise.all(RANGED_FILES.map(f => fetchConfigFile(`${GH_RAW}/ranged/${f}.obj`))),
        Promise.all(MAGIC_FILES.map(f => fetchConfigFile(`${GH_RAW}/magic/${f}.obj`)))
      ]);
      const meleeWeapons = parseConfigWeapons(meleeTexts.join('\n'));
      const rangedWeapons = parseConfigWeapons(rangedTexts.join('\n'));
      const magicWeapons = parseConfigWeapons(magicTexts.join('\n'));
      console.log('Parsed weapons - melee:', meleeWeapons.length, 'ranged:', rangedWeapons.length, 'magic:', magicWeapons.length);

      const itemResponse = await fetch(ITEM_URL);
      const itemData = await itemResponse.json();
      console.log('Fetched items from API:', itemData?.length);

      // Weapons metadata: attack styles indexed by item ID
      // Note: Speed overrides are no longer needed - rapid style is now handled by -1 fallback in Calculator.js
      const weaponsMeta = {
        35: { attackStyles: [{ mode: 'accurate', id: 'accurate', type: 'slash' }, { mode: 'aggressive', id: 'aggressive', type: 'slash' }, { mode: 'controlled', id: 'controlled', type: 'stab' }, { mode: 'defensive', id: 'defensive', type: 'slash' }] },
        767: { attackStyles: [{ mode: 'accurate', id: 'accurate', type: 'ranged' }, { mode: 'rapid', id: 'rapid', type: 'ranged' }, { mode: 'defensive', id: 'longrange', type: 'ranged' }] }
      };

      const wearableItems = itemData
        .map((item, index) => {
          const hasWieldOp = item.iops && Object.values(item.iops).some(op => op === 'Wield' || op === 'Wear');
          if (!hasWieldOp || !item.equipable_item) return null;

          const equipData = item.equipable_item;
          const wearpos = equipData.wearpos?.toLowerCase();
          const wearpos2 = equipData.wearpos2?.toLowerCase();
          const slot = SLOT_ALIASES[wearpos] || wearpos;
          if (!slot) return null;

          // Force weapon_staff category for specific staves
          const itemName = item.name?.toLowerCase() || '';
          let category = null;
          if (itemName.includes('staff') || itemName.includes('iban')) {
            category = 'weapon_staff';
          }

          return {
            id: index,
            name: item.name || 'Unknown',
            slot,
            wearpos: equipData.wearpos,
            wearpos2: equipData.wearpos2,
            category: category,
            icon: `https://raw.githubusercontent.com/X704Scape/2004-Runescape-DPS-Calculator-Rev-254/main/icons/${index}.png`,
            // Melee bonuses
            stab: equipData.stabattack || 0,
            slash: equipData.slashattack || 0,
            crush: equipData.crushattack || 0,
            strBonus: equipData.strengthbonus || 0,
            // Ranged bonuses (accuracy vs strength are separate)
            ranged: equipData.rangedattack || equipData.rangeattack || 0,
            rangedStrBonus: equipData.rangedstrengthbonus || equipData.rangestrengthbonus || equipData.rangebonus || 0,
            // Magic bonuses
            magic: equipData.magicattack || 0,
            magicStrBonus: equipData.magicstrengthbonus || 0,
            // Defensive bonuses (try both naming conventions for ranged)
            defenceStab: equipData.stabdefence || 0,
            defenceSlash: equipData.slashdefence || 0,
            defenceCrush: equipData.crushdefence || 0,
            defenceRanged: equipData.rangeddefence || equipData.rangedefence || 0,
            defenceMagic: equipData.magicdefence || 0,
            // Prayer bonus
            prayer: equipData.prayerbonus || 0,
            // Attack speed (in ticks)
            attackRate: equipData.attackrate || 4,
            // Attack styles from metadata
            attackStyles: weaponsMeta[index]?.attackStyles || null,
            // Requirement
            requirement: item.req || 0
            };
        })
        .filter(item => item !== null);

      // Merge API items with config weapons by name
      // Build a map of config weapons by name for quick lookup
      const configWeaponsByName = new Map();
      [...meleeWeapons, ...rangedWeapons, ...magicWeapons].forEach(weapon => {
        const wearpos = weapon.wearpos?.toLowerCase();
        const validWearpos = ['righthand', 'lefthand', 'quiver'];
        if (wearpos && validWearpos.includes(wearpos)) {
          configWeaponsByName.set(weapon.name, weapon);
        }
      });

      // Merge API items with matching config data
      const mergedItems = wearableItems.map(apiItem => {
        const configWeapon = configWeaponsByName.get(apiItem.name);
        if (configWeapon) {
          // Merge: API item as base, but preserve config metadata
          return {
            ...apiItem,
            // Keep API's numeric ID, icon URL, and name
            // Merge stats - prefer config if non-zero, otherwise use API
            stab: configWeapon.stab || apiItem.stab,
            slash: configWeapon.slash || apiItem.slash,
            crush: configWeapon.crush || apiItem.crush,
            ranged: configWeapon.ranged || apiItem.ranged,
            magic: configWeapon.magic || apiItem.magic,
            strBonus: configWeapon.strBonus || apiItem.strBonus,
            rangedStrBonus: configWeapon.rangedStrBonus || apiItem.rangedStrBonus,
            prayerBonus: configWeapon.prayerBonus || apiItem.prayer || 0,
            defenceStab: configWeapon.defenceStab || apiItem.defenceStab,
            defenceSlash: configWeapon.defenceSlash || apiItem.defenceSlash,
            defenceCrush: configWeapon.defenceCrush || apiItem.defenceCrush,
            defenceRanged: configWeapon.defenceRanged || apiItem.defenceRanged,
            defenceMagic: configWeapon.defenceMagic || apiItem.defenceMagic,
            attackRate: configWeapon.attackRate || apiItem.attackRate,
            // Spec data from config
            hasSpec: configWeapon.hasSpec || false,
            specEnergy: configWeapon.specEnergy || 0,
            // Preserve config's wearpos data and category
            wearpos: configWeapon.wearpos || apiItem.wearpos,
            wearpos2: configWeapon.wearpos2 || apiItem.wearpos2,
            category: configWeapon.category || apiItem.category,
            slot: configWeapon.slot || apiItem.slot
          };
        }
        return apiItem;
      });

      // Add config weapons that have no API match (truly unique items)
      const apiItemNames = new Set(wearableItems.map(item => item.name));
      const allConfigWeapons = [...meleeWeapons, ...rangedWeapons, ...magicWeapons];
      const uniqueConfigWeapons = allConfigWeapons.filter(w => {
        const wearpos = w.wearpos?.toLowerCase();
        const validWearpos = ['righthand', 'lefthand', 'quiver'];
        return wearpos && validWearpos.includes(wearpos) && !apiItemNames.has(w.name);
      });
      console.log('Unique config weapons not in API:', uniqueConfigWeapons.length);

      const combinedItems = [...mergedItems, ...uniqueConfigWeapons];
      console.log('Returning combined items:', combinedItems.length);
      return Response.json({ items: combinedItems });
    }

    if (dataType === 'monsters') {
      // Fetch both old API data and new 274 NPC configs in parallel
      const [npcResponse, npc274Text] = await Promise.all([
        fetch(NPC_URL).then(r => r.json()),
        fetchConfigFile(NPC_274_URL)
      ]);
      const npcData = npcResponse;
      console.log('Fetched NPCs from API (object with keys):', Object.keys(npcData).length);

      // Parse 274 NPC config file
      function parseNpcConfig(text) {
        const npcs = [];
        const lines = text.split('\n');
        let current = null;
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (line.startsWith('//')) continue;
          if (line.startsWith('[') && line.endsWith(']')) {
            if (current?.name && current.isAttackable) npcs.push(current);
            current = { id: line.slice(1,-1), name: null, hitpoints: 0, attack: 1, strength: 1, defence: 1, ranged: 1, magic: 1, defenceStab: 0, defenceSlash: 0, defenceCrush: 0, defenceRanged: 0, defenceMagic: 0, vislevel: 0, size: 1, isAttackable: false };
          } else if (current) {
            if (line.startsWith('name=')) current.name = line.slice(5);
            else if (line.startsWith('hitpoints=')) current.hitpoints = parseInt(line.slice(10)) || 0;
            else if (line.startsWith('attack=')) current.attack = parseInt(line.slice(7)) || 1;
            else if (line.startsWith('strength=')) current.strength = parseInt(line.slice(9)) || 1;
            else if (line.startsWith('defence=')) current.defence = parseInt(line.slice(8)) || 1;
            else if (line.startsWith('ranged=')) current.ranged = parseInt(line.slice(7)) || 1;
            else if (line.startsWith('magic=')) current.magic = parseInt(line.slice(6)) || 1;
            else if (line.startsWith('size=')) current.size = parseInt(line.slice(5)) || 1;
            else if (line.startsWith('vislevel=') && line !== 'vislevel=hide') current.vislevel = parseInt(line.slice(9)) || 0;
            else if (line.startsWith('param=stabdefence,')) current.defenceStab = parseInt(line.split(',')[1]) || 0;
            else if (line.startsWith('param=slashdefence,')) current.defenceSlash = parseInt(line.split(',')[1]) || 0;
            else if (line.startsWith('param=crushdefence,')) current.defenceCrush = parseInt(line.split(',')[1]) || 0;
            else if (line.startsWith('param=magicdefence,') && !line.includes('10000')) current.defenceMagic = parseInt(line.split(',')[1]) || 0;
            else if (line.startsWith('param=rangedefence,')) current.defenceRanged = parseInt(line.split(',')[1]) || 0;
            else if (line === 'op2=Attack') current.isAttackable = true;
          }
        }
        if (current?.name && current.isAttackable) npcs.push(current);
        return npcs;
      }
      const npc274List = parseNpcConfig(npc274Text);
      console.log('Parsed 274 NPCs:', npc274List.length);

      // NPC data is an object, not an array - extract values and filter
      const allMonsters = Object.entries(npcData)
        .map(([key, npc], index) => {
          if (!npc || !npc.name) return null;
          
          // Only include NPCs that are attackable (have "Attack" in any op field)
          const ops = [npc.op1, npc.op2, npc.op3, npc.op4, npc.op5, npc.op6];
          const isAttackable = ops.some(op => op === 'Attack');
          if (!isAttackable) return null;
          
          // Extract defense bonuses from params array
          let defenceStab = 0, defenceSlash = 0, defenceCrush = 0, defenceRanged = 0, defenceMagic = 0;
          if (npc.params) {
            npc.params.forEach(param => {
              if (param.stabdefence) defenceStab = parseInt(param.stabdefence);
              if (param.slashdefence) defenceSlash = parseInt(param.slashdefence);
              if (param.crushdefence) defenceCrush = parseInt(param.crushdefence);
              if (param.rangedefence) defenceRanged = parseInt(param.rangedefence);
              if (param.magicdefence) defenceMagic = parseInt(param.magicdefence);
            });
          }

          const npcId = parseInt(key) || npc.id || index;
          return {
            id: npcId,
            name: npc.name,
            hitpoints: parseInt(npc.hitpoints) || 10,
            attack: parseInt(npc.attack) || 1,
            strength: parseInt(npc.strength) || 1,
            defence: parseInt(npc.defence) || 1,
            ranged: parseInt(npc.ranged) || 1,
            magic: parseInt(npc.magic) || 1,
            defenceStab, defenceSlash, defenceCrush, defenceRanged, defenceMagic,
            size: parseInt(npc.size) || 1,
            aggressive: npc.huntmode ? true : false
          };
        })
        .filter(npc => npc !== null);

      // Merge in 274 NPCs that aren't already in the API data (by name)
      const existingNames = new Set(allMonsters.map(m => m.name.toLowerCase()));
      let nextId = 10000;
      for (const npc274 of npc274List) {
        if (!existingNames.has(npc274.name.toLowerCase()) && npc274.hitpoints > 0) {
          allMonsters.push({
            id: nextId++,
            name: npc274.name,
            hitpoints: npc274.hitpoints,
            attack: npc274.attack,
            strength: npc274.strength,
            defence: npc274.defence,
            ranged: npc274.ranged,
            magic: npc274.magic,
            defenceStab: npc274.defenceStab,
            defenceSlash: npc274.defenceSlash,
            defenceCrush: npc274.defenceCrush,
            defenceRanged: npc274.defenceRanged,
            defenceMagic: npc274.defenceMagic,
            size: npc274.size,
            aggressive: false
          });
          existingNames.add(npc274.name.toLowerCase());
        }
      }

      console.log('Returning monsters:', allMonsters.length);
      return Response.json({ monsters: allMonsters });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});