import type { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Megaphone, Building2, Users, Tv2,
  LogOut, ChevronRight, ShieldCheck, ClipboardList,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/ads", label: "Ads", icon: Tv2 },
  { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
];

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const pageTitle = title ? `${title} — Admin` : "Admin — SocialPulse";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <div className="min-h-screen flex bg-[#F4F4F0]">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 bg-[#18181B] flex flex-col min-h-screen sticky top-0 h-screen">
          {/* Brand */}
          <div className="px-5 py-6 border-b border-white/5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-[#E8572A] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">SocialPulse</p>
                <p className="text-[10px] text-white/40 leading-none mt-0.5 uppercase tracking-wider">Admin</p>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-2 space-y-0.5">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? router.pathname === href : router.pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-[#E8572A] text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="px-2 py-4 border-t border-white/5 space-y-0.5">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="h-4 w-4 shrink-0 rotate-180" />
              Back to site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-[#F4F4F0]/80 backdrop-blur-sm border-b border-[#E4E4DC] px-8 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#A1A1AA]">
              {title ?? "Dashboard"}
            </p>
          </div>
          <div className="px-8 py-8">{children}</div>
        </main>
      </div>
    </>
  );
}
