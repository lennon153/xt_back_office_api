export const formatDateHour = (date: Date): string => {
  const yyyy = date.getFullYear();

  const mm = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");

  const hh = String(date.getHours()).padStart(2, "0"); // 24-hour format

  return `${yyyy}-${mm}-${dd}:${hh}`;
};
