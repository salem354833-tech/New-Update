import { logger } from '@/utils/logger';

describe('logger', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logger.info calls console.log with INFO level', () => {
    logger.info('test message');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('[INFO]');
    expect(consoleSpy.mock.calls[0][0]).toContain('test message');
  });

  it('logger.warn calls console.warn with WARN level', () => {
    logger.warn('warning');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]');
  });

  it('logger.error calls console.error with ERROR level', () => {
    logger.error('error occurred');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
  });

  it('logger.debug calls console.debug in non-production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    logger.debug('debug info');
    expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]');
    process.env.NODE_ENV = originalEnv;
  });

  it('logger.debug does not log in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    logger.debug('debug info');
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    process.env.NODE_ENV = originalEnv;
  });

  it('includes context fields in output', () => {
    logger.info('with context', { guildId: 'g1', userId: 'u1' });
    expect(consoleSpy.mock.calls[0][0]).toContain('g1');
    expect(consoleSpy.mock.calls[0][0]).toContain('u1');
  });

  it('includes a timestamp in the output', () => {
    logger.info('timestamped');
    expect(consoleSpy.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
