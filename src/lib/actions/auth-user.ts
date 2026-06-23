"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Não autenticado");

  if (newPassword.length < 6) throw new Error("A nova senha deve ter pelo menos 6 caracteres.");

  const user = await db.query.appUsers.findFirst({
    where: eq(appUsers.email, session.user.email),
  });

  if (!user || !user.active) throw new Error("Usuário não encontrado.");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Senha atual incorreta.");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(appUsers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(appUsers.id, user.id));

  return { ok: true };
}
