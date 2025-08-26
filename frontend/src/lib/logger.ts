/**
 * Creates a scoped logger that prefixes all messages with a given scope.
 * This helps to identify the source of log messages in the console.
 *
 * @param scope - The scope to use for the logger (e.g., 'API', 'Component').
 * @returns A logger object with debug, info, warn, and error methods.
 */
export const createScopedLogger = (scope: string) => ({
  debug: (...args: unknown[]) => console.log(`[${scope}] DEBUG:`, ...args),
  info: (...args: unknown[]) => console.info(`[${scope}] INFO:`, ...args),
  warn: (...args: unknown[]) => console.warn(`[${scope}] WARN:`, ...args),
  error: (...args: unknown[]) => console.error(`[${scope}] ERROR:`, ...args),
});
