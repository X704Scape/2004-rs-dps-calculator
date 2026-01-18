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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const dataType = body.type;
    
    console.log('fetchGameData called with type:', dataType);

    if (dataType === 'items') {
      const itemResponse = await fetch(ITEM_URL);
      const itemData = await itemResponse.json();
      console.log('Fetched items from API:', itemData?.length);
      
      const wearableItems = itemData
        .map((item, index) => {
          const hasWieldOp = item.iops && Object.values(item.iops).some(op => op === 'Wield' || op === 'Wear');
          if (!hasWieldOp || !item.equipable_item) return null;

          const equipData = item.equipable_item;
          const wearpos = equipData.wearpos?.toLowerCase();
          const slot = SLOT_ALIASES[wearpos] || wearpos;
          if (!slot) return null;

          return {
            id: index,
            name: item.name || 'Unknown',
            slot,
            wearpos: equipData.wearpos,
            icon: `https://raw.githubusercontent.com/X704Scape/2004-Runescape-DPS-Calculator-Rev-254/main/Icons/${encodeURIComponent(item.name)}.png`,
            // Melee bonuses
            stab: equipData.stabattack || 0,
            slash: equipData.slashattack || 0,
            crush: equipData.crushattack || 0,
            strBonus: equipData.strengthbonus || 0,
            // Ranged bonuses (try all naming conventions)
            ranged: equipData.rangedattack || equipData.rangeattack || equipData.rangebonus || 0,
            rangedStrBonus: equipData.rangedstrengthbonus || equipData.rangestrengthbonus || equipData.rangestrengthbonus || 0,
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
            // Requirement
            requirement: item.req || 0
          };
        })
        .filter(item => item !== null);

      console.log('Returning wearable items:', wearableItems.length);
      return Response.json({ items: wearableItems });
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