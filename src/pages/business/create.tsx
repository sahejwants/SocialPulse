import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";
import { BusinessForm } from "@/components/business/BusinessForm";
import { Alert } from "@/components/ui/Alert";
import { Building2 } from "lucide-react";
import { useRouter } from "next/router";

const FROM_MESSAGES: Record<string, string> = {
  ads: "You need an active business listing before you can manage ads. Create your listing below — our team reviews every submission within 24 hours.",
};

const CreateBusinessPage: NextPageWithLayout = () => {
  const router = useRouter();
  const fromMessage = router.query.from ? FROM_MESSAGES[router.query.from as string] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5F2] border border-[#FDDDD4] flex items-center justify-center">
            <Building2 className="h-4 w-4 text-[#E8572A]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A]">New listing</p>
        </div>
        <h1 className="font-['Fraunces'] text-4xl font-bold text-[#18181B] tracking-tight leading-tight">
          List your business
        </h1>
        <p className="mt-3 text-sm text-[#71717A] leading-relaxed">
          Add your business to the SocialPulse directory. Connect with a community that cares
          about the same causes you do. Our team reviews every submission within 24 hours.
        </p>
      </div>

      {fromMessage && (
        <div className="mb-8">
          <Alert variant="info" message={fromMessage} />
        </div>
      )}

      <BusinessForm mode="create" />
    </div>
  );
};

CreateBusinessPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout title="List Your Business" description="Add your business to the SocialPulse community directory">
      {page}
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/auth/login?callbackUrl=/business/create", permanent: false } };
  }
  if (session.user.role !== "BUSINESS_OWNER" && session.user.role !== "ADMIN") {
    return { redirect: { destination: "/dashboard?error=business_owner_only", permanent: false } };
  }

  // Redirect to edit if they already have a business
  const existing = await db.business.findUnique({ where: { userId: session.user.id, deletedAt: null } });
  if (existing) {
    return { redirect: { destination: "/business/edit", permanent: false } };
  }

  return { props: {} };
};

export default CreateBusinessPage;
