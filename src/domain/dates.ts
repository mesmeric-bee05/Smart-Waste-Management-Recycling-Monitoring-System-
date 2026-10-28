export function parseScheduleDateAtNoonUtc(day: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;

  const scheduledAt = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(scheduledAt.getTime())) return null;
  if (scheduledAt.toISOString().slice(0, 10) !== day) return null;

  return scheduledAt;
}
