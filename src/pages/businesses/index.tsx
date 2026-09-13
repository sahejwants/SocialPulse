import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { MainLayout } from "@/components/layout/MainLayout";
import { BusinessCard } from "@/components/business/BusinessCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import type { BusinessWithRelations } from "@/types";
import { BUSINESS_CATEGORIES } from "@/types";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import { Building2, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const PAGE_SIZE = 12;

interface BusinessesPageProps {
  businesses: BusinessWithRelations[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  category: string;
}

const BusinessesPage: NextPageWithLayout<BusinessesPageProps> = ({
  businesses,
  total,
  page,
  totalPages,
  search,
  category,
}) => {
  const router = useRouter();

  const navigate = (cat: string) => {
    const query: Record<string, string> = {};
    if (router.query.search) query.search = router.query.search as string;
    if (cat) query.category = cat;
    router.push({ pathname: "/businesses", query });
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-[#E4E4DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A] mb-2">Directory</p>
              <h1 className="font-['Fraunces'] text-4xl lg:text-5xl font-bold text-[#18181B] tracking-tight">
                Local businesses
              </h1>
              <p className="mt-2 text-sm text-[#71717A]">
                {total === 0 ? "No businesses listed yet" : `${total} business${total !== 1 ? "es" : ""} in the community`}
              </p>
            </div>
            <Link href="/business/create">
              <Button size="md" className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> List your business
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            <SearchBar
              placeholder="Search businesses, services, locations…"
              basePath="/businesses"
              className="max-w-md"
            />

            {/* Category filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => navigate("")}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border",
                  !category
                    ? "bg-[#18181B] text-white border-[#18181B]"
                    : "bg-transparent text-[#52525B] border-[#E4E4DC] hover:border-[#18181B] hover:text-[#18181B]"
                )}
              >
                All
              </button>
              {BUSINESS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(cat)}
                  className={cn(
                    "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border",
                    category === cat
                      ? "bg-[#E8572A] text-white border-[#E8572A]"
                      : "bg-transparent text-[#52525B] border-[#E4E4DC] hover:border-[#E8572A] hover:text-[#E8572A]"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F4F0] flex items-center justify-center mb-5">
              <Building2 className="h-7 w-7 text-[#A1A1AA]" />
            </div>
            <h3 className="font-['Fraunces'] text-2xl font-bold text-[#18181B] mb-2">
              {search || category ? "No businesses found" : "No businesses yet"}
            </h3>
            <p className="text-sm text-[#71717A] max-w-sm mb-6">
              {search || category
                ? "Try a different search or browse all categories."
                : "Be the first to list your business in the community."}
            </p>
            {(search || category) ? (
              <Link href="/businesses"><Button variant="outline">Clear filters</Button></Link>
            ) : (
              <Link href="/business/create"><Button>List your business</Button></Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {page > 1 && (
                  <Link href={{ pathname: "/businesses", query: { ...(search && { search }), ...(category && { category }), page: page - 1 } }}>
                    <Button variant="outline" size="sm" className="gap-1"><ChevronLeft className="h-4 w-4" /> Previous</Button>
                  </Link>
                )}
                <span className="text-sm text-[#71717A] px-4">Page {page} of {totalPages}</span>
                {page < totalPages && (
                  <Link href={{ pathname: "/businesses", query: { ...(search && { search }), ...(category && { category }), page: page + 1 } }}>
                    <Button variant="outline" size="sm" className="gap-1">Next <ChevronRight className="h-4 w-4" /></Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

BusinessesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout title="Businesses" description="Discover local businesses on SocialPulse">
      {page}
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const page = Math.max(1, Number(query.page) || 1);
  const search = (query.search as string)?.trim() || "";
  const category = (query.category as string)?.trim() || "";

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

  const [businesses, total] = await Promise.all([
    db.business.findMany({
      where,
      include: {
        contacts: true,
        images: { orderBy: { order: "asc" }, take: 1 },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.business.count({ where }),
  ]);

  return {
    props: {
      businesses: JSON.parse(JSON.stringify(businesses)),
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
      search,
      category,
    },
  };
};

export default BusinessesPage;
