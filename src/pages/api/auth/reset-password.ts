import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const schema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const { token, password } = parsed.data;

  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken || verificationToken.type !== "password-reset") {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return res.status(400).json({ error: "This reset link has expired. Please request a new one." });
    }

    const hashed = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: verificationToken.userId },
        data: { password: hashed },
      }),
      db.verificationToken.delete({ where: { token } }),
    ]);

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
