// Small mapping helper for multi-select fields stored as comma-separated strings in SQLite
export function arrayToCsv(values?: string[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(',');
}

export function csvToArray(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}
