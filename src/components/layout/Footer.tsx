import Link from "next/link";
import { Megaphone, Building2, Heart, Mail, ExternalLink } from "lucide-react";

const LINKS = {
  Platform: [
    { href: "/campaigns", label: "Browse Campaigns" },
    { href: "/businesses", label: "Businesses" },
    { href: "/campaigns/create", label: "Start a Campaign" },
    { href: "/auth/register", label: "Join SocialPulse" },
  ],
  Community: [
    { href: "/about", label: "About Us" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

const STATS = [
  { icon: Megaphone, value: "100+", label: "Campaigns" },
  { icon: Building2, value: "50+", label: "Businesses" },
  { icon: Heart, value: "10k+", label: "Supporters" },
];

export function Footer() {
  return (
    <footer className="bg-[#18181B] text-white">
      {/* Stats band */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-3 gap-6 max-w-xl">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <Icon className="h-5 w-5 text-[#E8572A] mb-1" />
                <span className="font-['Fraunces'] text-3xl font-bold tracking-tight">{value}</span>
                <span className="text-sm text-[#71717A]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand col — takes 2/5 */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/">
              <span className="font-['Fraunces'] text-2xl font-bold tracking-tight">
                Social<span className="text-[#E8572A]">Pulse</span>
              </span>
            </Link>
            <p className="text-sm text-[#71717A] leading-relaxed max-w-xs">
              A platform for raising awareness about social causes and connecting communities with businesses that care.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="mailto:hello@socialpulse.com.au"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-[#71717A] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Email us"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://socialpulse.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-[#71717A] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Website"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group} className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#52525B]">
                {group}
              </h3>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-[#71717A] hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#52525B]">
            &copy; {new Date().getFullYear()} SocialPulse — Advanced Consulting Services. All rights reserved.
          </p>
          <p className="text-xs text-[#3F3F46]">
            Built with purpose.
          </p>
        </div>
      </div>
    </footer>
  );
}
