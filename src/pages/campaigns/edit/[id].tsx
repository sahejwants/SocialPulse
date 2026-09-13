import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import type { Campaign, CampaignImage } from "@prisma/client";
import { Pencil } from "lucide-react";

interface EditCampaignPageProps {
  campaign: Omit<Campaign, "startDate" | "endDate"> & {
    images: CampaignImage[];
    startDate: string | null;
    endDate: string | null;
    maxParticipants: number | null;
  };
}

const EditCampaignPage: NextPageWithLayout<EditCampaignPageProps> = ({ campaign }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5F2] border border-[#FDDDD4] flex items-center justify-center">
            <Pencil className="h-4 w-4 text-[#E8572A]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A]">Edit campaign</p>
        </div>
        <h1 className="font-['Fraunces'] text-4xl font-bold text-[#18181B] tracking-tight leading-tight">
          {campaign.title}
        </h1>
        <p className="mt-3 text-sm text-[#71717A]">
          Editing a campaign will reset its status to{" "}
          <span className="font-medium text-[#18181B]">Pending review</span>.
        </p>
      </div>

      <CampaignForm
        mode="edit"
        campaignId={campaign.id}
        defaultValues={{
          title: campaign.title,
          category: campaign.category as never,
          description: campaign.description,
          posterImage: campaign.posterImage,
          additionalImages: campaign.images.map((img) => ({
            url: img.url,
            caption: img.caption ?? undefined,
          })),
          startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : "",
          endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : "",
          location: campaign.location ?? "",
          mapUrl: campaign.mapUrl ?? "",
          maxParticipants: campaign.maxParticipants ?? "",
        }}
      />
    </div>
  );
};

EditCampaignPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout title="Edit Campaign">
      {page}
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: `/auth/login?callbackUrl=/campaigns/edit/${ctx.params?.id}`, permanent: false } };
  }

  const campaign = await db.campaign.findUnique({
    where: { id: ctx.params?.id as string, deletedAt: null },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!campaign) return { notFound: true };

  const isOwner = campaign.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return { notFound: true };

  return {
    props: { campaign: JSON.parse(JSON.stringify(campaign)) },
  };
};

export default EditCampaignPage;
