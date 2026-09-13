import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import type { BusinessWithRelations } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  MapPin, Globe, Phone, Mail,
  ExternalLink, Pencil, ChevronLeft,
  ChevronRight, Share2, CheckCircle2, Clock,
} from "lucide-react";

type FullBusiness = BusinessWithRelations & {
  images: { id: string; url: string; caption: string | null; order: number }[];
};

interface BusinessDetailPageProps {
  business: FullBusiness;
}

const CONTACT_ICONS: Record<string, React.ElementType> = {
  phone: Phone,
  email: Mail,
  instagram: Globe,
  facebook: Globe,
  linkedin: Globe,
  twitter: Globe,
  youtube: Globe,
  other: ExternalLink,
};

const CONTACT_PREFIX: Record<string, string> = {
  phone: "tel:",
  email: "mailto:",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  linkedin: "https://linkedin.com/in/",
  twitter: "https://x.com/",
  youtube: "https://youtube.com/",
};

function contactHref(type: string, value: string) {
  if (type === "phone" || type === "email") return `${CONTACT_PREFIX[type]}${value}`;
  if (value.startsWith("http")) return value;
  return `${CONTACT_PREFIX[type] ?? ""}${value}`;
}

const BusinessDetailPage: NextPageWithLayout<BusinessDetailPageProps> = ({ business }) => {
  const { data: session } = useSession();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const isOwner = session?.user?.id === business.userId;
  const isAdmin = session?.user?.role === "ADMIN";
  const canManage = isOwner || isAdmin;

  const allImages = business.images ?? [];

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {/* noop */}
  };

  return (
    <>
      {/* Lightbox */}
      {lightboxIdx !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i! > 0 ? i! - 1 : allImages.length - 1)); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <div className="relative max-w-4xl w-full max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={allImages[lightboxIdx].url}
              alt={allImages[lightboxIdx].caption ?? "Business image"}
              width={1200} height={800}
              className="object-contain max-h-[80vh] w-full rounded-lg"
            />
            {allImages[lightboxIdx].caption && (
              <p className="mt-3 text-center text-sm text-white/60">{allImages[lightboxIdx].caption}</p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i! < allImages.length - 1 ? i! + 1 : 0)); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {/* Pending banner for owner */}
      {canManage && !business.isVerified && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-amber-700">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="font-medium">Pending verification</span>
            <span className="text-amber-600/80">— Your listing is being reviewed and will appear in the directory once verified.</span>
          </div>
        </div>
      )}

      {/* Hero band — logo + name */}
      <div className="bg-[#18181B] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center gap-6">
          {/* Logo / initials */}
          <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-[#27272A] flex items-center justify-center">
            {business.logoUrl ? (
              <Image src={business.logoUrl} alt={business.name} width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <span className="font-['Fraunces'] text-2xl font-bold text-white/20">
                {getInitials(business.name)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#E8572A] uppercase tracking-widest">{business.category}</span>
              {business.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                </span>
              )}
            </div>
            <h1 className="font-['Fraunces'] text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              {business.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-white/40">
              <MapPin className="h-3.5 w-3.5" />
              {business.city}, {business.state}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* About */}
            <div>
              <h2 className="font-['Fraunces'] text-xl font-bold text-[#18181B] mb-4">About</h2>
              <p className="text-sm text-[#3F3F46] leading-relaxed whitespace-pre-wrap">{business.description}</p>
            </div>

            {/* Gallery */}
            {allImages.length > 0 && (
              <div>
                <h2 className="font-['Fraunces'] text-xl font-bold text-[#18181B] mb-4">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setLightboxIdx(idx)}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-[#E4E4DC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8572A]"
                    >
                      <Image
                        src={img.url}
                        alt={img.caption ?? `Photo ${idx + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      {img.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white truncate">{img.caption}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-4">
            {/* Quick info */}
            <div className="rounded-2xl border border-[#E4E4DC] p-5 space-y-4 bg-white">
              <h3 className="font-['Fraunces'] text-base font-bold text-[#18181B]">Details</h3>

              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#E8572A] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#71717A]">{business.address}</span>
                    <br />
                    <span className="text-[#71717A]">{business.city} {business.state} {business.postalCode}</span>
                  </div>
                </div>

                {business.website && (
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-[#E8572A] shrink-0" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E8572A] hover:underline truncate"
                    >
                      {business.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2.5 text-[#A1A1AA]">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Listed {formatDate(business.createdAt)}</span>
                </div>
              </dl>

              {/* Contacts */}
              {business.contacts.length > 0 && (
                <div className="pt-3 border-t border-[#F4F4F0] space-y-2">
                  {business.contacts.map((c) => {
                    const Icon = CONTACT_ICONS[c.type] ?? ExternalLink;
                    return (
                      <a
                        key={c.id}
                        href={contactHref(c.type, c.value)}
                        target={c.type !== "phone" && c.type !== "email" ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-[#52525B] hover:text-[#E8572A] transition-colors"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[#E8572A]" />
                        <span className="truncate">{c.label ? `${c.label}: ${c.value}` : c.value}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Owner listed by */}
            {business.user?.name && (
              <div className="rounded-2xl border border-[#E4E4DC] p-5 bg-white">
                <p className="text-xs text-[#A1A1AA] mb-2 uppercase tracking-wider font-semibold">Listed by</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E8572A] flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{getInitials(business.user.name)}</span>
                  </div>
                  <span className="text-sm font-medium text-[#18181B]">{business.user.name}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                {copied ? "Link copied!" : "Share listing"}
              </Button>
              {canManage && (
                <Link href="/business/edit" className="block">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Pencil className="h-4 w-4" /> Edit listing
                  </Button>
                </Link>
              )}
              <Link href="/businesses">
                <Button variant="ghost" size="sm" className="w-full gap-1.5 text-[#71717A]">
                  <ChevronLeft className="h-4 w-4" /> All businesses
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

BusinessDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { slug } = ctx.params as { slug: string };

  const business = await db.business.findUnique({
    where: { slug, deletedAt: null },
    include: {
      contacts: true,
      images: { orderBy: { order: "asc" } },
      user: { select: { id: true, name: true } },
    },
  });

  if (!business) return { notFound: true };

  return { props: { business: JSON.parse(JSON.stringify(business)) } };
};

export default BusinessDetailPage;
