import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("role"), role: z.enum([Role.USER, Role.BUSINESS_OWNER, Role.ADMIN]) }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("restore") }),
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });

  const { id } = req.query as { id: string };
  if (id === session.user.id) return res.status(400).json({ error: "You cannot modify your own account." });

  const user = await db.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  if (parsed.data.action === "role") {
    const updated = await db.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, name: true, email: true, role: true },
    });
    return res.status(200).json(updated);
  }

  if (parsed.data.action === "archive") {
    await db.user.update({ where: { id }, data: { deletedAt: new Date() } });
    return res.status(200).json({ ok: true });
  }

  if (parsed.data.action === "restore") {
    await db.user.update({ where: { id }, data: { deletedAt: null } });
    return res.status(200).json({ ok: true });
  }
}
