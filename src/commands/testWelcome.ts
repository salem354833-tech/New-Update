import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  AttachmentBuilder,
} from 'discord.js';

import type { BotCommand } from '@/types';
import { configManager } from '@/utils/configManager';
import { generateWelcomeCard } from '@/utils/imageGenerator';
import { logger } from '@/utils/logger';

const DEFAULT_AVATAR_URL = 'https://cdn.discordapp.com/embed/avatars/0.png';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('test-welcome')
    .setDescription('اختبار رسالة الترحيب'),

  async execute(interaction: unknown): Promise<void> {
    const i = interaction as ChatInputCommandInteraction;
    if (!i.guildId || !i.guild) return;

    await i.deferReply();

    const guildId = i.guildId;
    const userId = i.user.id;

    try {
      const config = configManager.get(guildId);

      const avatarUrl = i.user.displayAvatarURL({ extension: 'png', size: 512 });
      const response = await fetch(avatarUrl);
      const avatarBuffer = response.ok
        ? Buffer.from(await response.arrayBuffer())
        : Buffer.from(await (await fetch(DEFAULT_AVATAR_URL)).arrayBuffer());

      const imageBuffer = await generateWelcomeCard({
        avatarBuffer,
        username: i.user.username,
        memberCount: i.guild.memberCount,
        frameColor: config.frameColor,
        backgroundColor: config.backgroundColor,
      });

      const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

      await i.editReply({
        content: `${config.welcomeMessage}\n<@${i.user.id}>`,
        allowedMentions: {
          parse: [],
          users: [i.user.id],
        },
        files: [attachment],
      });

      logger.info('Test welcome sent', { guildId, userId });
    } catch (err) {
      logger.error('Test welcome failed', { guildId, userId, err });
      await i.editReply('حدث خطأ أثناء توليد صورة الترحيب.');
    }
  },
};

export default command;
