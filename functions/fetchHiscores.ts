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

    // Extract skill rows - format: Skill | Rank | Level | XP
    const attackMatch = html.match(/Attack.*?<td>(\d+)<\/td>/);
    const defenceMatch = html.match(/Defence.*?<td>(\d+)<\/td>/);
    const strengthMatch = html.match(/Strength.*?<td>(\d+)<\/td>/);
    const hitpointsMatch = html.match(/Hitpoints.*?<td>(\d+)<\/td>/);
    const rangedMatch = html.match(/Ranged.*?<td>(\d+)<\/td>/);
    const prayerMatch = html.match(/Prayer.*?<td>(\d+)<\/td>/);
    const magicMatch = html.match(/Magic.*?<td>(\d+)<\/td>/);

    if (attackMatch) stats.attack = parseInt(attackMatch[1]);
    if (defenceMatch) stats.defence = parseInt(defenceMatch[1]);
    if (strengthMatch) stats.strength = parseInt(strengthMatch[1]);
    if (hitpointsMatch) stats.hitpoints = parseInt(hitpointsMatch[1]);
    if (rangedMatch) stats.ranged = parseInt(rangedMatch[1]);
    if (prayerMatch) stats.prayer = parseInt(prayerMatch[1]);
    if (magicMatch) stats.magic = parseInt(magicMatch[1]);

    return Response.json({ stats });
  } catch (error) {
    console.error('Hiscores fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});