import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CampaignStatus } from "@prisma/client";
import { z } from "zod";
import { sendCampaignJoinConfirmationEmail, sendCampaignJoinNotificationEmail } from "@/lib/email";
import { emailEnabled } from "@/lib/flags";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30).optional().or(z.literal("")),
  message: z.string().max(500).optional().or(z.literal("")),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query as { id: string };

  const campaign = await db.campaign.findUnique({
    where: { id, deletedAt: null },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  if (campaign.status !== CampaignStatus.APPROVED) {
    return res.status(403).json({ error: "This campaign is not currently accepting registrations." });
  }

  // Enforce participant cap if set
  if (campaign.maxParticipants !== null) {
    const currentCount = await db.campaignRegistration.count({ where: { campaignId: id } });
    if (currentCount >= campaign.maxParticipants) {
      return res.status(409).json({ error: "This campaign has reached its participant limit." });
    }
  }

  const session = await getServerSession(req, res, authOptions);

  // For logged-in users, use session data; still validate body overrides
  const bodyData = session?.user
    ? { name: session.user.name ?? req.body.name, email: session.user.email ?? req.body.email, phone: req.body.phone, message: req.body.message }
    : req.body;

  const parsed = schema.safeParse(bodyData);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
  }

  const { name, email, phone, message } = parsed.data;

  // Prevent duplicate registration
  const existing = await db.campaignRegistration.findUnique({
    where: { campaignId_email: { campaignId: id, email }, deletedAt: null },
  });
  if (existing) {
    return res.status(409).json({ error: "This email is already registered for this campaign." });
  }

  const registration = await db.campaignRegistration.create({
    data: {
      campaignId: id,
      userId: session?.user?.id ?? null,
      name,
      email,
      phone: phone || null,
      message: message || null,
    },
  });

  if (emailEnabled) {
    sendCampaignJoinConfirmationEmail(email, name, campaign).catch(console.error);
    if (campaign.user.email !== email) {
      sendCampaignJoinNotificationEmail(
        campaign.user.email, campaign.user.name ?? "", campaign.title, campaign.slug, name, email
      ).catch(console.error);
    }
  }

  return res.status(201).json(registration);
}
