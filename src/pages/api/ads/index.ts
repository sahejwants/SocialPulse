import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdStatus } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(80),
  description: z.string().max(160).optional().or(z.literal("")),
  imageUrl: z.string().min(1, "Ad image is required"),
  linkUrl: z.string().url("Enter a valid URL (include https://)").optional().or(z.literal("")).or(z.null()),
  startsAt: z.string().optional().or(z.literal("")).transform((v) => v || null),
  endsAt: z.string().optional().or(z.literal("")).transform((v) => v || null),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — return random approved ad(s) for display (respects scheduling window)
  if (req.method === "GET") {
    const count = Math.max(1, Math.min(5, Number(req.query.count) || 1));
    const now = new Date();
    const ads = await db.ad.findMany({
      where: {
        status: AdStatus.APPROVED,
        deletedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: { business: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Shuffle and return `count` ads
    const shuffled = ads.sort(() => Math.random() - 0.5).slice(0, count);
    return res.status(200).json(shuffled);
  }

  // POST — business owner submits a new ad
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const business = await db.business.findUnique({ where: { userId: session.user.id, deletedAt: null } });
    if (!business) {
      return res.status(403).json({ error: "You must have a verified business listing to submit an ad." });
    }
    if (!business.isVerified) {
      return res.status(403).json({ error: "Your business listing must be verified before you can submit ads." });
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }

    const { title, description, imageUrl, linkUrl, startsAt, endsAt } = parsed.data;

    const ad = await db.ad.create({
      data: {
        title,
        description: description || null,
        imageUrl,
        linkUrl: linkUrl || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        businessId: business.id,
      },
    });

    return res.status(201).json(ad);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
