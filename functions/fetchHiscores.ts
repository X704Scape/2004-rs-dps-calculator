import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username } = await req.json();

    if (!username) {
      return Response.json({ error: 'Username required' }, { status: 400 });
    }

    const response = await fetch(`https://2004.lostcity.rs/hiscores/player/${username}`);
    const html = await response.text();

    // Parse stats from HTML
    const stats = {
      hitpoints: 10,
      attack: 1,
      strength: 1,
      defence: 1,
      ranged: 1,
      magic: 1,
      prayer: 1
    };

    // Extract level values from the HTML
    const levelMatches = html.matchAll(/level.*?(\d+)/gi);
    const levels = Array.from(levelMatches).map(m => parseInt(m[1]));

    // Map to specific skills based on typical hiscores order
    if (levels.length >= 7) {
      stats.hitpoints = levels[3] || 10;
      stats.attack = levels[0] || 1;
      stats.strength = levels[1] || 1;
      stats.defence = levels[2] || 1;
      stats.ranged = levels[4] || 1;
      stats.prayer = levels[5] || 1;
      stats.magic = levels[6] || 1;
    }

    return Response.json({ stats });
  } catch (error) {
    console.error('Hiscores fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});