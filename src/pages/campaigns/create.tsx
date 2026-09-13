import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { Megaphone, Lock } from "lucide-react";
import Link from "next/link";

interface CreateCampaignPageProps { locked?: boolean; }

const CreateCampaignPage: NextPageWithLayout<CreateCampaignPageProps> = ({ locked }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5F2] border border-[#FDDDD4] flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-[#E8572A]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A]">New campaign</p>
        </div>
        <h1 className="font-['Fraunces'] text-4xl font-bold text-[#18181B] tracking-tight leading-tight">
          Start a campaign
        </h1>
        <p className="mt-3 text-sm text-[#71717A] leading-relaxed">
          Share your cause with the SocialPulse community. Fill in the details below — our team
          reviews every submission and responds within 24 hours.
        </p>
      </div>

      {locked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex gap-4">
          <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Business not yet verified</p>
            <p className="text-sm text-amber-700 mt-1">Your business listing is pending admin verification. You can create campaigns once it is approved.</p>
            <Link href="/business/edit" className="mt-3 inline-block text-xs font-semibold text-amber-800 underline">View your business listing →</Link>
          </div>
        </div>
      ) : (
        <CampaignForm mode="create" />
      )}
    </div>
  );
};

CreateCampaignPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout title="Start a Campaign" description="Create a new social awareness campaign on SocialPulse">
      {page}
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/auth/login?callbackUrl=/campaigns/create", permanent: false } };
  }

  if (session.user.role === "BUSINESS_OWNER") {
    const biz = await db.business.findUnique({ where: { userId: session.user.id, deletedAt: null }, select: { isVerified: true } });
    if (biz && !biz.isVerified) return { props: { locked: true } };
  }

  return { props: {} };
};

export default CreateCampaignPage;
