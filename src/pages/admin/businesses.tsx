import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { useState } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle2, Clock, ExternalLink, MapPin } from "lucide-react";

interface Business {
  id: string; name: string; slug: string; category: string; city: string; state: string;
  logoUrl: string | null; isVerified: boolean; createdAt: string;
  user: { name: string | null; email: string };
}

interface AdminBusinessesProps { businesses: Business[]; }

const AdminBusinessesPage: NextPageWithLayout<AdminBusinessesProps> = ({ businesses }) => {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unverified" | "verified">("unverified");
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = businesses.filter((b) =>
    filter === "all" ? true : filter === "verified" ? b.isVerified : !b.isVerified
  );

  const toggle = async (b: Business) => {
    setProcessing(b.id);
    await fetch(`/api/admin/businesses/${b.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: !b.isVerified }),
    });
    setProcessing(null);
    router.replace(router.asPath);
  };

  const counts = {
    all: businesses.length,
    unverified: businesses.filter((b) => !b.isVerified).length,
    verified: businesses.filter((b) => b.isVerified).length,
  };

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">Businesses</h1>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["unverified", "verified", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
              filter === f
                ? "bg-[#18181B] text-white border-[#18181B]"
                : "bg-white text-[#71717A] border-[#E4E4DC] hover:border-[#18181B]"
            )}
          >
            {f === "unverified" ? "Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/10 text-xs">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-[#A1A1AA]">No businesses in this category.</p>
        ) : (
          <div className="divide-y divide-[#F4F4F0]">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-6 py-4">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F4F4F0] shrink-0 flex items-center justify-center border border-[#E4E4DC]">
                  {b.logoUrl
                    ? <Image src={b.logoUrl} alt={b.name} width={48} height={48} className="object-cover w-full h-full" />
                    : <span className="text-xs font-bold text-[#A1A1AA]">{getInitials(b.name)}</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#18181B] truncate">{b.name}</p>
                    <Link href={`/businesses/${b.slug}`} target="_blank" className="shrink-0 text-[#A1A1AA] hover:text-[#E8572A]">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    {b.isVerified
                      ? <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                      : <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700"><Clock className="h-3 w-3" /> Pending</span>
                    }
                  </div>
                  <p className="text-xs text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {b.city}, {b.state} · {b.category} · {b.user.name ?? b.user.email} · {formatDate(b.createdAt)}
                  </p>
                </div>

                {/* Action */}
                <Button
                  size="sm"
                  variant={b.isVerified ? "outline" : "primary"}
                  className={b.isVerified ? "text-red-600 border-red-200 hover:bg-red-50" : "bg-emerald-600 hover:bg-emerald-700"}
                  loading={processing === b.id}
                  onClick={() => toggle(b)}
                >
                  {b.isVerified ? "Unverify" : "Verify"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

AdminBusinessesPage.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout title="Businesses">{page}</AdminLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session || session.user.role !== "ADMIN") return { redirect: { destination: "/", permanent: false } };

  const businesses = await db.business.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return { props: { businesses: JSON.parse(JSON.stringify(businesses)) } };
};

export default AdminBusinessesPage;
