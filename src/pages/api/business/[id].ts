import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import slugify from "slugify";
import { BUSINESS_CATEGORIES, CONTACT_TYPES } from "@/types";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  category: z.enum(BUSINESS_CATEGORIES as unknown as [string, ...string[]]).optional(),
  description: z.string().min(30).max(2000).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  postalCode: z.string().min(4).optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  contacts: z
    .array(
      z.object({
        type: z.enum(CONTACT_TYPES as unknown as [string, ...string[]]),
        label: z.string().optional(),
        value: z.string().min(1),
      })
    )
    .max(10)
    .optional(),
  images: z
    .array(z.object({ url: z.string().min(1), caption: z.string().optional() }))
    .max(6)
    .optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const business = await db.business.findUnique({
      where: { id, deletedAt: null },
      include: {
        contacts: true,
        images: { orderBy: { order: "asc" } },
        user: { select: { id: true, name: true } },
      },
    });
    if (!business) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(business);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const business = await db.business.findUnique({ where: { id, deletedAt: null } });
  if (!business) return res.status(404).json({ error: "Not found" });

  const isOwner = business.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  if (req.method === "PUT") {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    }

    const { name, contacts, images, website, logoUrl, ...rest } = parsed.data;

    let slug = business.slug;
    if (name && name !== business.name) {
      const base = slugify(name, { lower: true, strict: true });
      const dup = await db.business.findFirst({ where: { slug: base, NOT: { id }, deletedAt: null } });
      slug = dup ? `${base}-${Date.now()}` : base;
    }

    const updated = await db.business.update({
      where: { id },
      data: {
        ...rest,
        ...(name && { name, slug }),
        website: website === "" ? null : (website ?? undefined),
        logoUrl: logoUrl === "" ? null : (logoUrl ?? undefined),
        ...(contacts !== undefined && {
          contacts: {
            deleteMany: {},
            create: contacts.map((c) => ({ type: c.type, label: c.label ?? null, value: c.value })),
          },
        }),
        ...(images !== undefined && {
          images: {
            deleteMany: {},
            create: images.map((img, i) => ({ url: img.url, caption: img.caption ?? null, order: i })),
          },
        }),
      },
      include: {
        contacts: true,
        images: { orderBy: { order: "asc" } },
        user: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await db.business.update({ where: { id }, data: { deletedAt: new Date() } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
