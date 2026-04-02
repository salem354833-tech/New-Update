import type { GuildConfig } from '@/types';

export const DEFAULT_WELCOME_MESSAGE = 'مرحباً بك في السيرفر! 🎉';
export const DEFAULT_FRAME_COLOR = '#5865F2';
export const DEFAULT_BACKGROUND_COLOR = '#2C2F33';

export const DEFAULT_CONFIG: Omit<GuildConfig, 'guildId'> = {
  welcomeChannelId: null,
  welcomeMessage: DEFAULT_WELCOME_MESSAGE,
  frameColor: DEFAULT_FRAME_COLOR,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
};
