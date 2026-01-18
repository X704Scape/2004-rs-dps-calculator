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
      const npcResponse = await fetch(NPC_URL);
      const npcData = await npcResponse.json();
      console.log('Fetched NPCs from API:', npcData?.length);
      
      const attackMonsters = npcData
        .map((npc, index) => {
          // Check if NPC has Attack option in various formats
          const hasAttackOp = npc.op && (
            Object.values(npc.op).some(op => op === 'Attack') ||
            Object.values(npc.op).some(op => op?.toLowerCase() === 'attack')
          );
          if (!hasAttackOp && !npc.attack) return null;

          return {
            id: index,
            name: npc.name || 'Unknown',
            // Combat stats
            hitpoints: npc.hitpoints || 10,
            attack: npc.attack || 1,
            strength: npc.strength || 1,
            defence: npc.defence || 1,
            ranged: npc.ranged || 1,
            magic: npc.magic || 1,
            // Defensive bonuses
            defenceStab: npc.stabdefence || 0,
            defenceSlash: npc.slashdefence || 0,
            defenceCrush: npc.crushdefence || 0,
            defenceRanged: npc.rangeddefence || 0,
            defenceMagic: npc.magicdefence || 0,
            // Other
            size: npc.size || 1,
            aggressive: npc.aggressive || false
          };
        })
        .filter(npc => npc !== null);

      console.log('Returning attack monsters:', attackMonsters.length);
      return Response.json({ monsters: attackMonsters });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});