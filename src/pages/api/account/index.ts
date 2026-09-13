import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateNameSchema = z.object({
  action: z.literal("name"),
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
});

const updatePasswordSchema = z.object({
  action: z.literal("password"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
});

const schema = z.discriminatedUnion("action", [updateNameSchema, updatePasswordSchema]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (parsed.data.action === "name") {
    const updated = await db.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true },
    });
    return res.status(200).json(updated);
  }

  if (parsed.data.action === "password") {
    if (!user.password) {
      return res.status(400).json({ error: "This account uses social login and doesn't have a password." });
    }
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect." });

    const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.user.update({ where: { id: user.id }, data: { password: hashed } });
    return res.status(200).json({ success: true });
  }
}
