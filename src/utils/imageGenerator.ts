import path from 'node:path';
import fs from 'node:fs';

import { createCanvas, loadImage } from '@napi-rs/canvas';

import type { WelcomeCardOptions } from '@/types';
import { logger } from '@/utils/logger';

// Card dimensions maintain the exact template aspect ratio (617:305) scaled to 1100px wide
const CARD_WIDTH = 1100;
const CARD_HEIGHT = 544;

// Avatar circle — pixel-accurate values derived by scanning transparent pixels in
// assets/template.png (native 617×305) and scaling by 1100/617 = 1.783.
// Native centroid: (478, 152), avgR: 136 → scaled below.
const CIRCLE_CENTER_X = 851;
const CIRCLE_CENTER_Y = 271;
const CIRCLE_INNER_RADIUS = 243;
const AVATAR_SCALE = 1.0;
const AVATAR_OFFSET_X = 0;
const AVATAR_OFFSET_Y = 0;

const TEMPLATE_PATH = path.resolve(process.cwd(), 'assets', 'template.png');

let templateBuffer: Buffer | null = null;

function getTemplateBuffer(): Buffer {
  if (!templateBuffer) {
    if (fs.existsSync(TEMPLATE_PATH)) {
      templateBuffer = fs.readFileSync(TEMPLATE_PATH);
    } else {
      templateBuffer = Buffer.alloc(0);
      logger.warn('Template image not found, using blank background', { path: TEMPLATE_PATH });
    }
  }
  return templateBuffer;
}

export async function generateWelcomeCard(options: WelcomeCardOptions): Promise<Buffer> {
  const { avatarBuffer, frameColor, backgroundColor } = options;

  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext('2d');

  // 1. Solid background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 2. Template composited below the avatar
  const buf = getTemplateBuffer();
  if (buf.length > 0) {
    const template = await loadImage(buf);
    ctx.drawImage(template, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  // 3. Avatar drawn ON TOP of the template so it's not hidden by the dark wing shape
  ctx.save();
  ctx.beginPath();
  ctx.arc(CIRCLE_CENTER_X, CIRCLE_CENTER_Y, CIRCLE_INNER_RADIUS, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const avatar = await loadImage(avatarBuffer);
  // Nudge the avatar slightly so portrait avatars sit more naturally inside the ring.
  const avatarSize = CIRCLE_INNER_RADIUS * 2 * AVATAR_SCALE;
  const avatarX = CIRCLE_CENTER_X - avatarSize / 2 + AVATAR_OFFSET_X;
  const avatarY = CIRCLE_CENTER_Y - avatarSize / 2 + AVATAR_OFFSET_Y;
  ctx.drawImage(
    avatar,
    avatarX,
    avatarY,
    avatarSize,
    avatarSize,
  );
  ctx.restore();

  if (buf.length === 0) {
    // Fallback: plain colored ring when no template is available
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(CIRCLE_CENTER_X, CIRCLE_CENTER_Y, CIRCLE_INNER_RADIUS + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  return canvas.toBuffer('image/png');
}
