import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js';

import type { BotCommand } from '@/types';
import { configManager } from '@/utils/configManager';
import { logger } from '@/utils/logger';

const MENTION_PATTERN = /@(everyone|here)|<@&\d+>/g;

function sanitizeMessage(text: string): string {
  return text.replace(MENTION_PATTERN, '[mention]');
}

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('set-message')
    .setDescription('تعديل نص رسالة الترحيب')
    .addStringOption((option) =>
      option.setName('message').setDescription('نص رسالة الترحيب').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: unknown): Promise<void> {
    const i = interaction as ChatInputCommandInteraction;
    if (!i.guildId) return;

    await i.deferReply({ ephemeral: true });

    const raw = i.options.getString('message', true);
    const message = sanitizeMessage(raw);

    configManager.set(i.guildId, { welcomeMessage: message });

    logger.info('Welcome message updated', { guildId: i.guildId });

    await i.editReply(`تم تعيين نص الترحيب:\n${message}`);
  },
};

export default command;
