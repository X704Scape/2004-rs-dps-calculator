import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TYPE_MAP = {
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
    const url = `https://2004.lostcity.rs/api/hiscores/player/${encodeURIComponent(normalizedUsername)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });

    console.log('Status:', response.status, 'URL:', url);

    if (!response.ok) {
      return Response.json({ error: `Player "${username}" not found on hiscores` }, { status: 404 });
    }

    const data = await response.json();
    const stats = {};
    for (const entry of data) {
      const skillName = TYPE_MAP[entry.type];
      if (skillName && entry.level) stats[skillName] = entry.level;
    }

    return Response.json({ stats });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});