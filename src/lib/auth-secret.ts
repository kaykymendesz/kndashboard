export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    return "dev-secret-change-in-production";
  }

  throw new Error(
    "AUTH_SECRET não configurada no Vercel. " +
      "Em Settings → Environment Variables, adicione AUTH_SECRET " +
      "(gere com: openssl rand -base64 32) e faça Redeploy."
  );
}
