import { Events, type Client } from 'discord.js';

import type { BotEvent } from '@/types';
import { logger } from '@/utils/logger';

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,

  execute(...args: unknown[]): void {
    const client = args[0] as Client<true>;
    logger.info(`Bot online: ${client.user.tag}`);
  },
};

export default event;
