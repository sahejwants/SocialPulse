import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { nanoid } from "nanoid";
import { ImageUpload, MultiImageUpload } from "@/components/ui/ImageUpload";
import { Button } from "@/components/ui/Button";
import { CAMPAIGN_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, MapPin, Calendar, Users, Lock } from "lucide-react";

const schema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Max 100 characters"),
  category: z.enum(CAMPAIGN_CATEGORIES as unknown as [string, ...string[]], {
    error: () => ({ message: "Please select a category" }),
  }),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Max 5,000 characters"),
  posterImage: z.string().min(1, "Please upload a poster image"),
  additionalImages: z
    .array(z.object({ url: z.string().min(1), caption: z.string().optional() }))
    .max(8)
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(300, "Max 300 characters").optional(),
  mapUrl: z.string().url("Enter a valid URL (include https://)").optional().or(z.literal("")),
  maxParticipants: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(1, "Must be at least 1").optional()
  ),
});

type FormValues = Omit<z.infer<typeof schema>, "maxParticipants"> & { maxParticipants?: number };

interface CampaignFormProps {
  defaultValues?: Partial<FormValues>;
  campaignId?: string;
  mode: "create" | "edit";
}

export function CampaignForm({ defaultValues, campaignId, mode }: CampaignFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Stable folder id: existing campaign id on edit, fresh nanoid on create
  const folderRef = useRef<string>(campaignId ?? nanoid());
  const folder = folderRef.current;

  // Minimum datetime string for inputs (now, rounded to the minute)
  const nowStr = useMemo(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  // In edit mode, determine which date fields are still editable based on current time vs saved dates
  const dateEditState = useMemo<"free" | "upcoming" | "live" | "ended">(() => {
    if (mode !== "edit") return "free";
    const start = defaultValues?.startDate ? new Date(defaultValues.startDate) : null;
    const end = defaultValues?.endDate ? new Date(defaultValues.endDate) : null;
    const now = new Date();
    if (end && now > end) return "ended";
    if (start && now >= start) return "live";
    return "upcoming"; // now < start, or no dates set
  }, [mode, defaultValues?.startDate, defaultValues?.endDate]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      posterImage: "",
      additionalImages: [],
      ...defaultValues,
    },
  });

  const descLen = watch("description")?.length ?? 0;
  const startDateVal = watch("startDate");

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      const url = mode === "create" ? "/api/campaigns" : `/api/campaigns/${campaignId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push(`/campaigns/${json.slug}`), 1000);
    } catch {
      setServerError("Network error — please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {mode === "create" ? "Campaign submitted for review!" : "Campaign updated!"} Redirecting…
        </div>
      )}

      {/* Title */}
      <Field label="Campaign title" error={errors.title?.message} required>
        <input
          {...register("title")}
          placeholder="e.g. Clean up Manly Beach — one Saturday at a time"
          className={inputClass(!!errors.title)}
        />
      </Field>

      {/* Category */}
      <Field label="Category" error={errors.category?.message} required>
        <select {...register("category")} className={inputClass(!!errors.category)}>
          <option value="">Select a category…</option>
          {CAMPAIGN_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      {/* Description */}
      <Field
        label="Description"
        error={errors.description?.message}
        hint={`${descLen}/5000 — minimum 50 characters`}
        required
      >
        <textarea
          {...register("description")}
          rows={8}
          placeholder="Tell your story. What's the issue, what are you doing about it, and how can people help?"
          className={cn(inputClass(!!errors.description), "resize-none leading-relaxed")}
        />
      </Field>

      {/* Event dates */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#18181B]">
          <Calendar className="h-4 w-4 text-[#E8572A]" />
          Event dates <span className="text-xs text-[#A1A1AA] font-normal ml-1">optional</span>
        </div>
        {dateEditState === "live" && (
          <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 px-4 py-2.5 text-xs text-sky-700">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            This campaign has already started — the start date is locked. You can still update the end date.
          </div>
        )}
        {dateEditState === "ended" && (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-2.5 text-xs text-zinc-600">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            This campaign has ended — event dates can no longer be modified.
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date & time" error={errors.startDate?.message}>
            <input
              type="datetime-local"
              {...register("startDate")}
              min={nowStr}
              disabled={dateEditState === "live" || dateEditState === "ended"}
              className={cn(inputClass(!!errors.startDate), (dateEditState === "live" || dateEditState === "ended") && "opacity-50 cursor-not-allowed bg-[#F4F4F0]")}
            />
          </Field>
          <Field label="End date & time" error={errors.endDate?.message}>
            <input
              type="datetime-local"
              {...register("endDate")}
              min={startDateVal || nowStr}
              disabled={dateEditState === "ended"}
              className={cn(inputClass(!!errors.endDate), dateEditState === "ended" && "opacity-50 cursor-not-allowed bg-[#F4F4F0]")}
            />
          </Field>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#18181B]">
          <MapPin className="h-4 w-4 text-[#E8572A]" />
          Location <span className="text-xs text-[#A1A1AA] font-normal ml-1">optional</span>
        </div>
        <Field label="Venue / address" error={errors.location?.message}>
          <input
            {...register("location")}
            placeholder="e.g. Manly Beach, Sydney NSW 2095"
            className={inputClass(!!errors.location)}
          />
        </Field>
        <Field label="Google Maps link" error={errors.mapUrl?.message} hint="Open Google Maps, find the location, click Share → Copy link, paste here.">
          <input
            {...register("mapUrl")}
            placeholder="https://maps.google.com/..."
            className={inputClass(!!errors.mapUrl)}
          />
        </Field>
      </div>

      {/* Participant limit */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#18181B]">
          <Users className="h-4 w-4 text-[#E8572A]" />
          Participant limit <span className="text-xs text-[#A1A1AA] font-normal ml-1">optional</span>
        </div>
        <Field label="Max participants" error={errors.maxParticipants?.message} hint="Leave blank for unlimited. Once the cap is reached, the join form will close automatically.">
          <input
            type="number"
            min={1}
            step={1}
            {...register("maxParticipants")}
            placeholder="e.g. 50"
            className={inputClass(!!errors.maxParticipants)}
          />
        </Field>
      </div>

      {/* Poster image */}
      <div>
        <Controller
          name="posterImage"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value}
              onChange={field.onChange}
              folder={`campaigns/${folder}/poster`}
              label="Campaign poster"
              hint="This is the main image shown in listings. JPG, PNG or WebP — max 8 MB."
              error={errors.posterImage?.message}
            />
          )}
        />
      </div>

      {/* Additional images */}
      <div>
        <Controller
          name="additionalImages"
          control={control}
          render={({ field }) => (
            <MultiImageUpload
              value={field.value ?? []}
              onChange={field.onChange}
              folder={`campaigns/${folder}/images`}
              max={8}
              label="Event / supporting photos (optional)"
              error={errors.additionalImages?.message}
            />
          )}
        />
        <p className="mt-1.5 text-xs text-[#A1A1AA]">
          Photos from previous events, the location, or anything that illustrates the cause.
        </p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" size="lg" loading={isSubmitting} disabled={success}>
          {mode === "create" ? "Submit campaign" : "Save changes"}
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors"
        >
          Cancel
        </button>
      </div>

      {mode === "create" && (
        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          Your campaign will be reviewed by our team within 24 hours. You will receive an email
          when it is approved or if we need more information.
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  children,
  error,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#18181B]">
        {label}
        {required && <span className="ml-0.5 text-[#E8572A]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#A1A1AA]">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-[#18181B] placeholder-[#A1A1AA]",
    "focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent transition-shadow",
    hasError ? "border-red-400 focus:ring-red-400" : "border-[#E4E4DC]"
  );
}
