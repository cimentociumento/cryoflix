export const formatWatchTime = (seconds: number) => {
  const value = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return [hours, minutes, value % 60].map((part) => String(part).padStart(2, '0')).join(':');
};
