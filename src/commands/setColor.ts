import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js';

import type { BotCommand } from '@/types';
import { configManager } from '@/utils/configManager';
import { logger } from '@/utils/logger';

const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6})$/;

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('set-color')
    .setDescription('تغيير لون إطار الترحيب')
    .addStringOption((option) =>
      option.setName('color').setDescription('لون hex مثل #5865F2').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: unknown): Promise<void> {
    const i = interaction as ChatInputCommandInteraction;
    if (!i.guildId) return;

    await i.deferReply({ ephemeral: true });

    const color = i.options.getString('color', true).trim();

    if (!HEX_COLOR_PATTERN.test(color)) {
      await i.editReply('اللون غير صالح. يرجى إدخال لون hex مثل `#5865F2`.');
      return;
    }

    configManager.set(i.guildId, { frameColor: color });

    logger.info('Frame color updated', { guildId: i.guildId, color });

    await i.editReply(`تم تعيين لون الإطار إلى \`${color}\`.`);
  },
};

export default command;
