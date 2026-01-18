import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const WEAPONS_META_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696c1e34985164b40968262c/75ff494be_weapons_2004json.txt';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch the weapons metadata from external source
    const response = await fetch(WEAPONS_META_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch weapons metadata: ${response.status}`);
    }
    
    const weaponsData = await response.json();
    
    // Create a map indexed by item ID for fast lookups
    const weaponsMeta = Object.fromEntries(
      weaponsData.map(weapon => [
        weapon.id,
        {
          attackStyles: weapon.attackStyles || [],
          speedOverrides: weapon.speedOverrides || [],
          speedTicks: weapon.speedTicks
        }
      ])
    );
    
    return Response.json({ weaponsMeta });
  } catch (error) {
    console.error('Error fetching weapons metadata:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});