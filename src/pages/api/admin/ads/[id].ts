import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdStatus } from "@prisma/client";
import { z } from "zod";
import { sendAdRejectedEmail, sendAdApprovedEmail } from "@/lib/email";
import { emailEnabled } from "@/lib/flags";

const schema = z.object({
  status: z.enum([AdStatus.APPROVED, AdStatus.REJECTED]),
  rejectionReason: z.string().min(5).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });

  const { id } = req.query as { id: string };
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });

  const { status, rejectionReason } = parsed.data;
  if (status === AdStatus.REJECTED && !rejectionReason) {
    return res.status(400).json({ error: "A reason is required when rejecting an ad." });
  }

  const ad = await db.ad.findUnique({
    where: { id },
    include: { business: { include: { user: { select: { name: true, email: true } } } } },
  });
  if (!ad) return res.status(404).json({ error: "Ad not found" });

  const updated = await db.ad.update({
    where: { id },
    data: { status, rejectionReason: rejectionReason ?? null },
  });

  if (emailEnabled) {
    const ownerEmail = ad.business.user.email;
    const ownerName = ad.business.user.name ?? "";
    if (status === AdStatus.APPROVED) {
      sendAdApprovedEmail(ownerEmail, ownerName, ad.title, ad.business.slug).catch(console.error);
    } else if (status === AdStatus.REJECTED && rejectionReason) {
      sendAdRejectedEmail(ownerEmail, ownerName, ad.title, rejectionReason).catch(console.error);
    }
  }

  return res.status(200).json(updated);
}
