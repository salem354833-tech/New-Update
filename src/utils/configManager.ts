import fs from 'node:fs';
import path from 'node:path';

import type { GuildConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/config/defaultConfig';
import { logger } from '@/utils/logger';

export class ConfigNotFoundError extends Error {
  constructor(guildId: string) {
    super(`Config not found for guild: ${guildId}`);
    this.name = 'ConfigNotFoundError';
  }
}

function getConfigPath(): string {
  return path.resolve(process.cwd(), 'config.json');
}

type ConfigStore = Record<string, GuildConfig>;

function loadStore(): ConfigStore {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as ConfigStore;
  } catch (err) {
    logger.error('Failed to parse config.json', { err });
    return {};
  }
}

function saveStore(store: ConfigStore): void {
  const configPath = getConfigPath();
  const tmp = `${configPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
  fs.renameSync(tmp, configPath);
}

export const configManager = {
  get(guildId: string): GuildConfig {
    const store = loadStore();
    if (!store[guildId]) {
      return { guildId, ...DEFAULT_CONFIG };
    }
    return store[guildId];
  },

  set(guildId: string, updates: Partial<Omit<GuildConfig, 'guildId'>>): GuildConfig {
    const store = loadStore();
    const existing = store[guildId] ?? { guildId, ...DEFAULT_CONFIG };
    const updated: GuildConfig = { ...existing, ...updates };
    store[guildId] = updated;
    saveStore(store);
    return updated;
  },

  exists(guildId: string): boolean {
    const store = loadStore();
    return Boolean(store[guildId]);
  },
};
