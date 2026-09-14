import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CampaignStatus } from "@prisma/client";
import { z } from "zod";
import slugify from "slugify";
import { CAMPAIGN_CATEGORIES } from "@/types";

const createSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100),
  category: z.enum(CAMPAIGN_CATEGORIES as unknown as [string, ...string[]]),
  description: z.string().min(50, "Description must be at least 50 characters").max(5000),
  posterImage: z.string().min(1, "Poster image is required"),
  additionalImages: z
    .array(z.object({ url: z.string().min(1), caption: z.string().optional() }))
    .max(8)
    .optional(),
  startDate: z.string().optional().or(z.literal("")).transform((v) => v || null),
  endDate: z.string().optional().or(z.literal("")).transform((v) => v || null),
  location: z.string().max(300).optional().or(z.literal("")).transform((v) => v || null),
  mapUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || null),
  maxParticipants: z.coerce.number().int().min(1).optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    // Business owners must have a verified business before posting campaigns
    if (session.user.role === "BUSINESS_OWNER") {
      const biz = await db.business.findUnique({ where: { userId: session.user.id, deletedAt: null }, select: { isVerified: true } });
      if (!biz?.isVerified) {
        return res.status(403).json({ error: "Your business listing must be verified before you can post campaigns." });
      }
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }

    const { title, category, description, posterImage, additionalImages, startDate, endDate, location, mapUrl, maxParticipants } = parsed.data;
    const base = slugify(title, { lower: true, strict: true });
    const existing = await db.campaign.findUnique({ where: { slug: base } });
    const slug = existing ? `${base}-${Date.now()}` : base;

    try {
      const campaign = await db.campaign.create({
        data: {
          title,
          slug,
          category,
          description,
          posterImage,
          userId: session.user.id,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          location: location ?? null,
          mapUrl: mapUrl ?? null,
          maxParticipants: maxParticipants ?? null,
          images: additionalImages?.length
            ? { create: additionalImages.map((img, i) => ({ url: img.url, caption: img.caption ?? null, order: i })) }
            : undefined,
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          images: { orderBy: { order: "asc" } },
        },
      });
      return res.status(201).json(campaign);
    } catch {
      return res.status(500).json({ error: "Failed to create campaign." });
    }
  }

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12));
  const search = (req.query.search as string)?.trim() || "";
  const category = (req.query.category as string)?.trim() || "";

  const where = {
    status: CampaignStatus.APPROVED,
    deletedAt: null,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category }),
  };

  try {
    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          images: { orderBy: { order: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.campaign.count({ where }),
    ]);

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

    return res.status(200).json({
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch campaigns." });
  }
}
