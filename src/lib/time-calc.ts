/** Utility functions for time tracking pay calculations. */

/** Calculates worked hours from startTime/endTime strings and break minutes. */
export function calcHours(startTime: string, endTime: string, breakMins: number): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm) - breakMins;
  return Math.max(0, totalMins / 60);
}

/** Calculates pay owed for an array of time entries at a given hourly rate. */
export function calcPayOwed(
  entries: { startTime: string; endTime: string; breakMins: number }[],
  hourlyRate: number
): number {
  const totalHours = entries.reduce(
    (sum, e) => sum + calcHours(e.startTime, e.endTime, e.breakMins),
    0
  );
  return parseFloat((totalHours * hourlyRate).toFixed(2));
}
