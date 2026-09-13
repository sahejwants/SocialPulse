import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "./_app";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, User, Lock, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface AccountPageProps {
  name: string | null;
  email: string;
  hasPassword: boolean;
}

function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#18181B]">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-[#A1A1AA]">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCls(err?: string) {
  return cn(
    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-[#18181B] placeholder-[#A1A1AA]",
    "focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent transition-shadow",
    err ? "border-red-400" : "border-[#E4E4DC]"
  );
}

const AccountPage: NextPageWithLayout<AccountPageProps> = ({ name: initialName, email, hasPassword }) => {
  const { update } = useSession();

  // Name form state
  const [name, setName] = useState(initialName ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  // Password form state
  const [pwData, setPwData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setNameError("Name must be at least 2 characters"); return; }
    setNameLoading(true); setNameError(""); setNameSuccess(false);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "name", name: name.trim() }),
    });
    const data = await res.json();
    setNameLoading(false);
    if (!res.ok) { setNameError(data.error ?? "Failed to update name"); return; }
    setNameSuccess(true);
    await update({ name: name.trim() });
    setTimeout(() => setNameSuccess(false), 3000);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) { setPwError("Passwords do not match"); return; }
    setPwLoading(true); setPwError(""); setPwSuccess(false);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "password", currentPassword: pwData.currentPassword, newPassword: pwData.newPassword }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) { setPwError(data.error ?? "Failed to update password"); return; }
    setPwSuccess(true);
    setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setTimeout(() => setPwSuccess(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#E8572A] mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">Account settings</h1>
        <p className="text-sm text-[#71717A] mt-1">{email}</p>
      </div>

      {/* Profile */}
      <section className="bg-white border border-[#E4E4DC] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-[#18181B]">
          <User className="h-4 w-4 text-[#E8572A]" /> Profile
        </div>

        <form onSubmit={handleNameSave} className="space-y-4">
          <Field label="Full name" error={nameError}>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              placeholder="Your name"
              className={inputCls(nameError)}
            />
          </Field>

          <Field label="Email address">
            <input value={email} disabled className={cn(inputCls(), "bg-[#F4F4F0] text-[#A1A1AA] cursor-not-allowed")} />
          </Field>

          {nameSuccess && (
            <p className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              <CheckCircle2 className="h-4 w-4" /> Name updated successfully.
            </p>
          )}

          <Button type="submit" size="sm" loading={nameLoading}>Save name</Button>
        </form>
      </section>

      {/* Password */}
      {hasPassword ? (
        <section className="bg-white border border-[#E4E4DC] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#18181B]">
            <Lock className="h-4 w-4 text-[#E8572A]" /> Change password
          </div>

          <form onSubmit={handlePasswordSave} className="space-y-4">
            <Field label="Current password">
              <input
                type="password"
                value={pwData.currentPassword}
                onChange={(e) => { setPwData((d) => ({ ...d, currentPassword: e.target.value })); setPwError(""); }}
                placeholder="Enter your current password"
                className={inputCls(pwError)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password" hint="Min 8 characters, one uppercase, one number.">
              <input
                type="password"
                value={pwData.newPassword}
                onChange={(e) => { setPwData((d) => ({ ...d, newPassword: e.target.value })); setPwError(""); }}
                placeholder="New password"
                className={inputCls(pwError)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password" error={pwError}>
              <input
                type="password"
                value={pwData.confirmPassword}
                onChange={(e) => { setPwData((d) => ({ ...d, confirmPassword: e.target.value })); setPwError(""); }}
                placeholder="Repeat new password"
                className={inputCls(pwError)}
                autoComplete="new-password"
              />
            </Field>

            {pwError && (
              <p className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {pwError}
              </p>
            )}
            {pwSuccess && (
              <p className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                <CheckCircle2 className="h-4 w-4" /> Password changed successfully.
              </p>
            )}

            <Button type="submit" size="sm" loading={pwLoading}>Update password</Button>
          </form>
        </section>
      ) : (
        <section className="bg-[#F4F4F0] border border-[#E4E4DC] rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#71717A]">
            <Lock className="h-4 w-4" /> Password management is not available for social login accounts.
          </div>
        </section>
      )}
    </div>
  );
};

AccountPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout title="Account Settings">{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/auth/login?callbackUrl=/account", permanent: false } };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, password: true },
  });
  if (!user) return { redirect: { destination: "/", permanent: false } };

  return {
    props: {
      name: user.name,
      email: user.email,
      hasPassword: !!user.password,
    },
  };
};

export default AccountPage;
