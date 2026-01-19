import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Parse the config format into structured weapon data
function parseWeaponConfig(configText) {
  const weapons = [];
  const lines = configText.split('\n');
  let currentWeapon = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('name=')) {
      // Save previous weapon if exists
      if (currentWeapon.name) {
        weapons.push(currentWeapon);
      }
      // Start new weapon
      currentWeapon = {
        name: line.substring(5),
        stab: 0,
        slash: 0,
        crush: 0,
        magic: 0,
        ranged: 0,
        strBonus: 0,
        rangedStrBonus: 0,
        stabDefence: 0,
        slashDefence: 0,
        crushDefence: 0,
        magicDefence: 0,
        rangeDefence: 0,
        attackRate: 4,
        slot: 'weapon',
        category: null,
        equipable: true
      };
    } else if (line.startsWith('category=')) {
      currentWeapon.category = line.substring(9);
      // Set slot based on category
      if (currentWeapon.category.includes('armour_body')) {
        currentWeapon.slot = 'body';
      } else if (currentWeapon.category.includes('armour_legs')) {
        currentWeapon.slot = 'legs';
      } else if (currentWeapon.category.includes('armour_head')) {
        currentWeapon.slot = 'head';
      } else if (currentWeapon.category.includes('armour_hands')) {
        currentWeapon.slot = 'hands';
      } else if (currentWeapon.category.includes('armour_feet')) {
        currentWeapon.slot = 'feet';
      } else if (currentWeapon.category.includes('armour_cape')) {
        currentWeapon.slot = 'cape';
      } else if (currentWeapon.category.includes('armour_shield')) {
        currentWeapon.slot = 'shield';
      }
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
    } else if (line.startsWith('param=rangestrengthbonus,')) {
      currentWeapon.rangedStrBonus = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=attackrate,')) {
      currentWeapon.attackRate = parseInt(line.split(',')[1]) || 4;
    } else if (line.startsWith('param=stabdefence,')) {
      currentWeapon.stabDefence = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=slashdefence,')) {
      currentWeapon.slashDefence = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=crushdefence,')) {
      currentWeapon.crushDefence = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=magicdefence,')) {
      currentWeapon.magicDefence = parseInt(line.split(',')[1]) || 0;
    } else if (line.startsWith('param=rangedefence,')) {
      currentWeapon.rangeDefence = parseInt(line.split(',')[1]) || 0;
    }
  }
  
  // Don't forget the last weapon
  if (currentWeapon.name) {
    weapons.push(currentWeapon);
  }
  
  return weapons;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch the config file
    const configUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/21fdc43de_combined_melee_configs.txt';
    const response = await fetch(configUrl);
    const configText = await response.text();
    
    // Parse the weapons
    const weapons = parseWeaponConfig(configText);
    
    return Response.json({ weapons, count: weapons.length });
  } catch (error) {
    console.error('Error fetching melee weapons:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});