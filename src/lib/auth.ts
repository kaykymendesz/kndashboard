import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { getAuthSecret } from "@/lib/auth-secret";

const fallbackUsers = [
  {
    id: "1",
    name: "Elaine Rebelo Anaya",
    email: process.env.AUTH_ELAINE_EMAIL ?? "elaine@kn.dev",
    passwordHash: process.env.AUTH_ELAINE_PASSWORD_HASH,
    passwordPlain: process.env.AUTH_ELAINE_PASSWORD ?? "elaine2026",
  },
  {
    id: "2",
    name: "Kayky Medes da Silva",
    email: process.env.AUTH_KAYKY_EMAIL ?? "kayky@kn.dev",
    passwordHash: process.env.AUTH_KAYKY_PASSWORD_HASH,
    passwordPlain: process.env.AUTH_KAYKY_PASSWORD ?? "kayky2026",
  },
];

type AuthUser = {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  passwordPlain?: string;
};

async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const normalized = email.toLowerCase();

  try {
    const dbUser = await db.query.appUsers.findFirst({
      where: eq(appUsers.email, normalized),
    });
    if (dbUser?.active) {
      return {
        id: String(dbUser.id),
        name: dbUser.name,
        email: dbUser.email,
        passwordHash: dbUser.passwordHash,
      };
    }
  } catch {
    // Banco indisponível — usa fallback env
  }

  const fallback = fallbackUsers.find((u) => u.email.toLowerCase() === normalized);
  return fallback ?? null;
}

async function verifyPassword(user: AuthUser, password: string) {
  if (user.passwordHash) {
    return bcrypt.compare(password, user.passwordHash);
  }
  if (user.passwordPlain) {
    return password === user.passwordPlain;
  }
  return false;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getAuthSecret(),
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user) return null;

        const valid = await verifyPassword(user, password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
