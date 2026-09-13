import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useScrolled } from "@/hooks/useScrolled";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Megaphone,
  Building2,
  ShieldCheck,
  User,
  Tv2,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/campaigns", label: "Campaigns" },
  { href: "/businesses", label: "Businesses" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const { pathname } = useRouter();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors duration-150 relative py-1",
        active
          ? "text-[#E8572A]"
          : "text-[#52525B] hover:text-[#18181B]"
      )}
    >
      {label}
      {active && (
        <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#E8572A] rounded-full" />
      )}
    </Link>
  );
}

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "User"}
        className="w-8 h-8 rounded-full object-cover ring-2 ring-[#E4E4DC]"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#E8572A] flex items-center justify-center ring-2 ring-[#E4E4DC]">
      <span className="text-xs font-bold text-white">{getInitials(name ?? "U")}</span>
    </div>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  const isAdmin = session?.user?.role === "ADMIN";
  const isBusinessOwner = session?.user?.role === "BUSINESS_OWNER";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-200",
          scrolled
            ? "bg-white/95 backdrop-blur-sm border-b border-[#E4E4DC] shadow-sm"
            : "bg-white border-b border-[#E4E4DC]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <span className="font-['Fraunces'] text-xl font-bold text-[#18181B] tracking-tight">
                Social<span className="text-[#E8572A]">Pulse</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <NavLink key={l.href} {...l} />
              ))}
            </nav>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              {status === "loading" ? (
                <div className="h-8 w-20 rounded-lg bg-[#F4F4F0] animate-pulse" />
              ) : session ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F4F4F0] transition-colors"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <Avatar name={session.user?.name} image={session.user?.image} />
                    <span className="text-sm font-medium text-[#18181B] max-w-[120px] truncate">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-[#71717A] transition-transform",
                        dropdownOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-[#E4E4DC] shadow-lg py-1.5 z-50">
                      <div className="px-3 py-2 border-b border-[#F4F4F0]">
                        <p className="text-xs font-semibold text-[#18181B] truncate">{session.user?.name}</p>
                        <p className="text-xs text-[#A1A1AA] truncate">{session.user?.email}</p>
                      </div>

                      <div className="py-1">
                        <DropdownLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <DropdownLink href="/account" icon={User} label="Account settings" />
                        <DropdownLink href="/campaigns/create" icon={Megaphone} label="New Campaign" />
                        {isBusinessOwner && (
                          <>
                            <DropdownLink href="/business/edit" icon={Building2} label="My Business" />
                            <DropdownLink href="/business/ads" icon={Tv2} label="My Ads" />
                          </>
                        )}
                        {isAdmin && (
                          <DropdownLink href="/admin" icon={ShieldCheck} label="Admin Panel" />
                        )}
                      </div>

                      <div className="border-t border-[#F4F4F0] pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#DC2626] hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-[#52525B] hover:text-[#18181B] transition-colors px-3 py-2"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm font-medium bg-[#18181B] text-white px-4 py-2 rounded-lg hover:bg-[#27272A] transition-colors"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[#52525B] hover:bg-[#F4F4F0] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-[#E4E4DC] shadow-xl">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#18181B] hover:bg-[#F4F4F0] transition-colors"
                >
                  {l.label}
                </Link>
              ))}

              {session ? (
                <>
                  <div className="border-t border-[#F4F4F0] pt-3 mt-3">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                      <Avatar name={session.user?.name} image={session.user?.image} />
                      <div>
                        <p className="text-sm font-semibold text-[#18181B]">{session.user?.name}</p>
                        <p className="text-xs text-[#A1A1AA]">{session.user?.email}</p>
                      </div>
                    </div>
                    <MobileLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMobileOpen(false)} />
                    <MobileLink href="/account" icon={User} label="Account settings" onClick={() => setMobileOpen(false)} />
                    <MobileLink href="/campaigns/create" icon={Megaphone} label="New Campaign" onClick={() => setMobileOpen(false)} />
                    {isBusinessOwner && (
                      <>
                        <MobileLink href="/business/edit" icon={Building2} label="My Business" onClick={() => setMobileOpen(false)} />
                        <MobileLink href="/business/ads" icon={Tv2} label="My Ads" onClick={() => setMobileOpen(false)} />
                      </>
                    )}
                    {isAdmin && (
                      <MobileLink href="/admin" icon={ShieldCheck} label="Admin Panel" onClick={() => setMobileOpen(false)} />
                    )}
                    <button
                      onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-red-50 transition-colors mt-1"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-[#F4F4F0] pt-3 mt-3 space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E4E4DC] text-sm font-medium text-[#18181B] hover:bg-[#F4F4F0] transition-colors"
                  >
                    <User className="h-4 w-4" /> Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#E8572A] text-sm font-medium text-white hover:bg-[#D14820] transition-colors"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function DropdownLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#18181B] hover:bg-[#F4F4F0] transition-colors"
    >
      <Icon className="h-4 w-4 text-[#71717A]" />
      {label}
    </Link>
  );
}

function MobileLink({ href, icon: Icon, label, onClick }: { href: string; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#18181B] hover:bg-[#F4F4F0] transition-colors"
    >
      <Icon className="h-4 w-4 text-[#71717A]" />
      {label}
    </Link>
  );
}
