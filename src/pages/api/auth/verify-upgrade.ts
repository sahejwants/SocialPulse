import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { sendRoleUpgradedEmail } from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { token } = req.query as { token: string };
  if (!token) return res.redirect(302, "/account/upgrade?error=missing_token");

  const record = await db.verificationToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, name: true, role: true, deletedAt: true } } },
  });

  if (!record) return res.redirect(302, "/account/upgrade?error=invalid_token");
  if (record.type !== "role-upgrade") return res.redirect(302, "/account/upgrade?error=invalid_token");
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return res.redirect(302, "/account/upgrade?error=expired_token");
  }
  if (record.user.deletedAt) return res.redirect(302, "/auth/login?error=account_deactivated");
  if (record.user.role !== Role.USER) {
    await db.verificationToken.delete({ where: { token } });
    return res.redirect(302, "/account/upgrade?error=already_upgraded");
  }

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { role: Role.BUSINESS_OWNER } }),
    db.verificationToken.delete({ where: { token } }),
  ]);

  sendRoleUpgradedEmail(record.user.email, record.user.name ?? "").catch(console.error);

  // User's JWT still holds the old role — they must sign in again to pick up the new one.
  return res.redirect(302, "/upgrade-success");
}
