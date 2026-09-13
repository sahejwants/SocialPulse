import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { AdStatus } from "@prisma/client";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Clock, CheckCircle2, XCircle, Megaphone, Lock, CalendarClock, Ban } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  status: AdStatus;
  rejectionReason: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

function getEffectiveStatus(ad: Ad): { label: string; icon: React.ElementType; classes: string } {
  const now = new Date();
  if (ad.status === AdStatus.PENDING) return { label: "Pending review", icon: Clock, classes: "bg-amber-50 text-amber-700 border-amber-200" };
  if (ad.status === AdStatus.REJECTED) return { label: "Rejected", icon: XCircle, classes: "bg-red-50 text-red-700 border-red-200" };
  // APPROVED — check schedule
  if (ad.startsAt && new Date(ad.startsAt) > now) return { label: "Scheduled", icon: CalendarClock, classes: "bg-sky-50 text-sky-700 border-sky-200" };
  if (ad.endsAt && new Date(ad.endsAt) < now) return { label: "Ended", icon: Ban, classes: "bg-zinc-100 text-zinc-500 border-zinc-200" };
  return { label: "Live", icon: CheckCircle2, classes: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

interface AdsPageProps {
  ads: Ad[];
  businessName: string;
}


const BusinessAdsPage: NextPageWithLayout<AdsPageProps> = ({ ads, businessName }) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isLocked = router.query.locked === "1";

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    setDeletingId(id);
    await fetch(`/api/ads/${id}`, { method: "DELETE" });
    router.replace(router.asPath);
    setDeletingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {isLocked && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex gap-4">
          <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Business not yet verified</p>
            <p className="text-sm text-amber-700 mt-1">Your business listing is awaiting admin verification. You can submit ads once it is approved.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF5F2] border border-[#FDDDD4] flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-[#E8572A]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A]">Your ads</p>
          </div>
          <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">
            Ad manager
          </h1>
          <p className="mt-1 text-sm text-[#71717A]">{businessName}</p>
        </div>
        <Link href="/business/ads/create">
          <Button size="md" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> New ad
          </Button>
        </Link>
      </div>

      {/* Ad list */}
      {ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#E4E4DC] rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F4F0] flex items-center justify-center mb-4">
            <Megaphone className="h-6 w-6 text-[#A1A1AA]" />
          </div>
          <h3 className="font-['Fraunces'] text-xl font-bold text-[#18181B] mb-2">No ads yet</h3>
          <p className="text-sm text-[#71717A] max-w-xs mb-6">
            Create your first sponsored ad to reach people browsing campaigns on SocialPulse.
          </p>
          <Link href="/business/ads/create">
            <Button size="md" className="gap-2"><Plus className="h-4 w-4" /> Create ad</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => {
            const cfg = getEffectiveStatus(ad);
            const StatusIcon = cfg.icon;
            return (
              <div key={ad.id} className="flex items-start gap-4 bg-white rounded-2xl border border-[#E4E4DC] p-5">
                {/* Thumbnail */}
                <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-[#F4F4F0] shrink-0">
                  <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" sizes="80px" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border", cfg.classes)}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="font-['Fraunces'] font-bold text-[#18181B] leading-snug truncate">{ad.title}</p>
                  {ad.description && (
                    <p className="text-xs text-[#71717A] mt-0.5 line-clamp-1">{ad.description}</p>
                  )}
                  {ad.status === AdStatus.REJECTED && ad.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {ad.rejectionReason}</p>
                  )}
                  {(ad.startsAt || ad.endsAt) && (
                    <p className="text-xs text-[#71717A] mt-1 flex items-center gap-1">
                      <CalendarClock className="h-3 w-3 shrink-0" />
                      {ad.startsAt ? formatDateTime(ad.startsAt) : "—"}
                      {" → "}
                      {ad.endsAt ? formatDateTime(ad.endsAt) : "ongoing"}
                    </p>
                  )}
                  <p className="text-xs text-[#A1A1AA] mt-1.5">Submitted {formatDate(ad.createdAt)}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(ad.id)}
                  disabled={deletingId === ad.id}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-xs text-[#A1A1AA] text-center leading-relaxed">
        Ads are reviewed by our team before going live. Approved ads are shown to visitors
        browsing campaigns across SocialPulse.
      </p>
    </div>
  );
};

BusinessAdsPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout title="Ad Manager">{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/auth/login?callbackUrl=/business/ads", permanent: false } };
  }

  const business = await db.business.findUnique({
    where: { userId: session.user.id, deletedAt: null },
    include: { ads: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } } },
  });

  if (!business) {
    return { redirect: { destination: "/business/create?from=ads", permanent: false } };
  }

  return {
    props: {
      ads: JSON.parse(JSON.stringify(business.ads)),
      businessName: business.name,
    },
  };
};

export default BusinessAdsPage;
