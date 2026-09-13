import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { useState } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Building2, CheckCircle2, Mail, Megaphone, Star, TrendingUp } from "lucide-react";
import { useRouter } from "next/router";

interface UpgradePageProps {
  userName: string;
  userEmail: string;
}

const BENEFITS = [
  { icon: Building2, title: "Business listing", desc: "Create a public profile for your organisation with contact details, images, and location." },
  { icon: Megaphone, title: "Sponsored ads", desc: "Promote your services to the community through targeted ad placements across the platform." },
  { icon: TrendingUp, title: "Campaign creation", desc: "Run social awareness campaigns under your business banner to grow engagement." },
  { icon: Star, title: "Verified badge", desc: "Earn a verified badge after admin review, increasing trust with the community." },
];

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "The upgrade link was missing a token. Please request a new one.",
  invalid_token: "This upgrade link is invalid. Please request a new one.",
  expired_token: "This upgrade link has expired. Please request a new one.",
  already_upgraded: "Your account has already been upgraded to Business Owner.",
};

const UpgradePage: NextPageWithLayout<UpgradePageProps> = ({ userName, userEmail }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const errorParam = router.query.error as string | undefined;
  const queryError = errorParam ? ERROR_MESSAGES[errorParam] ?? "Something went wrong." : null;

  const requestUpgrade = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/account/upgrade", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? "Something went wrong."); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#2D6A4F] mb-2">Account upgrade</p>
        <h1 className="font-['Fraunces'] text-4xl font-bold text-[#18181B] tracking-tight leading-tight">
          Become a Business Owner
        </h1>
        <p className="mt-3 text-[#71717A] text-base leading-relaxed">
          Upgrade your account to unlock business tools — create a listing, run ads, and lead campaigns under your brand.
        </p>
      </div>

      {/* Error from URL */}
      {queryError && <Alert variant="error" message={queryError} />}

      {/* Benefits grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BENEFITS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white border border-[#E4E4DC] rounded-2xl p-5 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F0FAF5] flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-[#2D6A4F]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#18181B] mb-1">{title}</p>
              <p className="text-xs text-[#71717A] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA / Success state */}
      <div className="bg-white border border-[#E4E4DC] rounded-2xl p-8">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F0FAF5] flex items-center justify-center mx-auto">
              <Mail className="h-7 w-7 text-[#2D6A4F]" />
            </div>
            <h2 className="font-['Fraunces'] text-xl font-bold text-[#18181B]">Check your inbox</h2>
            <p className="text-sm text-[#71717A] leading-relaxed max-w-sm mx-auto">
              We've sent a confirmation link to <strong className="text-[#18181B]">{userEmail}</strong>. Click it to complete your upgrade. The link expires in 24 hours.
            </p>
            <button
              onClick={requestUpgrade}
              disabled={loading}
              className="text-sm text-[#E8572A] hover:underline disabled:opacity-50"
            >
              Didn't receive it? Send again
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="font-['Fraunces'] text-xl font-bold text-[#18181B] mb-1">Request your upgrade</h2>
              <p className="text-sm text-[#71717A]">
                We'll send a confirmation link to <strong className="text-[#18181B]">{userEmail}</strong>. Click it to activate your Business Owner account.
              </p>
            </div>

            {apiError && <Alert variant="error" message={apiError} />}

            <div className="flex items-start gap-3 bg-[#FAFAF7] border border-[#E4E4DC] rounded-xl p-4">
              <CheckCircle2 className="h-4 w-4 text-[#2D6A4F] mt-0.5 shrink-0" />
              <p className="text-xs text-[#52525B] leading-relaxed">
                Your account will be upgraded immediately after you confirm via email. You'll then need to sign in again for the change to take effect.
              </p>
            </div>

            <Button onClick={requestUpgrade} loading={loading} className="w-full" size="lg">
              Send upgrade confirmation email
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

UpgradePage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return { redirect: { destination: "/auth/login?callbackUrl=/account/upgrade", permanent: false } };
  }
  if (session.user.role !== "USER") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return {
    props: {
      userName: session.user.name ?? "",
      userEmail: session.user.email ?? "",
    },
  };
};

export default UpgradePage;
