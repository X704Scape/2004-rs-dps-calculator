import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Type IDs from the official 2004.lostcity.rs hiscores API
const SKILL_TYPES = {
  1: 'attack',
  2: 'defence',
  3: 'strength',
  4: 'hitpoints',
  5: 'ranged',
  6: 'prayer',
  7: 'magic'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username } = await req.json();

    if (!username) {
      return Response.json({ error: 'Username required' }, { status: 400 });
    }

    const normalizedUsername = username.trim().replace(/ /g, '_');
    const response = await fetch(`https://2004.losthq.rs/pages/api/LCHiscoresProxy.php?username=${encodeURIComponent(normalizedUsername)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; DPS-Calculator/1.0)',
        'Referer': 'https://2004.losthq.rs/'
      }
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Non-JSON response:', text.slice(0, 200));
      return Response.json({ error: 'Hiscores API returned unexpected response' }, { status: 502 });
    }

    // Default stats
    const stats = {
      hitpoints: 10,
      attack: 1,
      strength: 1,
      defence: 1,
      ranged: 1,
      magic: 1,
      prayer: 1
    };

    // Map type IDs to stat names
    for (const entry of data) {
      const statName = SKILL_TYPES[entry.type];
      if (statName && entry.level) {
        stats[statName] = entry.level;
      }
    }

    return Response.json({ stats });
  } catch (error) {
    console.error('Hiscores fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});