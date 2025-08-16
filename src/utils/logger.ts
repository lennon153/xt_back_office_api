export const log = {
  info: (...args: unknown[]) =>
    console.log("\x1b[32m[INFO]\x1b[0m", ...args), // Green

  warn: (...args: unknown[]) =>
    console.warn("\x1b[33m[WARN]\x1b[0m", ...args), // Yellow

  error: (...args: unknown[]) =>
    console.error("\x1b[31m[ERROR]\x1b[0m", ...args), // Red

  debug: (...args: unknown[]) =>
    console.debug("\x1b[36m[DEBUG]\x1b[0m", ...args), // Cyan
};
