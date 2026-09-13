import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendBusinessApprovedEmail } from "@/lib/email";

const schema = z.object({ isVerified: z.boolean() });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });

  const { id } = req.query as { id: string };
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid data" });

  const business = await db.business.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!business) return res.status(404).json({ error: "Business not found" });

  const wasUnverified = !business.isVerified;
  const updated = await db.business.update({
    where: { id },
    data: { isVerified: parsed.data.isVerified },
  });

  if (parsed.data.isVerified && wasUnverified) {
    sendBusinessApprovedEmail(business.user.email, business.user.name ?? "", business.name, business.slug).catch(console.error);
  }

  return res.status(200).json(updated);
}
