jest.mock('@napi-rs/canvas', () => {
  const mockCtx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textBaseline: '',
    beginPath: jest.fn(),
    arc: jest.fn(),
    closePath: jest.fn(),
    clip: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    drawImage: jest.fn(),
    fill: jest.fn(),
    fillRect: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
  };

  const mockCanvas = {
    getContext: jest.fn(() => mockCtx),
    toBuffer: jest.fn(() => Buffer.from('fake-png-data')),
  };

  return {
    createCanvas: jest.fn(() => mockCanvas),
    loadImage: jest.fn(() => Promise.resolve({ width: 128, height: 128 })),
  };
});

import { generateWelcomeCard } from '@/utils/imageGenerator';

describe('generateWelcomeCard', () => {
  const options = {
    avatarBuffer: Buffer.from('fake-avatar'),
    username: 'TestUser',
    memberCount: 42,
    frameColor: '#5865F2',
    backgroundColor: '#2C2F33',
  };

  it('returns a non-empty Buffer', async () => {
    const result = await generateWelcomeCard(options);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('completes within 2 seconds', async () => {
    const start = Date.now();
    await generateWelcomeCard(options);
    expect(Date.now() - start).toBeLessThan(2000);
  });

  it('calls toBuffer with image/png', async () => {
    const { createCanvas } = jest.requireMock('@napi-rs/canvas') as {
      createCanvas: jest.Mock;
    };
    const mockCanvas = createCanvas();
    await generateWelcomeCard(options);
    expect(mockCanvas.toBuffer).toHaveBeenCalledWith('image/png');
  });
});
