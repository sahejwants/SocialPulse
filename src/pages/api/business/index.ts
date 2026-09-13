import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import slugify from "slugify";
import { BUSINESS_CATEGORIES, CONTACT_TYPES } from "@/types";

const contactSchema = z.object({
  type: z.enum(CONTACT_TYPES as unknown as [string, ...string[]]),
  label: z.string().optional(),
  value: z.string().min(1),
});

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  category: z.enum(BUSINESS_CATEGORIES as unknown as [string, ...string[]]),
  description: z.string().min(30, "Description must be at least 30 characters").max(2000),
  address: z.string().min(5, "Please enter your street address"),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")).or(z.null()),
  logoUrl: z.string().optional().or(z.literal("")),
  contacts: z.array(contactSchema).max(10).optional(),
  images: z
    .array(z.object({ url: z.string().min(1), caption: z.string().optional() }))
    .max(6)
    .optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });
    if (session.user.role !== "BUSINESS_OWNER" && session.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only business owners can create a listing." });
    }

    const existing = await db.business.findUnique({ where: { userId: session.user.id, deletedAt: null } });
    if (existing) return res.status(409).json({ error: "You already have a business listing." });

    console.log("Body received:", req.body);

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }

    const { name, category, description, address, city, state, postalCode, country,
            website, logoUrl, contacts, images } = parsed.data;

    const base = slugify(name, { lower: true, strict: true });
    const dup = await db.business.findUnique({ where: { slug: base } });
    const slug = dup ? `${base}-${Date.now()}` : base;

    try {
      const business = await db.business.create({
        data: {
          name, slug, category, description, address, city, state, postalCode,
          country: country ?? "Australia",
          website: website || null,
          logoUrl: logoUrl || null,
          userId: session.user.id,
          contacts: contacts?.length
            ? { create: contacts.map((c) => ({ type: c.type, label: c.label ?? null, value: c.value })) }
            : undefined,
          images: images?.length
            ? { create: images.map((img, i) => ({ url: img.url, caption: img.caption ?? null, order: i })) }
            : undefined,
        },
        include: { contacts: true, images: { orderBy: { order: "asc" } } },
      });
      return res.status(201).json(business);
    } catch {
      return res.status(500).json({ error: "Failed to create business listing." });
    }
  }

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12));
  const search = (req.query.search as string)?.trim() || "";
  const category = (req.query.category as string)?.trim() || "";

  const where = {
    isVerified: true,
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { city: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category }),
  };

  try {
    const [businesses, total] = await Promise.all([
      db.business.findMany({
        where,
        include: {
          contacts: true,
          images: { orderBy: { order: "asc" }, take: 1 },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.business.count({ where }),
    ]);

    return res.status(200).json({
      businesses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch businesses." });
  }
}
