export function formatTime(ms) {
  const sec = Math.ceil(ms / 1000);

  if (sec < 60) {
    return sec + "s";
  }

  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return m + ":" + String(s).padStart(2, "0");
}
