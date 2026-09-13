import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = (router.query.callbackUrl as string) || "/dashboard";
  const isUpgraded = router.query.upgraded === "1";

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "Please verify your email before signing in."
            ? result.error
            : "Incorrect email or password."
        );
      } else {
        router.push(callbackUrl);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in" description="Sign in to your SocialPulse account">
      <div className="space-y-8">
        <div>
          <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#71717A]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-[#E8572A] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        {isUpgraded && (
          <Alert variant="success" message="Your account has been upgraded to Business Owner! Sign in to set up your business listing — you can run ads once your listing is live." />
        )}
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

          <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                error={errors.password?.message}
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#18181B] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-[#71717A] hover:text-[#E8572A] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E4E4DC]" />
          </div>
          <div className="relative flex justify-center text-xs text-[#A1A1AA] bg-[#FAFAF7] px-3">
            New to SocialPulse?
          </div>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => router.push("/auth/register")}
        >
          Create an account
        </Button>
      </div>
    </AuthLayout>
  );
}
