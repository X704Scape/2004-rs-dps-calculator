import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SKILL_TYPE_MAP = {
  attack: 1,
  defence: 2,
  strength: 3,
  hitpoints: 4,
  ranged: 5,
  prayer: 6,
  magic: 7
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username } = await req.json();

    if (!username) {
      return Response.json({ error: 'Username required' }, { status: 400 });
    }

    const normalizedUsername = username.trim().replace(/ /g, '_');
    
    // Try the JSON API endpoint first
    const response = await fetch(
      `https://2004.lostcity.rs/api/hiscores/player/${encodeURIComponent(normalizedUsername)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/html, */*',
          'Origin': 'https://2004.lostcity.rs',
          'Referer': 'https://2004.lostcity.rs/hiscores'
        }
      }
    );

    console.log('API status:', response.status);

    if (response.status === 404) {
      return Response.json({ error: `Player "${username}" not found on hiscores` }, { status: 404 });
    }

    if (!response.ok) {
      return Response.json({ error: `Player "${username}" not found or hiscores unavailable` }, { status: 404 });
    }

    const data = await response.json();

    const stats = {
      hitpoints: 10,
      attack: 1,
      strength: 1,
      defence: 1,
      ranged: 1,
      magic: 1,
      prayer: 1
    };

    for (const entry of data) {
      for (const [skillName, typeId] of Object.entries(SKILL_TYPE_MAP)) {
        if (entry.type === typeId && entry.level) {
          stats[skillName] = entry.level;
        }
      }
    }

    return Response.json({ stats });
  } catch (error) {
    console.error('Hiscores fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});