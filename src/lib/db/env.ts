const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "KNDASHBOARD_DATABASE_URL",
  "KNDASHBOARD_POSTGRES_URL",
  "KNDASHBOARD_POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
  "NEON_DATABASE_URL",
] as const;

export function getDatabaseUrl(): string {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  const wrongKey = "KNDASHBOARD_NEON_AUTH_BASE_URL";
  if (process.env[wrongKey]) {
    throw new Error(
      `A variável ${wrongKey} é do Neon Auth (login), não do Postgres. ` +
        "No Vercel, adicione DATABASE_URL com a connection string do Neon " +
        "(postgresql://... — copie em console.neon.tech → Connection string)."
    );
  }

  throw new Error(
    "DATABASE_URL não configurada no Vercel. " +
      "Crie a variável DATABASE_URL com a connection string Postgres do Neon " +
      "(postgresql://usuario:senha@host/banco?sslmode=require)."
  );
}

export function assertValidPostgresUrl(url: string) {
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL inválida: deve ser uma connection string Postgres (postgresql://...). " +
        "Não use URLs de API ou Neon Auth."
    );
  }
}
