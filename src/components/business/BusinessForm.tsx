import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { nanoid } from "nanoid";
import { ImageUpload, MultiImageUpload } from "@/components/ui/ImageUpload";
import { Button } from "@/components/ui/Button";
import { BUSINESS_CATEGORIES, CONTACT_TYPES } from "@/types";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const contactSchema = z.object({
  type: z.enum(CONTACT_TYPES as unknown as [string, ...string[]]),
  label: z.string().optional(),
  value: z.string().min(1, "Value required"),
});

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  category: z.enum(BUSINESS_CATEGORIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a category" }),
  }),
  description: z.string().min(30, "Description must be at least 30 characters").max(2000),
  address: z.string().min(5, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postalCode: z.string().min(4, "Postal code required"),
  website: z.string().url("Enter a valid URL (include https://)").optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  contacts: z.array(contactSchema).max(10).optional(),
  images: z
    .array(z.object({ url: z.string().min(1), caption: z.string().optional() }))
    .max(6)
    .optional(),
});

type FormValues = z.infer<typeof schema>;

interface BusinessFormProps {
  defaultValues?: Partial<FormValues>;
  businessId?: string;
  mode: "create" | "edit";
}

const CONTACT_LABELS: Record<string, string> = {
  phone: "Phone",
  email: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  youtube: "YouTube",
  other: "Other",
};

export function BusinessForm({ defaultValues, businessId, mode }: BusinessFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Stable folder id: existing business id on edit, fresh nanoid on create
  const folderRef = useRef<string>(businessId ?? nanoid());
  const folder = folderRef.current;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      website: "",
      logoUrl: "",
      contacts: [],
      images: [],
      ...defaultValues,
    },
  });

  const { fields: contactFields, append: addContact, remove: removeContact } = useFieldArray({
    control,
    name: "contacts",
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const payload = {
      ...data,
      website: data.website || null,
      logoUrl: data.logoUrl || null,
    };
    try {
      const url = mode === "create" ? "/api/business" : `/api/business/${businessId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push(`/businesses/${json.slug}`), 1000);
    } catch {
      setServerError("Network error — please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {serverError && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {mode === "create" ? "Business submitted for verification!" : "Business updated!"} Redirecting…
        </div>
      )}

      {/* ── Basic info ── */}
      <Section title="Basic information">
        <Field label="Business name" error={errors.name?.message} required>
          <input {...register("name")} placeholder="e.g. Green Roots Nursery" className={inputClass(!!errors.name)} />
        </Field>

        <Field label="Category" error={errors.category?.message} required>
          <select {...register("category")} className={inputClass(!!errors.category)}>
            <option value="">Select a category…</option>
            {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Description" error={errors.description?.message} required
          hint="Describe what your business does and how it connects with the community.">
          <textarea
            {...register("description")}
            rows={5}
            placeholder="Tell the community what you do, what you stand for, and what makes you unique."
            className={cn(inputClass(!!errors.description), "resize-none")}
          />
        </Field>

        <Field label="Website" error={errors.website?.message}
          hint="Include https://. Leave empty if you don't have one.">
          <input {...register("website")} placeholder="https://example.com.au" className={inputClass(!!errors.website)} />
        </Field>
      </Section>

      {/* ── Address ── */}
      <Section title="Location">
        <Field label="Street address" error={errors.address?.message} required>
          <input {...register("address")} placeholder="123 Main Street" className={inputClass(!!errors.address)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City" error={errors.city?.message} required>
            <input {...register("city")} placeholder="Sydney" className={inputClass(!!errors.city)} />
          </Field>
          <Field label="State" error={errors.state?.message} required>
            <select {...register("state")} className={inputClass(!!errors.state)}>
              <option value="">Select…</option>
              {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Postal code" error={errors.postalCode?.message} required>
          <input {...register("postalCode")} placeholder="2000" className={cn(inputClass(!!errors.postalCode), "max-w-[140px]")} />
        </Field>
      </Section>

      {/* ── Contacts ── */}
      <Section title="Contact details"
        action={
          contactFields.length < 10 ? (
            <button
              type="button"
              onClick={() => addContact({ type: "phone", label: "", value: "" })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8572A] hover:text-[#C73E1A] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add contact
            </button>
          ) : undefined
        }
      >
        {contactFields.length === 0 && (
          <p className="text-sm text-[#A1A1AA]">
            No contacts yet.{" "}
            <button
              type="button"
              onClick={() => addContact({ type: "phone", label: "", value: "" })}
              className="text-[#E8572A] hover:underline"
            >
              Add one
            </button>
          </p>
        )}
        {contactFields.map((field, idx) => (
          <div key={field.id} className="flex items-start gap-3">
            <div className="flex-1 grid grid-cols-3 gap-3">
              <select
                {...register(`contacts.${idx}.type`)}
                className={inputClass(false)}
              >
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t}>{CONTACT_LABELS[t] ?? t}</option>
                ))}
              </select>
              <input
                {...register(`contacts.${idx}.label`)}
                placeholder="Label (optional)"
                className={inputClass(false)}
              />
              <input
                {...register(`contacts.${idx}.value`)}
                placeholder="Value"
                className={inputClass(!!errors.contacts?.[idx]?.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeContact(idx)}
              className="mt-3 w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Section>

      {/* ── Media ── */}
      <Section title="Photos & logo">
        <Controller
          name="logoUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value ?? ""}
              onChange={field.onChange}
              folder={`businesses/${folder}/logo`}
              label="Business logo"
              hint="Square format works best. JPG, PNG or WebP — max 8 MB."
              error={errors.logoUrl?.message}
            />
          )}
        />

        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <MultiImageUpload
              value={field.value ?? []}
              onChange={field.onChange}
              folder={`businesses/${folder}/images`}
              max={6}
              label="Gallery photos (optional)"
              error={errors.images?.message}
            />
          )}
        />
        <p className="text-xs text-[#A1A1AA]">
          Show your storefront, products, team, or anything that represents your business.
        </p>
      </Section>

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" size="lg" loading={isSubmitting} disabled={success}>
          {mode === "create" ? "Submit listing" : "Save changes"}
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
          Your listing will be reviewed by our team before it appears in the directory.
          You will receive an email once it is verified.
        </p>
      )}
    </form>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E4E4DC]">
        <h2 className="font-['Fraunces'] text-lg font-bold text-[#18181B]">{title}</h2>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
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
    hasError ? "border-red-400" : "border-[#E4E4DC]"
  );
}
