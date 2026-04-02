import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type TextChannel,
} from 'discord.js';

import type { BotCommand } from '@/types';
import { configManager } from '@/utils/configManager';
import { logger } from '@/utils/logger';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('set-channel')
    .setDescription('تحديد قناة الترحيب')
    .addChannelOption((option) =>
      option.setName('channel').setDescription('القناة المستخدمة للترحيب').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: unknown): Promise<void> {
    const i = interaction as ChatInputCommandInteraction;
    if (!i.guildId) return;

    await i.deferReply({ ephemeral: true });

    const channel = i.options.getChannel('channel', true) as TextChannel;

    configManager.set(i.guildId, { welcomeChannelId: channel.id });

    logger.info('Welcome channel updated', { guildId: i.guildId, channelId: channel.id });

    await i.editReply(`تم تعيين قناة الترحيب إلى ${channel}.`);
  },
};

export default command;
