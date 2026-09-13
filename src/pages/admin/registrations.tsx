import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { useState, useMemo } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Search, Users, Mail, Phone, MessageSquare, Calendar, ExternalLink, X } from "lucide-react";

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    slug: string;
    category: string;
  };
  user: { id: string; name: string | null } | null;
}

interface AdminRegistrationsProps {
  registrations: Registration[];
  total: number;
  campaignOptions: { id: string; title: string }[];
}

const AdminRegistrationsPage: NextPageWithLayout<AdminRegistrationsProps> = ({
  registrations,
  total,
  campaignOptions,
}) => {
  const [search, setSearch] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [selected, setSelected] = useState<Registration | null>(null);

  const filtered = useMemo(() => {
    let items = registrations;
    if (campaignFilter) items = items.filter((r) => r.campaign.id === campaignFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.campaign.title.toLowerCase().includes(q)
      );
    }
    return items;
  }, [registrations, search, campaignFilter]);

  return (
    <>
      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-['Fraunces'] text-lg font-bold text-[#18181B]">{selected.name}</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Joined {formatDate(selected.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:bg-[#F4F4F0] hover:text-[#18181B] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-[#52525B]">
                <Mail className="h-3.5 w-3.5 text-[#E8572A] shrink-0" />
                <a href={`mailto:${selected.email}`} className="hover:text-[#E8572A] transition-colors truncate">
                  {selected.email}
                </a>
              </div>
              {selected.phone && (
                <div className="flex items-center gap-2.5 text-[#52525B]">
                  <Phone className="h-3.5 w-3.5 text-[#E8572A] shrink-0" />
                  <span>{selected.phone}</span>
                </div>
              )}
              <div className="flex items-start gap-2.5 text-[#52525B]">
                <Calendar className="h-3.5 w-3.5 text-[#E8572A] shrink-0 mt-0.5" />
                <span>{formatDateTime(selected.createdAt)}</span>
              </div>
            </div>

            {selected.message && (
              <div className="rounded-xl bg-[#FAFAF7] border border-[#E4E4DC] p-3">
                <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Message
                </p>
                <p className="text-sm text-[#52525B] leading-relaxed">{selected.message}</p>
              </div>
            )}

            <div className="rounded-xl bg-[#F4F4F0] border border-[#E4E4DC] px-4 py-3">
              <p className="text-xs text-[#A1A1AA] mb-0.5">Campaign</p>
              <Link
                href={`/campaigns/${selected.campaign.slug}`}
                target="_blank"
                className="text-sm font-semibold text-[#18181B] hover:text-[#E8572A] transition-colors flex items-center gap-1.5"
              >
                {selected.campaign.title}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </Link>
            </div>

            {selected.user && (
              <p className="text-xs text-[#A1A1AA]">
                Registered account: <span className="text-[#52525B] font-medium">{selected.user.name ?? "—"}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">Registrations</h1>
          <p className="text-sm text-[#71717A]">{total} total</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E4E4DC] bg-white text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent"
            />
          </div>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#E4E4DC] bg-white text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent"
          >
            <option value="">All campaigns</option>
            {campaignOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-8 w-8 text-[#D4D4C8] mb-3" />
              <p className="text-sm text-[#A1A1AA]">No registrations match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F4F4F0]">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Participant</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Campaign</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider hidden sm:table-cell">Category</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider hidden md:table-cell">Joined</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F0]">
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#18181B]">{r.name}</p>
                        <p className="text-xs text-[#71717A] mt-0.5">{r.email}</p>
                      </td>
                      <td className="px-5 py-4 max-w-[220px]">
                        <p className="text-[#18181B] truncate font-medium">{r.campaign.title}</p>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F4F0] text-[#52525B]">
                          {r.campaign.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-[#71717A] whitespace-nowrap">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs text-[#E8572A] font-semibold">View →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-[#A1A1AA] text-right">
            Showing {filtered.length} of {total} registration{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
};

AdminRegistrationsPage.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout title="Registrations">{page}</AdminLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { redirect: { destination: "/", permanent: false } };
  }

  const registrations = await db.campaignRegistration.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: { select: { id: true, title: true, slug: true, category: true } },
      user: { select: { id: true, name: true } },
    },
  });

  // Unique campaigns for the filter dropdown
  const seen = new Set<string>();
  const campaignOptions: { id: string; title: string }[] = [];
  for (const r of registrations) {
    if (!seen.has(r.campaign.id)) {
      seen.add(r.campaign.id);
      campaignOptions.push({ id: r.campaign.id, title: r.campaign.title });
    }
  }

  return {
    props: {
      registrations: JSON.parse(JSON.stringify(registrations)),
      total: registrations.length,
      campaignOptions,
    },
  };
};

export default AdminRegistrationsPage;
