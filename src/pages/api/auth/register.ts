import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import slugify from "slugify";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  role: z.enum(["USER", "BUSINESS_OWNER"]).default("USER"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const { name, email, password, role } = parsed.data;

  try {
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role,
      },
    });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.verificationToken.create({
      data: {
        token,
        userId: user.id,
        type: "email-verification",
        expires,
      },
    });

    console.log(`Verification token for ${user.email}: ${token}`); // For debugging purposes

    await sendVerificationEmail(user.email, user.name ?? "", token);

    return res.status(201).json({
      success: true,
      message: "Account created. Please check your email to verify your account.",
    });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
