import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query as { id: string };

  const campaign = await db.campaign.findUnique({ where: { id, deletedAt: null }, select: { userId: true } });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  const isOwner = campaign.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const registrations = await db.campaignRegistration.findMany({
    where: { campaignId: id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(registrations);
}
