import React, { useState, useEffect } from 'react';

const SPRITE_SIZE = 32;

const ITEM_SHEET = 'https://raw.githubusercontent.com/X704Scape/2004-rs-dps-calculator/main/item_spritesheet.png';
const NPC_SHEET = 'https://raw.githubusercontent.com/X704Scape/2004-rs-dps-calculator/main/npc_spritesheet.png';

// Cache detected column counts per sheet URL
const colsCache = {};

function useSheetCols(sheetUrl) {
  const [cols, setCols] = useState(colsCache[sheetUrl] || null);

  useEffect(() => {
    if (colsCache[sheetUrl]) {
      setCols(colsCache[sheetUrl]);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const detected = Math.round(img.naturalWidth / SPRITE_SIZE);
      colsCache[sheetUrl] = detected;
      setCols(detected);
    };
    img.src = sheetUrl;
  }, [sheetUrl]);

  return cols;
}

/**
 * Renders a sprite from the item or npc spritesheet by numeric ID.
 * id: numeric item/npc ID (= position in spritesheet, 0-indexed)
 * type: 'item' | 'npc'
 * size: rendered pixel size (default 32)
 */
export default function GameSprite({ id, type = 'item', size = 32, className = '', style = {} }) {
  const sheet = type === 'npc' ? NPC_SHEET : ITEM_SHEET;
  const cols = useSheetCols(sheet);

  if (id == null || id === '' || isNaN(Number(id))) return null;
  if (!cols) return <div style={{ width: size, height: size, flexShrink: 0 }} />;

  const numId = Number(id);
  const col = numId % cols;
  const row = Math.floor(numId / cols);
  const scale = size / SPRITE_SIZE;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `${-col * SPRITE_SIZE * scale}px ${-row * SPRITE_SIZE * scale}px`,
        backgroundSize: `${cols * SPRITE_SIZE * scale}px auto`,
        imageRendering: 'pixelated',
        flexShrink: 0,
        ...style,
      }}
      title={`ID: ${numId}`}
    />
  );
}