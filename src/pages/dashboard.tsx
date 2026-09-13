import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "./_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";
import { CampaignStatus } from "@prisma/client";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  Megaphone, Building2, Users, ChevronRight, Plus,
  Clock, CheckCircle2, XCircle, Settings, ArrowUpCircle,
} from "lucide-react";

interface OwnCampaign {
  id: string; title: string; slug: string; posterImage: string;
  status: CampaignStatus; createdAt: string; category: string;
  _count: { registrations: number };
}

interface JoinedCampaign {
  id: string;
  campaign: {
    id: string; title: string; slug: string; posterImage: string;
    category: string; startDate: string | null;
    user: { name: string | null };
  };
  createdAt: string;
}

interface BusinessSnap {
  id: string; name: string; slug: string; isVerified: boolean;
  logoUrl: string | null; _count: { ads: number };
}

interface DashboardProps {
  user: { id: string; name: string | null; email: string; role: string };
  ownCampaigns: OwnCampaign[];
  joinedCampaigns: JoinedCampaign[];
  business: BusinessSnap | null;
}

const STATUS_CFG = {
  [CampaignStatus.APPROVED]: { label: "Live",    icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
  [CampaignStatus.PENDING]:  { label: "Pending", icon: Clock,        cls: "bg-amber-50  text-amber-700"   },
  [CampaignStatus.REJECTED]: { label: "Rejected",icon: XCircle,      cls: "bg-red-50    text-red-700"     },
};

const DashboardPage: NextPageWithLayout<DashboardProps> = ({ user, ownCampaigns, joinedCampaigns, business }) => {
  const isBusinessOwner = user.role === "BUSINESS_OWNER";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#E8572A] mb-1">My account</p>
          <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-[#71717A] mt-1">{user.email}</p>
        </div>
        <Link
          href="/account"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#71717A] hover:text-[#18181B] border border-[#E4E4DC] rounded-xl px-3 py-2 bg-white transition-colors"
        >
          <Settings className="h-3.5 w-3.5" /> Account settings
        </Link>
      </div>

      {/* Upgrade prompt — shown to plain USER accounts */}
      {user.role === "USER" && (
        <Link
          href="/account/upgrade"
          className="flex items-center gap-4 bg-[#F0FAF5] border border-[#2D6A4F]/20 rounded-2xl px-5 py-4 hover:border-[#2D6A4F]/50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="h-5 w-5 text-[#2D6A4F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2D6A4F]">Upgrade to Business Owner</p>
            <p className="text-xs text-[#52525B] mt-0.5">Create a business listing, run ads, and lead branded campaigns.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#2D6A4F] shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Quick stats */}
      <div className={cn("grid gap-4", isBusinessOwner ? "grid-cols-3" : "grid-cols-2")}>
        <StatCard
          icon={Megaphone}
          label="Campaigns created"
          value={ownCampaigns.length}
          href="/campaigns/create"
          cta="Create new"
        />
        <StatCard
          icon={Users}
          label="Campaigns joined"
          value={joinedCampaigns.length}
          href="/campaigns"
          cta="Browse campaigns"
        />
        {isBusinessOwner && (
          <StatCard
            icon={Building2}
            label="Business ads"
            value={business?._count.ads ?? 0}
            href="/business/ads"
            cta="Manage ads"
          />
        )}
      </div>

      {/* Business status (business owners only) */}
      {isBusinessOwner && business && (
        <section>
          <SectionHeader title="My Business" href={`/businesses/${business.slug}`} cta="View listing" />
          <Link
            href={`/businesses/${business.slug}`}
            className="flex items-center gap-4 bg-white border border-[#E4E4DC] rounded-2xl px-5 py-4 hover:border-[#E8572A] transition-colors"
          >
            <div className="w-12 h-12 rounded-xl border border-[#E4E4DC] overflow-hidden bg-[#F4F4F0] flex items-center justify-center shrink-0">
              {business.logoUrl
                ? <Image src={business.logoUrl} alt={business.name} width={48} height={48} className="object-cover w-full h-full" />
                : <span className="text-xs font-bold text-[#A1A1AA]">{getInitials(business.name)}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#18181B]">{business.name}</p>
              {business.isVerified
                ? <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle2 className="h-3 w-3" /> Verified — visible to the public</p>
                : <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> Awaiting admin verification</p>
              }
            </div>
            <ChevronRight className="h-4 w-4 text-[#A1A1AA] shrink-0" />
          </Link>
        </section>
      )}

      {/* My campaigns */}
      <section>
        <SectionHeader title="My campaigns" href="/campaigns/create" cta="+ New campaign" />
        {ownCampaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            text="You haven't created any campaigns yet."
            cta="Start your first campaign"
            href="/campaigns/create"
          />
        ) : (
          <div className="bg-white border border-[#E4E4DC] rounded-2xl overflow-hidden divide-y divide-[#F4F4F0]">
            {ownCampaigns.map((c) => {
              const cfg = STATUS_CFG[c.status];
              const Icon = cfg.icon;
              return (
                <Link
                  key={c.id}
                  href={`/campaigns/${c.slug}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAF7] transition-colors"
                >
                  <div className="relative w-16 h-11 rounded-lg overflow-hidden bg-[#F4F4F0] shrink-0">
                    <Image src={c.posterImage} alt={c.title} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] truncate">{c.title}</p>
                    <p className="text-xs text-[#A1A1AA]">
                      {c.category} · {formatDate(c.createdAt)}
                      {c._count.registrations > 0 && ` · ${c._count.registrations} joined`}
                    </p>
                  </div>
                  <span className={cn("shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", cfg.cls)}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Campaigns joined */}
      <section>
        <SectionHeader title="Campaigns I've joined" href="/campaigns" cta="Find more" />
        {joinedCampaigns.length === 0 ? (
          <EmptyState
            icon={Users}
            text="You haven't joined any campaigns yet."
            cta="Explore campaigns"
            href="/campaigns"
          />
        ) : (
          <div className="bg-white border border-[#E4E4DC] rounded-2xl overflow-hidden divide-y divide-[#F4F4F0]">
            {joinedCampaigns.map(({ id, campaign: c, createdAt }) => (
              <Link
                key={id}
                href={`/campaigns/${c.slug}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAF7] transition-colors"
              >
                <div className="relative w-16 h-11 rounded-lg overflow-hidden bg-[#F4F4F0] shrink-0">
                  <Image src={c.posterImage} alt={c.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#18181B] truncate">{c.title}</p>
                  <p className="text-xs text-[#A1A1AA]">
                    by {c.user.name ?? "Anonymous"} · Joined {formatDate(createdAt)}
                    {c.startDate && ` · Event ${formatDateTime(c.startDate)}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#A1A1AA] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

function StatCard({ icon: Icon, label, value, href, cta }: { icon: React.ElementType; label: string; value: number; href: string; cta: string }) {
  return (
    <div className="bg-white border border-[#E4E4DC] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-[#FFF5F2] flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#E8572A]" />
        </div>
      </div>
      <p className="font-['Fraunces'] text-3xl font-bold text-[#18181B]">{value}</p>
      <p className="text-xs text-[#71717A] mt-0.5 mb-3">{label}</p>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#E8572A] hover:underline">
        {cta} <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-['Fraunces'] text-lg font-bold text-[#18181B]">{title}</h2>
      <Link href={href} className="text-xs font-semibold text-[#E8572A] hover:underline">{cta}</Link>
    </div>
  );
}

function EmptyState({ icon: Icon, text, cta, href }: { icon: React.ElementType; text: string; cta: string; href: string }) {
  return (
    <div className="bg-white border border-[#E4E4DC] rounded-2xl px-6 py-12 text-center">
      <Icon className="h-8 w-8 text-[#D4D4C8] mx-auto mb-3" />
      <p className="text-sm text-[#A1A1AA] mb-4">{text}</p>
      <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8572A] hover:underline">
        <Plus className="h-4 w-4" /> {cta}
      </Link>
    </div>
  );
}

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout title="Dashboard">{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/auth/login?callbackUrl=/dashboard", permanent: false } };

  const userId = session.user.id;

  const [ownCampaigns, joinedCampaigns, business] = await Promise.all([
    db.campaign.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, slug: true, posterImage: true,
        status: true, createdAt: true, category: true,
        _count: { select: { registrations: true } },
      },
    }),
    db.campaignRegistration.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        campaign: {
          select: {
            id: true, title: true, slug: true, posterImage: true,
            category: true, startDate: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    session.user.role === "BUSINESS_OWNER"
      ? db.business.findUnique({
          where: { userId, deletedAt: null },
          select: { id: true, name: true, slug: true, isVerified: true, logoUrl: true, _count: { select: { ads: true } } },
        })
      : null,
  ]);

  return {
    props: {
      user: { id: session.user.id, name: session.user.name ?? null, email: session.user.email, role: session.user.role },
      ownCampaigns: JSON.parse(JSON.stringify(ownCampaigns)),
      joinedCampaigns: JSON.parse(JSON.stringify(joinedCampaigns)),
      business: business ? JSON.parse(JSON.stringify(business)) : null,
    },
  };
};

export default DashboardPage;
