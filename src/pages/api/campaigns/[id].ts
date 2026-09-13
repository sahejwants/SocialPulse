import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import slugify from "slugify";
import { CAMPAIGN_CATEGORIES } from "@/types";

const updateSchema = z.object({
  title: z.string().min(10).max(100).optional(),
  category: z.enum(CAMPAIGN_CATEGORIES as unknown as [string, ...string[]]).optional(),
  description: z.string().min(50).max(5000).optional(),
  posterImage: z.string().min(1).optional(),
  additionalImages: z
    .array(z.object({ url: z.string().min(1), caption: z.string().optional() }))
    .max(8)
    .optional(),
  startDate: z.string().optional().or(z.literal("")).or(z.null()),
  endDate: z.string().optional().or(z.literal("")).or(z.null()),
  location: z.string().max(300).optional().or(z.literal("")).or(z.null()),
  mapUrl: z.string().optional().or(z.literal("")).or(z.null()),
  maxParticipants: z.coerce.number().int().min(1).optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const campaign = await db.campaign.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        images: { orderBy: { order: "asc" } },
      },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    return res.status(200).json(campaign);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const campaign = await db.campaign.findUnique({ where: { id, deletedAt: null } });
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  const isOwner = campaign.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  if (req.method === "PUT") {
    // Owners can only edit APPROVED campaigns; admins bypass this restriction
    if (isOwner && !isAdmin && campaign.status !== "APPROVED") {
      return res.status(403).json({ error: "Campaign cannot be edited while it is pending or rejected." });
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }

    const { title, category, description, posterImage, additionalImages, startDate, endDate, location, mapUrl, maxParticipants } = parsed.data;

    let slug = campaign.slug;
    if (title && title !== campaign.title) {
      const base = slugify(title, { lower: true, strict: true });
      const existing = await db.campaign.findFirst({
        where: { slug: base, NOT: { id }, deletedAt: null },
      });
      slug = existing ? `${base}-${Date.now()}` : base;
    }

    // Owner editing an approved campaign triggers re-approval
    const wasApproved = campaign.status === "APPROVED";
    const needsReapproval = isOwner && !isAdmin && wasApproved;

    const updated = await db.campaign.update({
      where: { id },
      data: {
        ...(title && { title, slug }),
        ...(category && { category }),
        ...(description && { description }),
        ...(posterImage && { posterImage }),
        ...(needsReapproval && { status: "PENDING", wasEdited: true }),
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        location: location !== undefined ? (location || null) : undefined,
        mapUrl: mapUrl !== undefined ? (mapUrl || null) : undefined,
        maxParticipants: maxParticipants !== undefined ? (maxParticipants ?? null) : undefined,
        ...(additionalImages !== undefined && {
          images: {
            deleteMany: {},
            create: additionalImages.map((img, i) => ({
              url: img.url,
              caption: img.caption ?? null,
              order: i,
            })),
          },
        }),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        images: { orderBy: { order: "asc" } },
      },
    });

    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await db.campaign.update({ where: { id }, data: { deletedAt: new Date() } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
