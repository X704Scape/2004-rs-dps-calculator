import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ITEM_URL = 'https://2004.losthq.rs/js/itemdb/item_data.json?v=254';
const NPC_URL = 'https://2004.losthq.rs/js/npcdb/npc_data.json?v=254';

const SLOT_ALIASES = {
  'weapon': 'weapon',
  'shield': 'shield',
  'head': 'head',
  'body': 'body',
  'legs': 'legs',
  'hands': 'hands',
  'feet': 'feet',
  'cape': 'cape',
  'neck': 'neck',
  'ammo': 'ammo',
  'ring': 'ring',
  'ammunition': 'ammo'
};

// Parse config format (works for both melee and ranged)
function parseConfigWeapons(configText) {
  const weapons = [];
  const lines = configText.split('\n');
  let currentWeapon = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('name=')) {
      if (currentWeapon.name) {
        weapons.push(currentWeapon);
      }
      const weaponName = line.substring(5);
      currentWeapon = {
        name: weaponName,
        iconUrl: `https://raw.githubusercontent.com/X704Scape/2004-Runescape-DPS-Calculator-Rev-254/main/Icons/${encodeURIComponent(weaponName)}.png`,
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        ranged: 0,
        strBonus: 0,
        rangedStrBonus: 0,
        defenceStab: 0,
        defenceSlash: 0,
        defenceCrush: 0,
        defenceMagic: 0,
        defenceRanged: 0,
        attackRate: 4,
        slot: 'weapon',
        wearpos: 'righthand',
        wearpos2: null,
        category: null,
        equipable: true,
        requirement: 1
      };
    } else if (line.startsWith('wearpos=')) {
      currentWeapon.wearpos = line.substring(8);
    } else if (line.startsWith('wearpos2=')) {
      currentWeapon.wearpos2 = line.substring(9);
    } else if (line.startsWith('category=')) {
      currentWeapon.category = line.substring(9);
    } else if (line.startsWith('param=stabattack,')) {
      currentWeapon.stab = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=slashattack,')) {
      currentWeapon.slash = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=crushattack,')) {
      currentWeapon.crush = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=magicattack,')) {
      currentWeapon.magic = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=rangeattack,')) {
      currentWeapon.ranged = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=strengthbonus,')) {
      currentWeapon.strBonus = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=rangebonus,')) {
      currentWeapon.rangedStrBonus = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=rangestrengthbonus,')) {
      currentWeapon.rangedStrBonus = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=attackrate,')) {
      currentWeapon.attackRate = parseInt(line.split(',')[1]) || 4;
    } else if (line.startsWith('param=stabdefence,')) {
      currentWeapon.defenceStab = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=slashdefence,')) {
      currentWeapon.defenceSlash = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=crushdefence,')) {
      currentWeapon.defenceCrush = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=magicdefence,')) {
      currentWeapon.defenceMagic = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=rangedefence,')) {
      currentWeapon.defenceRanged = parseInt(line.split(',')[1]) || 0;
    }
  }
  
  if (currentWeapon.name) {
    weapons.push(currentWeapon);
  }
  
  // Post-process to assign slots based on category first, then wearpos
  weapons.forEach(weapon => {
    // Category-based slot assignment (highest priority)
    if (weapon.category) {
      if (weapon.category.includes('armour_head')) {
        weapon.slot = 'head';
      } else if (weapon.category.includes('armour_body')) {
        weapon.slot = 'body';
      } else if (weapon.category.includes('armour_legs')) {
        weapon.slot = 'legs';
      } else if (weapon.category.includes('armour_hands')) {
        weapon.slot = 'hands';
      } else if (weapon.category.includes('armour_feet')) {
        weapon.slot = 'feet';
      } else if (weapon.category.includes('armour_cape')) {
        weapon.slot = 'cape';
      } else if (weapon.category.includes('armour_shield')) {
        weapon.slot = 'shield';
      } else if (weapon.category === 'arrows' || weapon.category === 'bolts') {
        weapon.slot = 'ammo';
      }
    }
    
    // If no category-based slot, use wearpos
    if (weapon.slot === 'weapon' && weapon.wearpos) {
      const wearpos = weapon.wearpos.toLowerCase();
      if (wearpos === 'quiver') {
        weapon.slot = 'ammo';
      } else if (wearpos === 'head') {
        weapon.slot = 'head';
      } else if (wearpos === 'body') {
        weapon.slot = 'body';
      } else if (wearpos === 'legs') {
        weapon.slot = 'legs';
      } else if (wearpos === 'hands') {
        weapon.slot = 'hands';
      } else if (wearpos === 'feet') {
        weapon.slot = 'feet';
      } else if (wearpos === 'cape') {
        weapon.slot = 'cape';
      } else if (wearpos === 'neck') {
        weapon.slot = 'neck';
      } else if (wearpos === 'ring') {
        weapon.slot = 'ring';
      } else if (wearpos === 'lefthand') {
        weapon.slot = 'shield';
      }
    }
  });
  
  return weapons;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const dataType = body.type;
    
    console.log('fetchGameData called with type:', dataType);

    if (dataType === 'items') {
      // Fetch melee weapons config
      const meleeConfigUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/21fdc43de_combined_melee_configs.txt';
      const meleeConfigResponse = await fetch(meleeConfigUrl);
      const meleeConfigText = await meleeConfigResponse.text();
      const meleeWeapons = parseConfigWeapons(meleeConfigText);
      console.log('Parsed melee weapons from config:', meleeWeapons.length);

      // Fetch ranged weapons config
      const rangedConfigUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/c02381c5b_combined_ranged_configs.txt';
      const rangedConfigResponse = await fetch(rangedConfigUrl);
      const rangedConfigText = await rangedConfigResponse.text();
      const rangedWeapons = parseConfigWeapons(rangedConfigText);
      console.log('Parsed ranged weapons from config:', rangedWeapons.length);

      // Fetch magic weapons config
      const magicConfigUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/b4fa4e195_combined_magic_configs.txt';
      const magicConfigResponse = await fetch(magicConfigUrl);
      const magicConfigText = await magicConfigResponse.text();
      const magicWeapons = parseConfigWeapons(magicConfigText);
      console.log('Parsed magic weapons from config:', magicWeapons.length);

      const itemResponse = await fetch(ITEM_URL);
      const itemData = await itemResponse.json();
      console.log('Fetched items from API:', itemData?.length);

      // Weapons metadata: attack styles and speed overrides indexed by item ID
      const weaponsMeta = {
        35: { attackStyles: [{ mode: 'accurate', id: 'accurate', type: 'slash' }, { mode: 'aggressive', id: 'aggressive', type: 'slash' }, { mode: 'controlled', id: 'controlled', type: 'stab' }, { mode: 'defensive', id: 'defensive', type: 'slash' }] },
        767: { attackStyles: [{ mode: 'accurate', id: 'accurate', type: 'ranged' }, { mode: 'rapid', id: 'rapid', type: 'ranged' }, { mode: 'defensive', id: 'longrange', type: 'ranged' }], speedOverrides: [{ styleId: 'rapid', speedTicks: 5 }] }
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
            icon: `https://raw.githubusercontent.com/X704Scape/2004-Runescape-DPS-Calculator-Rev-254/main/Icons/${encodeURIComponent(item.name)}.png`,
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
            // Attack styles and speed overrides from metadata
            attackStyles: weaponsMeta[index]?.attackStyles || null,
            speedOverrides: weaponsMeta[index]?.speedOverrides || null,
            // Requirement
            requirement: item.req || 0
            };
        })
        .filter(item => item !== null);

      // Combine API items with config weapons, removing duplicates
      // Create a map by name to deduplicate (config weapons take priority)
      const itemsByName = new Map();
      
      // Add config weapons first (they take priority) - but ONLY actual weapons and ammo
      [...meleeWeapons, ...rangedWeapons, ...magicWeapons].forEach(weapon => {
        // Only add if it's actually a weapon, shield, or ammo (not armor)
        if (weapon.slot === 'weapon' || weapon.slot === 'shield' || weapon.slot === 'ammo') {
          itemsByName.set(weapon.name, weapon);
        }
      });
      
      // Add API items only if not already present AND only if they're actual armor (not weapons)
      wearableItems.forEach(item => {
        if (!itemsByName.has(item.name)) {
          // Skip adding if it would go to weapon slot but comes from API
          // (weapons should come from config files only)
          if (item.slot === 'weapon') {
            return;
          }
          itemsByName.set(item.name, item);
        }
      });
      
      const combinedItems = Array.from(itemsByName.values());
      
      console.log('Returning combined items:', combinedItems.length);
      return Response.json({ items: combinedItems });
    }

    if (dataType === 'monsters') {
      const npcResponse = await fetch(NPC_URL);
      const npcData = await npcResponse.json();
      console.log('Fetched NPCs from API (object with keys):', Object.keys(npcData).length);
      
      // NPC data is an object, not an array - extract values and filter
      const allMonsters = Object.entries(npcData)
        .map(([key, npc], index) => {
          if (!npc || !npc.name) return null;
          
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

          return {
            id: npc.id || index,
            name: npc.name,
            hitpoints: parseInt(npc.hitpoints) || 10,
            attack: parseInt(npc.attack) || 1,
            strength: parseInt(npc.strength) || 1,
            defence: parseInt(npc.defence) || 1,
            ranged: parseInt(npc.ranged) || 1,
            magic: parseInt(npc.magic) || 1,
            defenceStab,
            defenceSlash,
            defenceCrush,
            defenceRanged,
            defenceMagic,
            size: parseInt(npc.size) || 1,
            aggressive: npc.huntmode ? true : false
          };
        })
        .filter(npc => npc !== null);

      console.log('Returning monsters:', allMonsters.length);
      return Response.json({ monsters: allMonsters });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});