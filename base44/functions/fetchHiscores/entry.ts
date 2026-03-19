import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username } = await req.json();

    if (!username) {
      return Response.json({ error: 'Username required' }, { status: 400 });
    }

    const normalizedUsername = username.trim().replace(/ /g, '_');
    const response = await fetch(`https://2004.lostcity.rs/hiscores/player/${encodeURIComponent(normalizedUsername)}`);
    const html = await response.text();

    // Parse stats from HTML table structure
    const stats = {
      hitpoints: 10,
      attack: 1,
      strength: 1,
      defence: 1,
      ranged: 1,
      magic: 1,
      prayer: 1
    };

    // HTML structure: skill name inside <a> tag, then rank, level, xp in <td align="right"> cells
    // Pattern: skill name ... </td> rank </td> level </td>
    const getSkillLevel = (skillName) => {
      const regex = new RegExp(skillName + '[\\s\\S]*?<td align="right">\\s*[\\d,]+\\s*<\\/td>\\s*<td align="right">\\s*([\\d,]+)\\s*<\\/td>', 'i');
      const match = html.match(regex);
      return match ? parseInt(match[1].replace(/,/g, '')) : null;
    };

    const attack = getSkillLevel('Attack');
    const defence = getSkillLevel('Defence');
    const strength = getSkillLevel('Strength');
    const hitpoints = getSkillLevel('Hitpoints');
    const ranged = getSkillLevel('Ranged');
    const prayer = getSkillLevel('Prayer');
    const magic = getSkillLevel('Magic');

    if (attack) stats.attack = attack;
    if (defence) stats.defence = defence;
    if (strength) stats.strength = strength;
    if (hitpoints) stats.hitpoints = hitpoints;
    if (ranged) stats.ranged = ranged;
    if (prayer) stats.prayer = prayer;
    if (magic) stats.magic = magic;

    return Response.json({ stats });
  } catch (error) {
    console.error('Hiscores fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});