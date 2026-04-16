/**
 * get today's date string in america/new_york timezone
 * puzzles roll over at midnight ET
 */
export function getTodayET(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}
