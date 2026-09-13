import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../../_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Megaphone, CalendarClock } from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(80, "Max 80 characters"),
  description: z.string().max(160, "Max 160 characters").optional().or(z.literal("")),
  imageUrl: z.string().min(1, "Please upload an ad image"),
  linkUrl: z
    .string()
    .url("Enter a valid URL (include https://)")
    .optional()
    .or(z.literal("")),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateAdPageProps {
  businessId: string;
}

const CreateAdPage: NextPageWithLayout<CreateAdPageProps> = ({ businessId }) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const folderRef = useRef(`businesses/${businessId}/ads/${nanoid()}`);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", imageUrl: "", linkUrl: "" },
  });

  const nowStr = useMemo(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  const titleLen = watch("title")?.length ?? 0;
  const descLen = watch("description")?.length ?? 0;
  const startsAtVal = watch("startsAt");
  const endsAtVal = watch("endsAt");

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, linkUrl: data.linkUrl || null }),
      });
      const json = await res.json();
      if (!res.ok) { setServerError(json.error ?? "Something went wrong."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/business/ads"), 1200);
    } catch {
      setServerError("Network error — please try again.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5F2] border border-[#FDDDD4] flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-[#E8572A]" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A]">New ad</p>
        </div>
        <h1 className="font-['Fraunces'] text-4xl font-bold text-[#18181B] tracking-tight">
          Create an ad
        </h1>
        <p className="mt-3 text-sm text-[#71717A] leading-relaxed">
          Your ad will be shown to visitors browsing campaigns on SocialPulse, once approved by
          our team.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {serverError && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {serverError}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Ad submitted for review! Redirecting…
          </div>
        )}

        {/* Ad image */}
        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              folder={folderRef.current}
              label="Ad image"
              hint="Recommended: 1200 × 628 px (banner ratio). JPG, PNG or WebP — max 8 MB."
              error={errors.imageUrl?.message}
            />
          )}
        />

        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#18181B]">
              Headline <span className="text-[#E8572A]">*</span>
            </label>
            <span className="text-xs text-[#A1A1AA]">{titleLen}/80</span>
          </div>
          <input
            {...register("title")}
            placeholder="e.g. 10% off for SocialPulse supporters this week"
            className={cn(
              "w-full px-4 py-3 rounded-xl border bg-white text-sm placeholder-[#A1A1AA]",
              "focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent",
              errors.title ? "border-red-400" : "border-[#E4E4DC]"
            )}
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#18181B]">Sub-text <span className="text-xs text-[#A1A1AA] font-normal ml-1">optional</span></label>
            <span className="text-xs text-[#A1A1AA]">{descLen}/160</span>
          </div>
          <input
            {...register("description")}
            placeholder="A short supporting line shown under the headline"
            className="w-full px-4 py-3 rounded-xl border border-[#E4E4DC] bg-white text-sm placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Link URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#18181B]">
            Destination URL <span className="text-xs text-[#A1A1AA] font-normal ml-1">optional</span>
          </label>
          <input
            {...register("linkUrl")}
            placeholder="https://yourbusiness.com.au/offer"
            className={cn(
              "w-full px-4 py-3 rounded-xl border bg-white text-sm placeholder-[#A1A1AA]",
              "focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent",
              errors.linkUrl ? "border-red-400" : "border-[#E4E4DC]"
            )}
          />
          <p className="text-xs text-[#A1A1AA]">Where visitors land when they click the ad. Leave empty to link to your business profile.</p>
          {errors.linkUrl && <p className="text-xs text-red-500">{errors.linkUrl.message}</p>}
        </div>

        {/* Schedule */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 text-sm font-medium text-[#18181B]">
            <CalendarClock className="h-4 w-4 text-[#E8572A]" />
            Run dates <span className="text-xs text-[#A1A1AA] font-normal ml-1">optional — leave blank to run indefinitely once approved</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#18181B]">Start date & time</label>
              <input
                type="datetime-local"
                {...register("startsAt")}
                min={nowStr}
                className="w-full px-4 py-3 rounded-xl border border-[#E4E4DC] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#18181B]">End date & time</label>
              <input
                type="datetime-local"
                {...register("endsAt")}
                min={startsAtVal || nowStr}
                className="w-full px-4 py-3 rounded-xl border border-[#E4E4DC] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent"
              />
            </div>
          </div>
          {startsAtVal && endsAtVal && endsAtVal < startsAtVal && (
            <p className="text-xs text-red-500">End date must be after start date.</p>
          )}
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" size="lg" loading={isSubmitting} disabled={success}>
            Submit for review
          </Button>
          <button type="button" onClick={() => router.back()} className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors">
            Cancel
          </button>
        </div>

        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          Our team reviews every ad submission. You will be notified by email once it is
          approved or if changes are needed.
        </p>
      </form>
    </div>
  );
};

CreateAdPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout title="Create Ad">{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/auth/login?callbackUrl=/business/ads/create", permanent: false } };
  }

  const business = await db.business.findUnique({ where: { userId: session.user.id, deletedAt: null } });
  if (!business) {
    return { redirect: { destination: "/business/create?from=ads", permanent: false } };
  }
  if (!business.isVerified) {
    return { redirect: { destination: "/business/ads?locked=1", permanent: false } };
  }

  return { props: { businessId: business.id } };
};

export default CreateAdPage;
