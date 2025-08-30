export const isValidUserId = (userId: string) => {
  const uuidRegex = /^[a-zA-Z0-9-_]{22,}$/; // Regex for alphanumeric userId format
  return uuidRegex.test(userId);
};