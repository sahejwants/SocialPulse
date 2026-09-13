import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { base64, mimeType, folder = "uploads" } = req.body as {
    base64: string;
    mimeType: string;
    folder?: string;
  };

  if (!base64 || !mimeType) return res.status(400).json({ error: "Missing base64 or mimeType" });
  if (!ALLOWED_TYPES.includes(mimeType)) return res.status(400).json({ error: "File type not allowed" });

  const safeFolder = folder.replace(/[^a-zA-Z0-9\-_/]/g, "").replace(/\/+/g, "/").replace(/^\/|\/$/g, "") || "uploads";

  try {
    const ext = mimeType.split("/")[1] ?? "jpg";
    const fileName = `${safeFolder}/${nanoid()}.${ext}`;
    const buffer = Buffer.from(base64, "base64");
    const blob = await put(fileName, buffer, {
      access: "public",
      contentType: mimeType,
    });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload error]", message);
    return res.status(500).json({ error: "Upload failed", detail: message });
  }
}
