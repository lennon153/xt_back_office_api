let counter = 0; // in-memory counter (resets on server restart)
export const generateId = (prefix: string): string => {
  counter += 1;
  const numberStr = counter.toString().padStart(3, "0"); // 001, 002, 003
  return `${prefix}${numberStr}`;
};