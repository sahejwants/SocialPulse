import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";
import { BusinessForm } from "@/components/business/BusinessForm";
import { Button } from "@/components/ui/Button";
import type { Business, BusinessContact, BusinessImage } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/router";

type FullBusiness = Business & { contacts: BusinessContact[]; images: BusinessImage[] };

interface EditBusinessPageProps {
  business: FullBusiness;
}

const EditBusinessPage: NextPageWithLayout<EditBusinessPageProps> = ({ business }) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete your business listing? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/business/${business.id}`, { method: "DELETE" });
    router.push("/businesses");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5F2] border border-[#FDDDD4] flex items-center justify-center">
            <Pencil className="h-4 w-4 text-[#E8572A]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A]">Edit listing</p>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-['Fraunces'] text-4xl font-bold text-[#18181B] tracking-tight leading-tight">
              {business.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                ${business.isVerified
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {business.isVerified ? "Verified" : "Pending verification"}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 shrink-0"
            onClick={handleDelete}
            loading={deleting}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <BusinessForm
        mode="edit"
        businessId={business.id}
        defaultValues={{
          name: business.name,
          category: business.category as never,
          description: business.description,
          address: business.address,
          city: business.city,
          state: business.state,
          postalCode: business.postalCode,
          website: business.website ?? "",
          logoUrl: business.logoUrl ?? "",
          contacts: business.contacts.map((c) => ({
            type: c.type as never,
            label: c.label ?? undefined,
            value: c.value,
          })),
          images: business.images.map((img) => ({
            url: img.url,
            caption: img.caption ?? undefined,
          })),
        }}
      />
    </div>
  );
};

EditBusinessPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout title="Edit Business Listing">{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/auth/login?callbackUrl=/business/edit", permanent: false } };
  }

  const business = await db.business.findUnique({
    where: { userId: session.user.id, deletedAt: null },
    include: {
      contacts: true,
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!business) {
    return { redirect: { destination: "/business/create", permanent: false } };
  }

  return { props: { business: JSON.parse(JSON.stringify(business)) } };
};

export default EditBusinessPage;
