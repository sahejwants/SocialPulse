import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = router.query.token as string;
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully.");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [router.query.token]);

  return (
    <AuthLayout title="Verify email" description="Verify your SocialPulse email address">
      <div className="text-center space-y-6">
        {status === "loading" && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F4F4F0]">
              <svg className="animate-spin w-8 h-8 text-[#E8572A]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <h2 className="font-['Fraunces'] text-2xl font-bold text-[#18181B]">Verifying your email…</h2>
              <p className="mt-2 text-sm text-[#71717A]">This will only take a moment.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-['Fraunces'] text-2xl font-bold text-[#18181B]">Email verified!</h2>
              <p className="mt-2 text-sm text-[#71717A]">{message}</p>
            </div>
            <Button size="lg" className="w-full" onClick={() => router.push("/auth/login")}>
              Sign in to your account
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="font-['Fraunces'] text-2xl font-bold text-[#18181B]">Verification failed</h2>
              <p className="mt-2 text-sm text-[#71717A]">{message}</p>
            </div>
            <div className="space-y-3">
              <Button size="lg" className="w-full" onClick={() => router.push("/auth/login")}>
                Go to sign in
              </Button>
              <p className="text-xs text-[#A1A1AA]">
                Need a new link?{" "}
                <Link href="/auth/register" className="text-[#E8572A] hover:underline">
                  Register again
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
