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
            // Ranged bonuses
            ranged: equipData.rangedattack || 0,
            rangedStrBonus: equipData.rangedstrengthbonus || 0,
            // Magic bonuses
            magic: equipData.magicattack || 0,
            magicStrBonus: equipData.magicstrengthbonus || 0,
            // Defensive bonuses
            defenceStab: equipData.stabdefence || 0,
            defenceSlash: equipData.slashdefence || 0,
            defenceCrush: equipData.crushdefence || 0,
            defenceRanged: equipData.rangeddefence || 0,
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
      try {
        console.log('Fetching from:', NPC_URL);
        const npcResponse = await fetch(NPC_URL);
        console.log('NPC Response status:', npcResponse.status);
        console.log('NPC Response headers:', Object.fromEntries(npcResponse.headers.entries()));
        
        const rawText = await npcResponse.text();
        console.log('Raw response length:', rawText.length);
        console.log('First 500 chars:', rawText.substring(0, 500));
        
        let npcData;
        try {
          npcData = JSON.parse(rawText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          return Response.json({ 
            error: 'Failed to parse NPC data', 
            details: parseError.message,
            sample: rawText.substring(0, 200)
          }, { status: 500 });
        }
        
        console.log('Parsed data type:', typeof npcData);
        console.log('Is array?', Array.isArray(npcData));
        
        if (!Array.isArray(npcData)) {
          console.log('NPC data keys:', Object.keys(npcData).slice(0, 10));
          return Response.json({ 
            error: 'NPC data is not an array',
            dataType: typeof npcData,
            keys: Object.keys(npcData).slice(0, 10)
          }, { status: 500 });
        }
        
        const allMonsters = npcData
          .map((npc, index) => {
            if (!npc || !npc.name) return null;

            return {
              id: index,
              name: npc.name,
              hitpoints: npc.hitpoints || 10,
              attack: npc.attack || 1,
              strength: npc.strength || 1,
              defence: npc.defence || 1,
              ranged: npc.ranged || 1,
              magic: npc.magic || 1,
              defenceStab: npc.stabdefence || 0,
              defenceSlash: npc.slashdefence || 0,
              defenceCrush: npc.crushdefence || 0,
              defenceRanged: npc.rangeddefence || 0,
              defenceMagic: npc.magicdefence || 0,
              size: npc.size || 1,
              aggressive: npc.aggressive || false
            };
          })
          .filter(npc => npc !== null);

        console.log('Total monsters processed:', allMonsters.length);
        return Response.json({ monsters: allMonsters });
      } catch (monsterError) {
        console.error('Monster fetch error:', monsterError);
        console.error('Error stack:', monsterError.stack);
        return Response.json({ 
          error: monsterError.message,
          stack: monsterError.stack 
        }, { status: 500 });
      }
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});