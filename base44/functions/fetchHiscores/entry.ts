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

    const response = await fetch(
      `https://2004.lostcity.rs/api/hiscores/player/${encodeURIComponent(normalizedUsername)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://2004.lostcity.rs/hiscores',
          'Origin': 'https://2004.lostcity.rs',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
        }
      }
    );

    console.log('Hiscores API status:', response.status, 'for user:', normalizedUsername);

    if (!response.ok) {
      // Try the CSV/text hiscores endpoint as fallback
      const csvResponse = await fetch(
        `https://2004.lostcity.rs/hiscores/player/${encodeURIComponent(normalizedUsername)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/plain, */*',
            'Referer': 'https://2004.lostcity.rs/hiscores',
          }
        }
      );

      console.log('CSV fallback status:', csvResponse.status);

      if (!csvResponse.ok) {
        return Response.json({ error: `Player "${username}" not found on hiscores` }, { status: 404 });
      }

      // CSV format: rank,level,xp per line, one per skill in order
      // 0=Overall,1=Attack,2=Defence,3=Strength,4=Hitpoints,5=Ranged,6=Prayer,7=Magic...
      const text = await csvResponse.text();
      const lines = text.trim().split('\n');
      const stats = {};
      lines.forEach((line, idx) => {
        const skillName = TYPE_MAP[idx];
        if (!skillName) return;
        const parts = line.split(',');
        const level = parseInt(parts[1]);
        if (!isNaN(level) && level > 0) stats[skillName] = level;
      });

      return Response.json({ stats });
    }

    const data = await response.json();
    const stats = {};
    for (const entry of data) {
      const skillName = TYPE_MAP[entry.type];
      if (skillName && entry.level) stats[skillName] = entry.level;
    }

    return Response.json({ stats });
  } catch (error) {
    console.error('Hiscores fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});