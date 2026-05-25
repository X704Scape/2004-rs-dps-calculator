import React from 'react';

const SPRITE_SIZE = 32;
const COLS = 16;

const ITEM_SHEET = 'https://2004.losthq.rs/img/item_spritesheet.png?v=274';
const NPC_SHEET = 'https://2004.losthq.rs/img/npc_spritesheet.png?v=274';

/**
 * Renders a sprite from the item or npc spritesheet by numeric ID.
 * id: numeric item/npc ID (= position in spritesheet, 0-indexed)
 * type: 'item' | 'npc'
 * size: rendered pixel size (default 32)
 */
export default function GameSprite({ id, type = 'item', size = 32, className = '', style = {} }) {
  if (id == null || id === '' || isNaN(Number(id))) return null;

  const numId = Number(id);
  const col = numId % COLS;
  const row = Math.floor(numId / COLS);

  const sheet = type === 'npc' ? NPC_SHEET : ITEM_SHEET;
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
        backgroundSize: `${COLS * SPRITE_SIZE * scale}px auto`,
        imageRendering: 'pixelated',
        flexShrink: 0,
        ...style,
      }}
      title={`ID: ${numId}`}
    />
  );
}