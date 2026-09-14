import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CampaignStatus } from "@prisma/client";
import { z } from "zod";
import { sendCampaignApprovedEmail, sendCampaignRejectedEmail } from "@/lib/email";
import { emailEnabled } from "@/lib/flags";

const schema = z.object({
  status: z.enum([CampaignStatus.APPROVED, CampaignStatus.REJECTED]),
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

  if (status === CampaignStatus.REJECTED && !rejectionReason) {
    return res.status(400).json({ error: "A reason is required when rejecting a campaign." });
  }

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  const updated = await db.campaign.update({
    where: { id },
    data: { status, rejectionReason: rejectionReason ?? null },
  });

  if (emailEnabled) {
    const userEmail = campaign.user.email;
    const userName = campaign.user.name ?? "there";
    if (userEmail) {
      if (status === CampaignStatus.APPROVED) {
        sendCampaignApprovedEmail(userEmail, userName, campaign.title, campaign.slug).catch(console.error);
      } else {
        sendCampaignRejectedEmail(userEmail, userName, campaign.title, rejectionReason!).catch(console.error);
      }
    }
  }

  return res.status(200).json(updated);
}
