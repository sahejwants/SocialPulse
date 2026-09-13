import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { useState } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { CampaignStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { CheckCircle2, XCircle, Clock, ExternalLink, PencilLine } from "lucide-react";

interface Campaign {
  id: string; title: string; slug: string; category: string; posterImage: string;
  status: CampaignStatus; rejectionReason: string | null; wasEdited: boolean; createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface AdminCampaignsProps { campaigns: Campaign[]; }

const STATUS_TABS = [
  { key: "PENDING",  label: "Pending",  icon: Clock },
  { key: "APPROVED", label: "Approved", icon: CheckCircle2 },
  { key: "REJECTED", label: "Rejected", icon: XCircle },
];

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING:  "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

function RejectModal({ onConfirm, onCancel }: { onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-['Fraunces'] text-xl font-bold text-[#18181B] mb-2">Reject campaign</h3>
        <p className="text-sm text-[#71717A] mb-4">Provide a reason — it will be emailed to the campaign owner.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. Campaign content doesn't meet our community guidelines…"
          className="w-full px-4 py-3 rounded-xl border border-[#E4E4DC] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent"
        />
        <div className="flex gap-3 mt-4">
          <Button size="sm" className="bg-red-600 hover:bg-red-700 flex-1" onClick={() => reason.length >= 5 && onConfirm(reason)} disabled={reason.length < 5}>
            Reject &amp; notify
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

const AdminCampaignsPage: NextPageWithLayout<AdminCampaignsProps> = ({ campaigns }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Campaign | null>(null);

  const filtered = campaigns.filter((c) => c.status === activeTab);

  const approve = async (id: string) => {
    setProcessing(id);
    await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    setProcessing(null);
    router.replace(router.asPath);
  };

  const reject = async (id: string, reason: string) => {
    setProcessing(id);
    await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }),
    });
    setRejectTarget(null);
    setProcessing(null);
    router.replace(router.asPath);
  };

  const counts = Object.fromEntries(STATUS_TABS.map((t) => [t.key, campaigns.filter((c) => c.status === t.key).length]));

  return (
    <>
      {rejectTarget && (
        <RejectModal
          onConfirm={(r) => reject(rejectTarget.id, r)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div className="max-w-5xl space-y-6">
        <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">Campaigns</h1>

        {/* Tabs */}
        <div className="flex gap-2">
          {STATUS_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border",
                activeTab === key
                  ? STATUS_STYLE[key]
                  : "bg-white text-[#71717A] border-[#E4E4DC] hover:border-[#18181B]"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-black/10 text-xs">{counts[key]}</span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-[#A1A1AA]">No {activeTab.toLowerCase()} campaigns.</p>
          ) : (
            <div className="divide-y divide-[#F4F4F0]">
              {filtered.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Poster thumb */}
                  <div className="relative w-16 h-11 rounded-lg overflow-hidden bg-[#F4F4F0] shrink-0">
                    <Image src={c.posterImage} alt={c.title} fill className="object-cover" sizes="64px" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#18181B] truncate">{c.title}</p>
                      {c.wasEdited && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <PencilLine className="h-3 w-3" /> Edited
                        </span>
                      )}
                      <Link href={`/campaigns/${c.slug}`} target="_blank" className="shrink-0 text-[#A1A1AA] hover:text-[#E8572A]">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <p className="text-xs text-[#A1A1AA]">
                      {c.user.name ?? c.user.email} · {c.category} · {formatDate(c.createdAt)}
                    </p>
                    {c.rejectionReason && (
                      <p className="text-xs text-red-500 mt-0.5">Reason: {c.rejectionReason}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {activeTab !== "APPROVED" && (
                      <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        loading={processing === c.id} onClick={() => approve(c.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {activeTab !== "REJECTED" && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        loading={processing === c.id} onClick={() => setRejectTarget(c)}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    )}
                    {activeTab === "REJECTED" && (
                      <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        loading={processing === c.id} onClick={() => approve(c.id)}>
                        Re-approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

AdminCampaignsPage.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout title="Campaigns">{page}</AdminLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session || session.user.role !== "ADMIN") return { redirect: { destination: "/", permanent: false } };

  const campaigns = await db.campaign.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return { props: { campaigns: JSON.parse(JSON.stringify(campaigns)) } };
};

export default AdminCampaignsPage;
