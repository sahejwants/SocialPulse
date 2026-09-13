import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function UpgradeSuccessPage() {
  // Automatically clear the JWT session so the user re-authenticates with the new role
  useEffect(() => {
    const timer = setTimeout(() => {
      signOut({ callbackUrl: "/auth/login?upgraded=1&callbackUrl=%2Fbusiness%2Fcreate" });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthLayout title="Account upgraded" description="Your account has been upgraded to Business Owner">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#F0FAF5] flex items-center justify-center mx-auto">
          <Building2 className="h-8 w-8 text-[#2D6A4F]" />
        </div>

        <div>
          <h1 className="font-['Fraunces'] text-2xl font-bold text-[#18181B] tracking-tight mb-2">
            You're now a Business Owner!
          </h1>
          <p className="text-sm text-[#71717A] leading-relaxed">
            Your account has been upgraded. You'll be signed out in a moment so your new permissions take effect. Then set up your business listing.
          </p>
        </div>

        <div className="bg-[#F0FAF5] rounded-xl p-4 text-sm text-[#2D6A4F] font-medium">
          Signing you out automatically…
        </div>

        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/auth/login?upgraded=1&callbackUrl=%2Fbusiness%2Fcreate" })}
          className="w-full"
        >
          Sign out now
        </Button>
      </div>
    </AuthLayout>
  );
}
