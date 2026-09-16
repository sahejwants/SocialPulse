import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#18181B] border-t border-white/6">
      {/* Bottom bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <span className="font-['Fraunces'] text-base font-bold tracking-tight text-white">
              Social<span className="text-[#E8572A]">Pulse</span>
            </span>
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#E8572A] border border-[#E8572A]/30 rounded px-1.5 py-0.5">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-5">
          {[
            { href: "/campaigns", label: "Campaigns" },
            { href: "/businesses", label: "Businesses" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-white/20">
          &copy; {new Date().getFullYear()} SocialPulse
        </p>
      </div>
    </footer>
  );
}
