import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CampaignStatus, AdStatus } from "@prisma/client";
import type { CampaignWithRelations } from "@/types";
import { AdCard, type AdData } from "@/components/ads/AdCard";
import { formatDate, formatDateTime, getInitials, extractMapCoords } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Tag,
  Pencil,
  Trash2,
  Share2,
  ChevronLeft,
  ChevronRight,
  Clock,
  XCircle,
  CheckCircle2,
  Users,
  PencilLine,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface CampaignDetailPageProps {
  campaign: CampaignWithRelations & {
    images: { id: string; url: string; caption: string | null; order: number }[];
    wasEdited: boolean;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    mapUrl: string | null;
    maxParticipants: number | null;
  };
  ad: AdData | null;
  registrationCount: number;
  hasJoined: boolean;
}

const STATUS_CONFIG = {
  [CampaignStatus.APPROVED]: {
    label: "Approved",
    icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [CampaignStatus.PENDING]: {
    label: "Pending review",
    icon: Clock,
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [CampaignStatus.REJECTED]: {
    label: "Not approved",
    icon: XCircle,
    classes: "bg-red-50 text-red-700 border-red-200",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Environment: "bg-emerald-100 text-emerald-700",
  Education: "bg-sky-100 text-sky-700",
  Health: "bg-rose-100 text-rose-700",
  "Animal Welfare": "bg-amber-100 text-amber-700",
  "Human Rights": "bg-violet-100 text-violet-700",
  Community: "bg-blue-100 text-blue-700",
  "Arts & Culture": "bg-pink-100 text-pink-700",
  Poverty: "bg-orange-100 text-orange-700",
  "Disaster Relief": "bg-red-100 text-red-700",
  Other: "bg-gray-100 text-gray-700",
};

const CampaignDetailPage: NextPageWithLayout<CampaignDetailPageProps> = ({ campaign, ad, registrationCount, hasJoined }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(hasJoined);
  const [joinCount, setJoinCount] = useState(registrationCount);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  const isOwner = session?.user?.id === campaign.userId;
  const isAdmin = session?.user?.role === "ADMIN";
  const canManage = isOwner || isAdmin;
  const canEdit = isAdmin || (isOwner && campaign.status === CampaignStatus.APPROVED);
  const isApproved = campaign.status === CampaignStatus.APPROVED;
  const isFull = campaign.maxParticipants !== null && joinCount >= campaign.maxParticipants;
  const spotsLeft = campaign.maxParticipants !== null ? campaign.maxParticipants - joinCount : null;

  const statusCfg = STATUS_CONFIG[campaign.status];
  const StatusIcon = statusCfg.icon;

  const handleDelete = async () => {
    if (!confirm("Delete this campaign? This action cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
    router.push("/campaigns");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleQuickJoin = async () => {
    if (!session?.user) return;
    setJoining(true);
    setJoinError("");
    const res = await fetch(`/api/campaigns/${campaign.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) { setJoinError(data.error ?? "Failed to join"); }
    else { setJoinSuccess(true); setJoinCount((c) => c + 1); }
    setJoining(false);
  };

  const handleFormJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setJoinError("");
    const res = await fetch(`/api/campaigns/${campaign.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) { setJoinError(data.error ?? "Failed to join"); }
    else { setJoinSuccess(true); setJoinCount((c) => c + 1); setShowJoinForm(false); }
    setJoining(false);
  };

  const allImages = campaign.images ?? [];
  const lightboxImages = allImages.map((i) => i.url);

  return (
    <>
      {/* Lightbox */}
      {lightboxIdx !== null && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i! > 0 ? i! - 1 : lightboxImages.length - 1)); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <div className="relative max-w-4xl w-full max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightboxImages[lightboxIdx]}
              alt="Campaign image"
              width={1200}
              height={800}
              className="object-contain max-h-[80vh] w-full rounded-lg"
            />
            {allImages[lightboxIdx]?.caption && (
              <p className="mt-3 text-center text-sm text-white/60">{allImages[lightboxIdx].caption}</p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i! < lightboxImages.length - 1 ? i! + 1 : 0)); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {/* Status banner (only shown to campaign owner / admin for non-approved) */}
      {canManage && campaign.status !== CampaignStatus.APPROVED && (
        <div className={cn("border-b px-4 py-3", statusCfg.classes)}>
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm">
            <StatusIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium">{statusCfg.label}</span>
            {campaign.status === CampaignStatus.REJECTED && campaign.rejectionReason && (
              <span className="ml-1">— {campaign.rejectionReason}</span>
            )}
            {campaign.status === CampaignStatus.PENDING && (
              <span className="text-amber-600/80">Your campaign is being reviewed — usually within 24 hours.</span>
            )}
          </div>
        </div>
      )}

      {/* Hero poster */}
      <div className="relative w-full bg-[#18181B]" style={{ aspectRatio: "16/7", maxHeight: 500 }}>
        <Image
          src={campaign.posterImage}
          alt={campaign.title}
          fill
          priority
          className="object-cover opacity-90"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Category pill */}
        <div className="absolute top-5 left-5">
          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-white/20 backdrop-blur-sm bg-black/30 text-white")}>
            <Tag className="h-3 w-3" />
            {campaign.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Title + meta */}
            <div className="flex items-start gap-3 mb-5">
              <h1 className="font-['Fraunces'] text-3xl sm:text-4xl font-bold text-[#18181B] tracking-tight leading-tight flex-1">
                {campaign.title}
              </h1>
              {campaign.wasEdited && (
                <span className="shrink-0 mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  <PencilLine className="h-3 w-3" /> Updated
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#71717A] mb-8 pb-8 border-b border-[#E4E4DC]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#E8572A] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {campaign.user?.name ? getInitials(campaign.user.name) : "?"}
                  </span>
                </div>
                <span className="font-medium text-[#18181B]">{campaign.user?.name ?? "Anonymous"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(campaign.createdAt)}
              </div>
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", CATEGORY_COLORS[campaign.category] ?? CATEGORY_COLORS.Other)}>
                {campaign.category}
              </span>
              {joinCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#52525B]">
                  <Users className="h-3.5 w-3.5" /> {joinCount} joined
                </span>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-[#3F3F46] leading-relaxed whitespace-pre-wrap">
              {campaign.description}
            </div>

            {/* Event details — dates & location */}
            {(campaign.startDate || campaign.location || campaign.mapUrl) && (
              <div className="mt-8 rounded-2xl border border-[#E4E4DC] bg-white divide-y divide-[#F4F4F0] overflow-hidden">
                {campaign.startDate && (
                  <div className="flex items-start gap-3 px-5 py-4">
                    <Calendar className="h-4 w-4 text-[#E8572A] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-0.5">Date & time</p>
                      <p className="text-sm text-[#18181B] font-medium">{formatDateTime(campaign.startDate)}</p>
                      {campaign.endDate && (
                        <p className="text-xs text-[#71717A] mt-0.5">Until {formatDateTime(campaign.endDate)}</p>
                      )}
                    </div>
                  </div>
                )}
                {campaign.location && (
                  <div className="flex items-start gap-3 px-5 py-4">
                    <MapPin className="h-4 w-4 text-[#E8572A] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-0.5">Location</p>
                      <p className="text-sm text-[#18181B] font-medium">{campaign.location}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Map embed */}
            {campaign.mapUrl && (() => {
              const coords = extractMapCoords(campaign.mapUrl);
              return (
                <div className="mt-4 rounded-2xl overflow-hidden border border-[#E4E4DC]">
                  {coords ? (
                    <iframe
                      title="Campaign location"
                      width="100%"
                      height="280"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?mlat=${coords[0]}&mlon=${coords[1]}&zoom=15&layers=M`}
                      className="block"
                    />
                  ) : (
                    <div className="h-20 flex items-center justify-center bg-[#F4F4F0]">
                      <p className="text-xs text-[#A1A1AA]">Map preview unavailable — coordinates could not be read from the link.</p>
                    </div>
                  )}
                  <a
                    href={campaign.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-[#E8572A] hover:bg-[#FFF5F2] transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View on Google Maps
                  </a>
                </div>
              );
            })()}

            {/* Sponsored ad banner — shown below description on approved campaigns */}
            {ad && campaign.status === CampaignStatus.APPROVED && (
              <div className="mt-8">
                <AdCard ad={ad} variant="banner" />
              </div>
            )}

            {/* Join section — visible on approved campaigns to non-owners */}
            {isApproved && !isOwner && (
              <div className="mt-8 rounded-2xl border border-[#E4E4DC] p-6 bg-[#FAFAF7]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-['Fraunces'] text-lg font-bold text-[#18181B]">Join this campaign</h2>
                    <p className="text-sm text-[#71717A] mt-0.5">Show your support and get updates from the organiser.</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {joinCount > 0 && (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#52525B]">
                        <Users className="h-4 w-4 text-[#E8572A]" /> {joinCount} joined
                      </span>
                    )}
                    {spotsLeft !== null && (
                      isFull
                        ? <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Full</span>
                        : <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>
                    )}
                  </div>
                </div>

                {joinSuccess ? (
                  <div className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" /> You&apos;ve joined this campaign!
                  </div>
                ) : isFull ? (
                  <div className="mt-4 flex items-center gap-2 text-[#71717A] bg-[#F4F4F0] border border-[#E4E4DC] rounded-xl px-4 py-3 text-sm">
                    This campaign has reached its participant limit.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {joinError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{joinError}</p>
                    )}

                    {session ? (
                      <Button onClick={handleQuickJoin} loading={joining} className="gap-2">
                        <Users className="h-4 w-4" /> Join as {session.user?.name ?? session.user?.email}
                      </Button>
                    ) : showJoinForm ? (
                      <form onSubmit={handleFormJoin} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-[#52525B] mb-1 block">Full name *</label>
                            <input value={formData.name} onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))} required placeholder="Jane Smith"
                              className="w-full px-3 py-2 rounded-xl border border-[#E4E4DC] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#52525B] mb-1 block">Email *</label>
                            <input type="email" value={formData.email} onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))} required placeholder="jane@example.com"
                              className="w-full px-3 py-2 rounded-xl border border-[#E4E4DC] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent" />
                          </div>
                        </div>
                        <input value={formData.phone} onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))} placeholder="Phone (optional)"
                          className="w-full px-3 py-2 rounded-xl border border-[#E4E4DC] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent" />
                        <textarea value={formData.message} onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))} rows={2} placeholder="Message to the organiser (optional)"
                          className="w-full px-3 py-2 rounded-xl border border-[#E4E4DC] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent" />
                        <div className="flex gap-3">
                          <Button type="submit" loading={joining} className="gap-2"><Users className="h-4 w-4" /> Submit</Button>
                          <Button type="button" variant="outline" onClick={() => setShowJoinForm(false)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={() => setShowJoinForm(true)} className="gap-2">
                          <Users className="h-4 w-4" /> Join this campaign
                        </Button>
                        <Link href={`/auth/login?callbackUrl=/campaigns/${campaign.slug}`}>
                          <Button variant="outline">Sign in to join faster</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Photo gallery */}
            {allImages.length > 0 && (
              <div className="mt-12">
                <h2 className="font-['Fraunces'] text-xl font-bold text-[#18181B] mb-5">Photos</h2>
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
          <aside className="lg:w-64 shrink-0 space-y-4">
            {/* Action buttons */}
            <div className="rounded-2xl border border-[#E4E4DC] p-5 space-y-3 bg-white">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                {copied ? "Link copied!" : "Share campaign"}
              </Button>

              {canManage && (
                <>
                  {canEdit && (
                    <Link href={`/campaigns/edit/${campaign.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Pencil className="h-4 w-4" /> Edit campaign
                      </Button>
                    </Link>
                  )}
                  {canManage && (
                    <Link href={`/campaigns/${campaign.slug}/registrations`} className="block">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Users className="h-4 w-4" /> View participants
                        {joinCount > 0 && <span className="ml-auto text-[#E8572A] font-bold">{joinCount}</span>}
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={handleDelete}
                    loading={deleting}
                  >
                    <Trash2 className="h-4 w-4" /> Delete campaign
                  </Button>
                </>
              )}
            </div>

            {/* Status card (owner/admin only) */}
            {canManage && (
              <div className={cn("rounded-2xl border p-5", statusCfg.classes)}>
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{statusCfg.label}</span>
                </div>
                <p className="text-xs opacity-80">
                  {campaign.status === CampaignStatus.PENDING &&
                    "Your campaign is awaiting review."}
                  {campaign.status === CampaignStatus.APPROVED &&
                    "Your campaign is live and visible to everyone."}
                  {campaign.status === CampaignStatus.REJECTED &&
                    (campaign.rejectionReason ?? "Contact us if you have questions.")}
                </p>
              </div>
            )}

            {/* Back to campaigns */}
            <Link href="/campaigns">
              <Button variant="ghost" size="sm" className="w-full gap-1.5 text-[#71717A]">
                <ChevronLeft className="h-4 w-4" /> All campaigns
              </Button>
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
};

CampaignDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { slug } = ctx.params as { slug: string };
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  const [campaign, approvedAds] = await Promise.all([
    db.campaign.findUnique({
      where: { slug, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        images: { orderBy: { order: "asc" } },
      },
    }),
    db.ad.findMany({
      where: {
        status: AdStatus.APPROVED,
        deletedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
        ],
      },
      include: { business: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    }),
  ]);

  if (!campaign) return { notFound: true };

  // Non-approved campaigns are private — only the owner and admins may view them
  const isOwner = session?.user?.id === campaign.userId;
  const isAdmin = session?.user?.role === "ADMIN";
  if (campaign.status !== CampaignStatus.APPROVED && !isOwner && !isAdmin) {
    return { notFound: true };
  }

  const [registrationCount, existingReg] = await Promise.all([
    db.campaignRegistration.count({ where: { campaignId: campaign.id } }),
    session?.user?.email
      ? db.campaignRegistration.findUnique({ where: { campaignId_email: { campaignId: campaign.id, email: session.user.email }, deletedAt: null } })
      : Promise.resolve(null),
  ]);

  const ad = approvedAds.length
    ? approvedAds[Math.floor(Math.random() * approvedAds.length)]
    : null;

  return {
    props: {
      campaign: JSON.parse(JSON.stringify(campaign)),
      ad: ad ? JSON.parse(JSON.stringify(ad)) : null,
      registrationCount,
      hasJoined: !!existingReg,
    },
  };
};

export default CampaignDetailPage;
