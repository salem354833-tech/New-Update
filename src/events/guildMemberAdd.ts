import { Events, type GuildMember, AttachmentBuilder } from 'discord.js';

import type { BotEvent } from '@/types';
import { configManager } from '@/utils/configManager';
import { generateWelcomeCard } from '@/utils/imageGenerator';
import { logger } from '@/utils/logger';

const DEFAULT_AVATAR_URL = 'https://cdn.discordapp.com/embed/avatars/0.png';

async function fetchAvatarBuffer(member: GuildMember): Promise<Buffer> {
  const url = member.user.displayAvatarURL({ extension: 'png', size: 512 }) ?? DEFAULT_AVATAR_URL;
  const response = await fetch(url);
  if (!response.ok) {
    const fallback = await fetch(DEFAULT_AVATAR_URL);
    return Buffer.from(await fallback.arrayBuffer());
  }
  return Buffer.from(await response.arrayBuffer());
}

const event: BotEvent = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(...args: unknown[]): Promise<void> {
    const member = args[0] as GuildMember;
    const guildId = member.guild.id;
    const userId = member.user.id;

    try {
      const config = configManager.get(guildId);

      if (!config.welcomeChannelId) {
        logger.warn('No welcome channel configured', { guildId });
        return;
      }

      const channel = member.guild.channels.cache.get(config.welcomeChannelId);
      if (!channel?.isTextBased()) {
        logger.warn('Welcome channel not found or not text-based', { guildId, channelId: config.welcomeChannelId });
        return;
      }

      const avatarBuffer = await fetchAvatarBuffer(member);
      const memberCount = member.guild.memberCount;

      const imageBuffer = await generateWelcomeCard({
        avatarBuffer,
        username: member.user.username,
        memberCount,
        frameColor: config.frameColor,
        backgroundColor: config.backgroundColor,
      });

      const attachment = new AttachmentBuilder(imageBuffer, { name: 'welcome.png' });

      await channel.send({
        content: `${config.welcomeMessage}\n<@${member.id}>`,
        allowedMentions: {
          parse: [],
          users: [member.id],
        },
        files: [attachment],
      });

      logger.info('Welcome message sent', { guildId, userId });
    } catch (err) {
      logger.error('Failed to send welcome message', { guildId, userId, err });
    }
  },
};

export default event;
