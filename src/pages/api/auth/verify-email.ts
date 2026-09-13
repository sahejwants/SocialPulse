import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.method === "GET" ? (req.query.token as string) : req.body?.token;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Verification token is required." });
  }

  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken || verificationToken.type !== "email-verification") {
      return res.status(400).json({ error: "Invalid or expired verification link." });
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return res.status(400).json({ error: "This verification link has expired. Please request a new one." });
    }

    if (verificationToken.user.emailVerified) {
      await db.verificationToken.delete({ where: { token } });
      return res.status(200).json({ success: true, message: "Email already verified." });
    }

    await db.$transaction([
      db.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.delete({ where: { token } }),
    ]);

    sendWelcomeEmail(verificationToken.user.email, verificationToken.user.name ?? "").catch(console.error);

    return res.status(200).json({ success: true, message: "Email verified successfully." });
  } catch {
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
