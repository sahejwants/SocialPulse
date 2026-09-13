import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import crypto from "crypto";
import { sendRoleUpgradeEmail } from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  if (session.user.role !== Role.USER) {
    return res.status(400).json({ error: "Only standard user accounts can request an upgrade." });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, email: true, name: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Remove any existing upgrade tokens for this user
  await db.verificationToken.deleteMany({
    where: { userId: user.id, type: "role-upgrade" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.verificationToken.create({
    data: { token, userId: user.id, type: "role-upgrade", expires },
  });

  await sendRoleUpgradeEmail(user.email, user.name ?? "", token);

  return res.status(200).json({ ok: true });
}
