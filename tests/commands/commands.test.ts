import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import { configManager } from '@/utils/configManager';

jest.mock('discord.js', () => {
  const actual = jest.requireActual<typeof import('discord.js')>('discord.js');
  return {
    ...actual,
    AttachmentBuilder: jest.fn().mockImplementation(() => ({})),
    EmbedBuilder: jest.fn().mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setColor: jest.fn().mockReturnThis(),
      addFields: jest.fn().mockReturnThis(),
      setTimestamp: jest.fn().mockReturnThis(),
    })),
  };
});

jest.mock('@/utils/imageGenerator', () => ({
  generateWelcomeCard: jest.fn().mockResolvedValue(Buffer.from('img')),
}));

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmd-test-'));
  jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeInteraction(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    guildId: 'guild1',
    guild: { memberCount: 10 },
    user: {
      id: 'user1',
      username: 'Tester',
      displayAvatarURL: jest.fn().mockReturnValue('https://cdn.discordapp.com/embed/avatars/0.png'),
      toString: () => '<@user1>',
    },
    options: {
      getChannel: jest.fn(),
      getString: jest.fn(),
    },
    deferReply: jest.fn().mockResolvedValue(undefined),
    editReply: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// /set-channel
// ---------------------------------------------------------------------------

describe('/set-channel', () => {
  it('saves welcomeChannelId and replies with channel mention', async () => {
    const { default: setChannel } = await import('@/commands/setChannel');

    const channel = { id: 'chan123', toString: () => '<#chan123>' };
    const i = makeInteraction();
    (i.options as { getChannel: jest.Mock }).getChannel.mockReturnValue(channel);

    await setChannel.execute(i);

    expect(i.deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(configManager.get('guild1').welcomeChannelId).toBe('chan123');
    expect(i.editReply).toHaveBeenCalledWith(expect.stringContaining('<#chan123>'));
  });

  it('does nothing when guildId is missing', async () => {
    const { default: setChannel } = await import('@/commands/setChannel');

    const i = makeInteraction({ guildId: null });

    await setChannel.execute(i);

    expect(i.deferReply).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// /set-message
// ---------------------------------------------------------------------------

describe('/set-message', () => {
  it('saves sanitised welcome message and replies', async () => {
    const { default: setMessage } = await import('@/commands/setMessage');

    const i = makeInteraction();
    (i.options as { getString: jest.Mock }).getString.mockReturnValue(
      'Hello @everyone and <@&111>!',
    );

    await setMessage.execute(i);

    const saved = configManager.get('guild1').welcomeMessage;
    expect(saved).not.toContain('@everyone');
    expect(saved).toContain('[mention]');
    expect(i.editReply).toHaveBeenCalledWith(expect.stringContaining('[mention]'));
  });

  it('does nothing when guildId is missing', async () => {
    const { default: setMessage } = await import('@/commands/setMessage');

    const i = makeInteraction({ guildId: null });
    await setMessage.execute(i);

    expect(i.deferReply).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// /set-color
// ---------------------------------------------------------------------------

describe('/set-color', () => {
  it('saves valid hex color and replies with confirmation', async () => {
    const { default: setColor } = await import('@/commands/setColor');

    const i = makeInteraction();
    (i.options as { getString: jest.Mock }).getString.mockReturnValue('#FF0000');

    await setColor.execute(i);

    expect(configManager.get('guild1').frameColor).toBe('#FF0000');
    expect(i.editReply).toHaveBeenCalledWith(expect.stringContaining('#FF0000'));
  });

  it('rejects an invalid hex color without saving', async () => {
    const { default: setColor } = await import('@/commands/setColor');

    const i = makeInteraction();
    (i.options as { getString: jest.Mock }).getString.mockReturnValue('notacolor');

    await setColor.execute(i);

    expect(i.editReply).toHaveBeenCalledWith(expect.stringMatching(/غير صالح/));
    expect(configManager.exists('guild1')).toBe(false);
  });

  it('does nothing when guildId is missing', async () => {
    const { default: setColor } = await import('@/commands/setColor');

    const i = makeInteraction({ guildId: null });
    await setColor.execute(i);

    expect(i.deferReply).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// /test-welcome
// ---------------------------------------------------------------------------

describe('/test-welcome', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    }) as jest.Mock;
  });

  it('generates a welcome card and sends it', async () => {
    const { generateWelcomeCard } = await import('@/utils/imageGenerator');
    const { default: testWelcome } = await import('@/commands/testWelcome');

    const i = makeInteraction();

    await testWelcome.execute(i);

    expect(i.deferReply).toHaveBeenCalled();
    expect(generateWelcomeCard).toHaveBeenCalled();
    expect(i.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('<@user1>'),
        allowedMentions: expect.objectContaining({
          parse: [],
          users: ['user1'],
        }),
        files: expect.any(Array),
      }),
    );
  });

  it('replies with error message when card generation fails', async () => {
    const { generateWelcomeCard } = await import('@/utils/imageGenerator');
    (generateWelcomeCard as jest.Mock).mockRejectedValueOnce(new Error('canvas error'));

    const { default: testWelcome } = await import('@/commands/testWelcome');

    const i = makeInteraction();

    await testWelcome.execute(i);

    expect(i.editReply).toHaveBeenCalledWith(expect.stringMatching(/خطأ/));
  });

  it('does nothing when guildId or guild is missing', async () => {
    const { default: testWelcome } = await import('@/commands/testWelcome');

    const i = makeInteraction({ guildId: null, guild: null });
    await testWelcome.execute(i);

    expect(i.deferReply).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// /show-settings
// ---------------------------------------------------------------------------

describe('/show-settings', () => {
  it('replies with an embed containing current settings', async () => {
    configManager.set('guild1', { welcomeChannelId: 'chan99', frameColor: '#ABCDEF' });

    const { default: showSettings } = await import('@/commands/showSettings');
    const { EmbedBuilder } = await import('discord.js');

    const i = makeInteraction();

    await showSettings.execute(i);

    expect(i.deferReply).toHaveBeenCalledWith({ ephemeral: true });
    expect(EmbedBuilder).toHaveBeenCalled();
    expect(i.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });

  it('shows placeholder when no channel is configured', async () => {
    const { default: showSettings } = await import('@/commands/showSettings');
    const { EmbedBuilder } = await import('discord.js');
    const mockAddFields = jest.fn().mockReturnThis();
    (EmbedBuilder as unknown as jest.Mock).mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setColor: jest.fn().mockReturnThis(),
      addFields: mockAddFields,
      setTimestamp: jest.fn().mockReturnThis(),
    }));

    const i = makeInteraction();

    await showSettings.execute(i);

    const fieldsArg = mockAddFields.mock.calls[0] as Array<{ name: string; value: string }>;
    const channelField = fieldsArg.find((f) => f.name === 'قناة الترحيب');
    expect(channelField?.value).toBe('غير محددة');
  });

  it('does nothing when guildId is missing', async () => {
    const { default: showSettings } = await import('@/commands/showSettings');

    const i = makeInteraction({ guildId: null });
    await showSettings.execute(i);

    expect(i.deferReply).not.toHaveBeenCalled();
  });
});
