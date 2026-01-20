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
            // Attack styles and speed overrides from metadata
            attackStyles: weaponsMeta[index]?.attackStyles || null,
            speedOverrides: weaponsMeta[index]?.speedOverrides || null,
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
            defenceStab: configWeapon.defenceStab || apiItem.defenceStab,
            defenceSlash: configWeapon.defenceSlash || apiItem.defenceSlash,
            defenceCrush: configWeapon.defenceCrush || apiItem.defenceCrush,
            defenceRanged: configWeapon.defenceRanged || apiItem.defenceRanged,
            defenceMagic: configWeapon.defenceMagic || apiItem.defenceMagic,
            attackRate: configWeapon.attackRate || apiItem.attackRate,
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
      const uniqueConfigWeapons = Array.from(configWeaponsByName.values())
        .filter(weapon => !apiItemNames.has(weapon.name))
        .map(weapon => ({
          ...weapon,
          id: `config_${weapon.name}` // Keep config ID for truly unique items
        }));

      const combinedItems = [...mergedItems, ...uniqueConfigWeapons];
      
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
          
          // Only include NPCs that are attackable (have "Attack" in op2)
          if (npc.op2 !== 'Attack') return null;
          
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