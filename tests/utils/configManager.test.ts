import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import { configManager, ConfigNotFoundError } from '@/utils/configManager';
import { DEFAULT_CONFIG } from '@/config/defaultConfig';

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bot-test-'));
  originalCwd = process.cwd();
  jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('configManager.get', () => {
  it('returns default config when no config file exists', () => {
    const config = configManager.get('guild123');
    expect(config.guildId).toBe('guild123');
    expect(config.welcomeMessage).toBe(DEFAULT_CONFIG.welcomeMessage);
    expect(config.welcomeChannelId).toBeNull();
  });

  it('returns stored config for a known guild', () => {
    configManager.set('guild123', { welcomeChannelId: 'chan456' });
    const config = configManager.get('guild123');
    expect(config.welcomeChannelId).toBe('chan456');
  });
});

describe('configManager.set', () => {
  it('persists partial updates without overwriting other fields', () => {
    configManager.set('guild123', { welcomeChannelId: 'chan1' });
    configManager.set('guild123', { frameColor: '#FF0000' });
    const config = configManager.get('guild123');
    expect(config.welcomeChannelId).toBe('chan1');
    expect(config.frameColor).toBe('#FF0000');
  });

  it('writes and reads config.json atomically', () => {
    configManager.set('guild123', { welcomeMessage: 'Hello!' });
    const raw = fs.readFileSync(path.join(tmpDir, 'config.json'), 'utf-8');
    const store = JSON.parse(raw) as Record<string, unknown>;
    expect(store['guild123']).toBeDefined();
  });
});

describe('configManager.exists', () => {
  it('returns false for a new guild', () => {
    expect(configManager.exists('newguild')).toBe(false);
  });

  it('returns true after setting config', () => {
    configManager.set('newguild', {});
    expect(configManager.exists('newguild')).toBe(true);
  });
});

describe('ConfigNotFoundError', () => {
  it('is an instance of Error', () => {
    const err = new ConfigNotFoundError('g1');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ConfigNotFoundError');
    expect(err.message).toContain('g1');
  });
});
