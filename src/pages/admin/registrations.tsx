import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AdminLayout } from "@/components/layout/AdminLayout";

const AdminRegistrationsPage: NextPageWithLayout = () => {
  // Coming soon — full registrations UI is not ready yet
  return (
    <div className="max-w-5xl">
      <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight mb-8">Registrations</h1>
      <div className="bg-white rounded-2xl border border-[#E4E4DC] flex flex-col items-center justify-center py-20 px-6 text-center gap-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F4F0] border border-[#E4E4DC]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8572A] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8572A]" />
          </span>
          <span className="text-xs font-medium text-[#52525B]">Coming soon</span>
        </div>
        <p className="text-sm text-[#71717A] max-w-xs leading-relaxed">
          The registrations view is still being built.
        </p>
      </div>
    </div>
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
  return { props: {} };
};

export default AdminRegistrationsPage;
