import { useState, useMemo, type ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, Users, Mail, Phone, MessageSquare, Download, Search } from "lucide-react";

interface Registration {
  id: string; name: string; email: string; phone: string | null; message: string | null; createdAt: string;
}

interface RegistrationsPageProps {
  campaign: { id: string; title: string; slug: string };
  registrations: Registration[];
}

const RegistrationsPage: NextPageWithLayout<RegistrationsPageProps> = ({ campaign, registrations }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }, [registrations, search]);

  const downloadCsv = () => {
    const rows = [
      ["Name", "Email", "Phone", "Message", "Joined"],
      ...registrations.map((r) => [r.name, r.email, r.phone ?? "", r.message ?? "", formatDate(r.createdAt)]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.slug}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <Link href={`/campaigns/${campaign.slug}`} className="inline-flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#E8572A] mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to campaign
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-['Fraunces'] text-2xl font-bold text-[#18181B] tracking-tight">{campaign.title}</h1>
            <p className="text-sm text-[#71717A] mt-1 flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {search.trim()
                ? `${filtered.length} of ${registrations.length} participant${registrations.length !== 1 ? "s" : ""}`
                : `${registrations.length} participant${registrations.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {registrations.length > 0 && (
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E4E4DC] text-sm font-semibold text-[#52525B] hover:border-[#18181B] hover:text-[#18181B] transition-colors bg-white"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {registrations.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E4E4DC] bg-white pl-10 pr-4 py-2.5 text-sm text-[#18181B] placeholder-[#A1A1AA] outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent transition"
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden">
        {registrations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="h-10 w-10 text-[#D4D4C8] mx-auto mb-3" />
            <p className="text-sm text-[#A1A1AA]">No one has joined yet. Share your campaign to get participants.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Search className="h-10 w-10 text-[#D4D4C8] mx-auto mb-3" />
            <p className="text-sm text-[#A1A1AA]">No participants match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F0]">
            {filtered.map((r, i) => (
              <div key={r.id} className="px-6 py-4">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-[#E8572A] flex items-center justify-center shrink-0 text-white text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-[#18181B]">{r.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#71717A]">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                      {r.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                    </div>
                    {r.message && (
                      <p className="flex items-start gap-1 text-xs text-[#52525B] mt-1">
                        <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                        <span className="italic">"{r.message}"</span>
                      </p>
                    )}
                    <p className="text-[11px] text-[#A1A1AA]">Joined {formatDate(r.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

RegistrationsPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: `/auth/login?callbackUrl=/campaigns/${ctx.params?.slug}/registrations`, permanent: false } };

  const campaign = await db.campaign.findUnique({
    where: { slug: ctx.params?.slug as string, deletedAt: null },
    select: { id: true, title: true, slug: true, userId: true },
  });

  if (!campaign) return { notFound: true };

  const isOwner = campaign.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return { notFound: true };

  const registrations = await db.campaignRegistration.findMany({
    where: { campaignId: campaign.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return {
    props: {
      campaign: { id: campaign.id, title: campaign.title, slug: campaign.slug },
      registrations: JSON.parse(JSON.stringify(registrations)),
    },
  };
};

export default RegistrationsPage;
