import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CategoryFilter } from "@/components/campaigns/CategoryFilter";
import { EmptyState } from "@/components/campaigns/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { AdCard, type AdData } from "@/components/ads/AdCard";
import { db } from "@/lib/db";
import { CampaignStatus, AdStatus } from "@prisma/client";
import type { CampaignWithRelations } from "@/types";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Archive, ChevronDown } from "lucide-react";

const PAGE_SIZE = 12;

type CampaignWithCount = CampaignWithRelations & { _count: { registrations: number } };

interface CampaignsPageProps {
  campaigns: CampaignWithCount[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  category: string;
  ad: AdData | null;
  archiveCampaigns: CampaignWithCount[];
}

const CampaignsPage: NextPageWithLayout<CampaignsPageProps> = ({
  campaigns,
  total,
  page,
  totalPages,
  search,
  category,
  ad,
  archiveCampaigns,
}) => {
  const [showArchive, setShowArchive] = useState(false);
  const [featured, ...rest] = campaigns;
  const hasFilters = !!search || !!category;

  return (
    <>
      {/* Page header */}
      <div className="bg-white border-b border-[#E4E4DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A] mb-2">Discover</p>
              <h1 className="font-['Fraunces'] text-4xl lg:text-5xl font-bold text-[#18181B] tracking-tight">
                Active campaigns
              </h1>
              <p className="mt-2 text-sm text-[#71717A]">
                {total === 0
                  ? "No campaigns yet"
                  : `${total} campaign${total !== 1 ? "s" : ""} raising awareness`}
              </p>
            </div>
            <Link href="/campaigns/create">
              <Button size="md" className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Start a campaign
              </Button>
            </Link>
          </div>

          {/* Search + Filters */}
          <div className="space-y-4">
            <SearchBar placeholder="Search campaigns, causes, keywords…" className="max-w-md" />
            <CategoryFilter active={category} />
          </div>
        </div>
      </div>

      {/* Campaign grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {campaigns.length === 0 ? (
          <div className="grid grid-cols-1">
            <EmptyState search={search} category={category} />
          </div>
        ) : (
          <>
            {/* Featured card — first result, full width, only when no active filters */}
            {!hasFilters && featured && (
              <div className="mb-8">
                <CampaignCard campaign={featured} registrationCount={featured._count.registrations} featured />
              </div>
            )}

            {/* Grid — ad injected after 3rd card on page 1 with no active filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(hasFilters ? campaigns : rest).map((c, idx) => (
                <>
                  <CampaignCard key={c.id} campaign={c} registrationCount={c._count.registrations} />
                  {ad && !hasFilters && idx === 2 && page === 1 && (
                    <AdCard key="sponsored" ad={ad} variant="grid" />
                  )}
                </>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <PaginationLink
                  href={{ search, category, page: page - 1 }}
                  disabled={page <= 1}
                  label="Previous"
                  icon={<ChevronLeft className="h-4 w-4" />}
                  iconPosition="left"
                />

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <PaginationLink
                        key={p}
                        href={{ search, category, page: p }}
                        active={p === page}
                        label={String(p)}
                      />
                    );
                  })}
                </div>

                <PaginationLink
                  href={{ search, category, page: page + 1 }}
                  disabled={page >= totalPages}
                  label="Next"
                  icon={<ChevronRight className="h-4 w-4" />}
                  iconPosition="right"
                />
              </div>
            )}
          </>
        )}

        {/* Archive section */}
        {archiveCampaigns.length > 0 && (
          <div className="mt-16 border-t border-[#E4E4DC] pt-12">
            <button
              onClick={() => setShowArchive((v) => !v)}
              className="flex items-center gap-3 group mb-6"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F4F4F0] border border-[#E4E4DC] flex items-center justify-center">
                <Archive className="h-4 w-4 text-[#71717A]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[#52525B] group-hover:text-[#18181B] transition-colors">
                  Past campaigns
                  <span className="ml-2 text-xs font-normal text-[#A1A1AA]">({archiveCampaigns.length})</span>
                </p>
                <p className="text-xs text-[#A1A1AA]">Campaigns whose events have concluded</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-[#A1A1AA] ml-auto transition-transform ${showArchive ? "rotate-180" : ""}`} />
            </button>

            {showArchive && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                {archiveCampaigns.map((c) => (
                  <CampaignCard key={c.id} campaign={c} registrationCount={c._count.registrations} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

function PaginationLink({
  href,
  label,
  active = false,
  disabled = false,
  icon,
  iconPosition = "right",
}: {
  href: { search: string; category: string; page: number };
  label: string;
  active?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}) {
  const query: Record<string, string | number> = { page: href.page };
  if (href.search) query.search = href.search;
  if (href.category) query.category = href.category;

  if (disabled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#D4D4C8] cursor-not-allowed select-none">
        {iconPosition === "left" && icon}
        {label}
        {iconPosition === "right" && icon}
      </span>
    );
  }

  return (
    <Link
      href={{ pathname: "/campaigns", query }}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-[#E8572A] text-white"
          : "text-[#52525B] hover:bg-[#F4F4F0] hover:text-[#18181B]"
      }`}
    >
      {iconPosition === "left" && icon}
      {label}
      {iconPosition === "right" && icon}
    </Link>
  );
}

CampaignsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout title="Campaigns" description="Browse social awareness campaigns on SocialPulse">
      {page}
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const page = Math.max(1, Number(query.page) || 1);
  const search = (query.search as string)?.trim() || "";
  const category = (query.category as string)?.trim() || "";
  const now = new Date();

  // Search filter reused across both queries
  const searchAnd = search
    ? [{ OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ] }]
    : [];

  // Active: no endDate or endDate in the future
  const activeWhere = {
    status: CampaignStatus.APPROVED,
    deletedAt: null,
    ...(category && { category }),
    AND: [
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ...searchAnd,
    ],
  };

  // Archive: endDate has passed
  const archiveWhere = {
    status: CampaignStatus.APPROVED,
    deletedAt: null,
    endDate: { lt: now },
    ...(category && { category }),
    ...(searchAnd.length && { AND: searchAnd }),
  };

  const campaignInclude = {
    user: { select: { id: true, name: true, image: true } },
    images: { orderBy: { order: "asc" as const }, take: 1 },
    _count: { select: { registrations: true } },
  };

  const [campaigns, total, archiveCampaigns, approvedAds] = await Promise.all([
    db.campaign.findMany({
      where: activeWhere,
      include: campaignInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.campaign.count({ where: activeWhere }),
    db.campaign.findMany({
      where: archiveWhere,
      include: campaignInclude,
      orderBy: { endDate: "desc" },
      take: 12,
    }),
    db.ad.findMany({
      where: {
        status: AdStatus.APPROVED,
        deletedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: { business: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    }),
  ]);

  // Pick a random approved ad
  const ad = approvedAds.length
    ? approvedAds[Math.floor(Math.random() * approvedAds.length)]
    : null;

  return {
    props: {
      campaigns: JSON.parse(JSON.stringify(campaigns)),
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
      search,
      category,
      ad: ad ? JSON.parse(JSON.stringify(ad)) : null,
      archiveCampaigns: JSON.parse(JSON.stringify(archiveCampaigns)),
    },
  };
};

export default CampaignsPage;
