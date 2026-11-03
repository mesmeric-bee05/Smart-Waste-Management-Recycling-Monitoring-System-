function toValidDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatUtcDate(value: Date | string): string {
  const date = toValidDate(value);
  return date ? `${date.toISOString().slice(0, 10)} UTC` : "Unknown date";
}

export function formatUtcTime(value: Date | string): string {
  const date = toValidDate(value);
  return date ? `${date.toISOString().slice(11, 16)} UTC` : "Unknown time";
}

export function formatUtcDateTime(value: Date | string): string {
  const date = toValidDate(value);
  return date ? `${date.toISOString().slice(0, 16).replace("T", " ")} UTC` : "Unknown time";
}
