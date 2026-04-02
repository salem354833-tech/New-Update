export interface GuildConfig {
  readonly guildId: string;
  welcomeChannelId: string | null;
  welcomeMessage: string;
  frameColor: string;
  backgroundColor: string;
}

export interface WelcomeCardOptions {
  readonly avatarBuffer: Buffer;
  readonly username: string;
  readonly memberCount: number;
  readonly frameColor: string;
  readonly backgroundColor: string;
}

export interface LogContext {
  readonly guildId?: string;
  readonly userId?: string;
  readonly [key: string]: unknown;
}

export interface BotEvent {
  readonly name: string;
  readonly once?: boolean;
  execute: (...args: unknown[]) => void | Promise<void>;
}

export interface BotCommand {
  readonly data: {
    readonly name: string;
    toJSON: () => unknown;
  };
  execute: (interaction: unknown) => Promise<void>;
}
