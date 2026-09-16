import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { Eye, EyeOff } from "lucide-react";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    role: z.enum(["USER", "BUSINESS_OWNER"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [autoVerified, setAutoVerified] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "USER" },
  });

  const role = watch("role");

  // Auto-redirect countdown when email verification is disabled
  useEffect(() => {
    if (!autoVerified) return;
    if (countdown <= 0) { router.push("/auth/login"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [autoVerified, countdown, router]);

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
      } else {
        setSuccess(true);
        if (json.verified) setAutoVerified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success && autoVerified) {
    return (
      <AuthLayout title="Account created" description="Welcome to SocialPulse">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="font-['Fraunces'] text-2xl font-bold text-[#18181B]">Account created!</h2>
            <p className="mt-3 text-sm text-[#71717A] leading-relaxed">
              Your account is ready. Redirecting to sign in in{" "}
              <strong className="text-[#18181B]">{countdown}</strong> second{countdown !== 1 ? "s" : ""}…
            </p>
          </div>
          <Button size="md" onClick={() => router.push("/auth/login")} className="w-full">
            Sign in now
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout title="Check your email" description="Verify your SocialPulse account">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-['Fraunces'] text-2xl font-bold text-[#18181B]">Check your inbox</h2>
            <p className="mt-3 text-sm text-[#71717A] leading-relaxed">
              We&apos;ve sent a verification link to your email address. Click it to activate your account.
            </p>
          </div>
          <Button variant="outline" size="md" onClick={() => router.push("/auth/login")} className="w-full">
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" description="Join SocialPulse and start making a difference">
      <div className="space-y-8">
        <div>
          <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[#71717A]">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#E8572A] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {error && <Alert variant="error" message={error} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Account type toggle */}
          <FormField label="I am a" htmlFor="role">
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              {[
                { value: "USER", label: "Individual", desc: "Support causes & campaigns" },
                { value: "BUSINESS_OWNER", label: "Business", desc: "Promote my business" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`relative flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    role === opt.value
                      ? "border-[#E8572A] bg-[#FFF5F2]"
                      : "border-[#E4E4DC] hover:border-[#C4C4BB]"
                  }`}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    className="sr-only"
                    {...register("role")}
                  />
                  <span className="text-sm font-semibold text-[#18181B]">{opt.label}</span>
                  <span className="text-xs text-[#71717A] mt-0.5">{opt.desc}</span>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Full name" htmlFor="name" error={errors.name?.message} required>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              error={errors.name?.message}
              {...register("name")}
            />
          </FormField>

          <FormField label="Email address" htmlFor="email" error={errors.email?.message} required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            hint="Min. 8 characters, one uppercase, one number"
            required
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                error={errors.password?.message}
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </FormField>

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Create account
          </Button>

          <p className="text-xs text-center text-[#A1A1AA]">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[#71717A]">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[#71717A]">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
