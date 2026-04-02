import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';

import type { BotCommand } from '@/types';
import { configManager } from '@/utils/configManager';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('show-settings')
    .setDescription('عرض الإعدادات الحالية للبوت'),

  async execute(interaction: unknown): Promise<void> {
    const i = interaction as ChatInputCommandInteraction;
    if (!i.guildId) return;

    await i.deferReply({ ephemeral: true });

    const config = configManager.get(i.guildId);

    const channelDisplay = config.welcomeChannelId
      ? `<#${config.welcomeChannelId}>`
      : 'غير محددة';

    const embed = new EmbedBuilder()
      .setTitle('إعدادات بوت الترحيب')
      .setColor(config.frameColor as `#${string}`)
      .addFields(
        { name: 'قناة الترحيب', value: channelDisplay, inline: true },
        { name: 'لون الإطار', value: `\`${config.frameColor}\``, inline: true },
        { name: 'نص الترحيب', value: config.welcomeMessage },
      )
      .setTimestamp();

    await i.editReply({ embeds: [embed] });
  },
};

export default command;
