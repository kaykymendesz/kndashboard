import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const users = [
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

async function verifyPassword(user: (typeof users)[0], password: string) {
  if (user.passwordHash) {
    return bcrypt.compare(password, user.passwordHash);
  }
  return password === user.passwordPlain;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
