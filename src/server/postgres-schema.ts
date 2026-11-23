export function getPostgresSchema(connectionString: string): string {
  return new URL(connectionString).searchParams.get("schema") ?? "public";
}
