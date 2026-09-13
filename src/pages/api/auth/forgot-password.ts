import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  // Always return success to prevent email enumeration
  const successResponse = {
    success: true,
    message: "If an account with that email exists, we've sent a password reset link.",
  };

  try {
    const user = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user) return res.status(200).json(successResponse);

    // Invalidate existing reset tokens
    await db.verificationToken.deleteMany({
      where: { userId: user.id, type: "password-reset" },
    });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.verificationToken.create({
      data: {
        token,
        userId: user.id,
        type: "password-reset",
        expires,
      },
    });

    await sendPasswordResetEmail(user.email, user.name ?? "", token);

    return res.status(200).json(successResponse);
  } catch {
    return res.status(200).json(successResponse);
  }
}
