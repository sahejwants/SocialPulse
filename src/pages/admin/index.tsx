import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CampaignStatus, AdStatus, Role } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Megaphone, Building2, Users, Tv2, Clock, CheckCircle2 } from "lucide-react";

interface Stats {
  campaigns: { total: number; pending: number; approved: number };
  businesses: { total: number; verified: number };
  users: { total: number; byRole: Record<string, number> };
  ads: { total: number; pending: number };
}

interface RecentCampaign {
  id: string; title: string; status: string; category: string; createdAt: string;
  user: { name: string | null };
}

interface AdminDashboardProps {
  stats: Stats;
  recentCampaigns: RecentCampaign[];
}

const statCards = (stats: Stats) => [
  {
    label: "Total campaigns",
    value: stats.campaigns.total,
    sub: `${stats.campaigns.pending} pending review`,
    icon: Megaphone,
    href: "/admin/campaigns",
    accent: stats.campaigns.pending > 0,
  },
  {
    label: "Businesses",
    value: stats.businesses.total,
    sub: `${stats.businesses.total - stats.businesses.verified} awaiting verification`,
    icon: Building2,
    href: "/admin/businesses",
    accent: stats.businesses.total - stats.businesses.verified > 0,
  },
  {
    label: "Users",
    value: stats.users.total,
    sub: `${stats.users.byRole[Role.BUSINESS_OWNER] ?? 0} business owners`,
    icon: Users,
    href: "/admin/users",
    accent: false,
  },
  {
    label: "Ads",
    value: stats.ads.total,
    sub: `${stats.ads.pending} pending review`,
    icon: Tv2,
    href: "/admin/ads",
    accent: stats.ads.pending > 0,
  },
];

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  PENDING:  "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-700",
};

const AdminDashboard: NextPageWithLayout<AdminDashboardProps> = ({ stats, recentCampaigns }) => {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-[#71717A]">Platform snapshot as of today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards(stats).map(({ label, value, sub, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className="group bg-white rounded-2xl border border-[#E4E4DC] p-5 hover:border-[#E8572A] hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${accent ? "bg-[#FFF5F2]" : "bg-[#F4F4F0] group-hover:bg-[#FFF5F2]"}`}>
                <Icon className={`h-4.5 w-4.5 ${accent ? "text-[#E8572A]" : "text-[#71717A] group-hover:text-[#E8572A]"}`} />
              </div>
              {accent && (
                <span className="w-2 h-2 rounded-full bg-[#E8572A] animate-pulse mt-1" />
              )}
            </div>
            <p className="font-['Fraunces'] text-3xl font-bold text-[#18181B]">{value}</p>
            <p className="text-xs font-medium text-[#71717A] mt-0.5">{label}</p>
            <p className="text-[11px] text-[#A1A1AA] mt-1">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Recent campaigns */}
      <div className="bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F4F4F0]">
          <h2 className="font-['Fraunces'] text-base font-bold text-[#18181B]">Recent campaigns</h2>
          <Link href="/admin/campaigns" className="text-xs font-semibold text-[#E8572A] hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-[#F4F4F0]">
          {recentCampaigns.length === 0 && (
            <p className="px-6 py-8 text-sm text-[#A1A1AA] text-center">No campaigns yet.</p>
          )}
          {recentCampaigns.map((c) => (
            <div key={c.id} className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#18181B] truncate">{c.title}</p>
                <p className="text-xs text-[#A1A1AA]">
                  {c.user.name ?? "Unknown"} · {c.category} · {formatDate(c.createdAt)}
                </p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[c.status] ?? ""}`}>
                {c.status === "PENDING" && <Clock className="h-3 w-3" />}
                {c.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
              </span>
              <Link href="/admin/campaigns" className="shrink-0 text-xs text-[#E8572A] hover:underline">
                Review →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

AdminDashboard.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout title="Dashboard">{page}</AdminLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { redirect: { destination: "/", permanent: false } };
  }

  const [
    campaignTotal, campaignPending, campaignApproved,
    bizTotal, bizVerified,
    userTotal, usersByRole,
    adTotal, adPending,
    recentCampaigns,
  ] = await Promise.all([
    db.campaign.count({ where: { deletedAt: null } }),
    db.campaign.count({ where: { status: CampaignStatus.PENDING, deletedAt: null } }),
    db.campaign.count({ where: { status: CampaignStatus.APPROVED, deletedAt: null } }),
    db.business.count({ where: { deletedAt: null } }),
    db.business.count({ where: { isVerified: true, deletedAt: null } }),
    db.user.count({ where: { deletedAt: null } }),
    db.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: { role: true } }),
    db.ad.count({ where: { deletedAt: null } }),
    db.ad.count({ where: { status: AdStatus.PENDING, deletedAt: null } }),
    db.campaign.findMany({
      where: { deletedAt: null },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const byRole: Record<string, number> = {};
  usersByRole.forEach((r) => { byRole[r.role] = r._count.role; });

  return {
    props: {
      stats: {
        campaigns: { total: campaignTotal, pending: campaignPending, approved: campaignApproved },
        businesses: { total: bizTotal, verified: bizVerified },
        users: { total: userTotal, byRole },
        ads: { total: adTotal, pending: adPending },
      },
      recentCampaigns: JSON.parse(JSON.stringify(recentCampaigns)),
    },
  };
};

export default AdminDashboard;
