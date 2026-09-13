import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const ad = await db.ad.findUnique({ where: { id, deletedAt: null }, include: { business: true } });
  if (!ad) return res.status(404).json({ error: "Ad not found" });

  const isOwner = ad.business.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  if (req.method === "DELETE") {
    await db.ad.update({ where: { id }, data: { deletedAt: new Date() } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
