import { useState } from "react";
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
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
      } else {
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Check your email" description="Password reset link sent">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F4F4F0]">
            <svg className="w-8 h-8 text-[#E8572A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-['Fraunces'] text-2xl font-bold text-[#18181B]">Check your inbox</h2>
            <p className="mt-2 text-sm text-[#71717A] leading-relaxed">
              If an account exists for that email, we&apos;ve sent a password reset link. It will expire in 1 hour.
            </p>
          </div>
          <Button variant="outline" size="lg" className="w-full" onClick={() => router.push("/auth/login")}>
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password" description="Reset your SocialPulse password">
      <div className="space-y-8">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#18181B] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">
            Forgot password?
          </h1>
          <p className="mt-2 text-sm text-[#71717A]">
            No worries — enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && <Alert variant="error" message={error} />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>

        <p className="text-center text-sm text-[#71717A]">
          Remembered it?{" "}
          <Link href="/auth/login" className="text-[#E8572A] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
