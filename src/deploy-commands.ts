import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';

import { REST, Routes } from 'discord.js';

import { logger } from '@/utils/logger';
import type { BotCommand } from '@/types';

function isRuntimeScriptFile(fileName: string): boolean {
  return (fileName.endsWith('.js') || fileName.endsWith('.ts')) && !fileName.endsWith('.d.ts');
}

function validateEnv(): void {
  const required = ['DISCORD_TOKEN', 'CLIENT_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

async function deployCommands(): Promise<void> {
  const commands: unknown[] = [];
  const commandsPath = path.join(__dirname, 'commands');

  if (!fs.existsSync(commandsPath)) {
    logger.warn('Commands directory not found');
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(isRuntimeScriptFile);
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(filePath)) as { default?: BotCommand } & BotCommand;
    const cmd = command.default ?? command;
    if ('data' in cmd) {
      commands.push(cmd.data.toJSON());
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  const clientId = process.env.CLIENT_ID!;
  const guildId = process.env.GUILD_ID;

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    logger.info(`Registered ${commands.length} guild commands for guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    logger.info(`Registered ${commands.length} global commands`);
  }
}

void deployCommands();
