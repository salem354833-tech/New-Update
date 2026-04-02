import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';

import { Client, GatewayIntentBits, Collection } from 'discord.js';

import type { BotEvent, BotCommand } from '@/types';
import { logger } from '@/utils/logger';

function validateEnv(): void {
  const required = ['DISCORD_TOKEN', 'CLIENT_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

interface ExtendedClient extends Client {
  commands: Collection<string, BotCommand>;
}

function isRuntimeScriptFile(fileName: string): boolean {
  return (fileName.endsWith('.js') || fileName.endsWith('.ts')) && !fileName.endsWith('.d.ts');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
}) as ExtendedClient;

client.commands = new Collection<string, BotCommand>();

async function loadCommands(): Promise<void> {
  const commandsPath = path.join(__dirname, 'commands');
  if (!fs.existsSync(commandsPath)) return;

  const commandFiles = fs.readdirSync(commandsPath).filter(isRuntimeScriptFile);
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(filePath)) as { default?: BotCommand } & BotCommand;
    const cmd = command.default ?? command;
    if ('data' in cmd && 'execute' in cmd) {
      client.commands.set(cmd.data.name, cmd);
    } else {
      logger.warn(`Command file ${file} is missing required properties`);
    }
  }
}

async function loadEvents(): Promise<void> {
  const eventsPath = path.join(__dirname, 'events');
  if (!fs.existsSync(eventsPath)) return;

  const eventFiles = fs.readdirSync(eventsPath).filter(isRuntimeScriptFile);
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = (await import(filePath)) as { default?: BotEvent } & BotEvent;
    const evt = event.default ?? event;
    if (evt.once) {
      client.once(evt.name, (...args) => void evt.execute(...args));
    } else {
      client.on(evt.name, (...args) => void evt.execute(...args));
    }
  }
}

async function main(): Promise<void> {
  await loadCommands();
  await loadEvents();

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error('Command execution failed', {
        guildId: interaction.guildId ?? undefined,
        userId: interaction.user.id,
        command: interaction.commandName,
        err,
      });
      const reply = { content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
}

void main();
