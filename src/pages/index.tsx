import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "./_app";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { ArrowRight, Search } from "lucide-react";
import { db } from "@/lib/db";
import { CampaignStatus } from "@prisma/client";
import type { CampaignWithRelations } from "@/types";
import { cn } from "@/lib/utils";


// Real quotes from Australian campaign creators
const TESTIMONIALS = [
  {
    quote: "The opposite to feeling 'othered' is to feel unified. If for one day everyone who cared wore the same colour, then young people would know they were not alone.",
    name: "Katherine Hudson",
    context: "Co-founder of Wear It Purple Day, started the campaign while in Year 11",
  },
  {
    quote: "Just as the impacts of evil are borne by all of us, so too are solutions borne of all of us.",
    name: "Grace Tame",
    context: "Survivor advocate, Australian of the Year 2021",
  },
  {
    quote: "We're raising an anxious generation. We want our kids to discover themselves, before the world discovers them.",
    name: "Michael Wipfli",
    context: "Co-founder of the 36 Months campaign, which led to Australia's social media age legislation",
  },
];

type HomeCampaign = CampaignWithRelations & { _count: { registrations: number } };

interface IndexPageProps {
  campaigns: HomeCampaign[];
  total: number;
  stats: { campaigns: number; users: number; businesses: number };
}

const IndexPage: NextPageWithLayout<IndexPageProps> = ({ campaigns, total, stats }) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const availableCategories = [...new Set(campaigns.map((c) => c.category))];
  const filteredCampaigns = activeCategory
    ? campaigns.filter((c) => c.category === activeCategory)
    : campaigns;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/campaigns?search=${encodeURIComponent(q)}` : "/campaigns");
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#18181B]">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#E8572A 1px, transparent 1px), linear-gradient(90deg, #E8572A 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div>
            <p className="text-xs font-medium text-white/35 tracking-widest uppercase mb-6">
              SocialPulse — Australia
            </p>

            <h1 className="font-['Fraunces'] text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Start a campaign.<br />
              <span className="text-[#E8572A]">Find your people.</span>
            </h1>

            <p className="text-base text-white/45 leading-relaxed mb-10 max-w-lg">
              SocialPulse connects people who care about the same things. Post your cause, join others, or list your business in the community directory.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns…"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#E8572A]/50 transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3.5 rounded-xl bg-[#E8572A] text-white text-sm font-semibold hover:bg-[#C73E1A] active:scale-95 transition-all"
              >
                Search
              </button>
            </form>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/campaigns">
                <Button size="lg" className="gap-2 group">
                  Browse campaigns
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-white/15 text-white hover:bg-white/6 hover:border-white/25">
                  Create an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform numbers ── */}
      <section className="bg-[#18181B] border-t border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 divide-x divide-white/8">
            {[
              { value: stats.campaigns, label: "Campaigns posted" },
              { value: stats.users, label: "people joined" },
              { value: stats.businesses, label: "Verified businesses" },
            ].map(({ value, label }) => (
              <div key={label} className="px-6 first:pl-0 last:pr-0">
                <p className="font-['Fraunces'] text-3xl font-bold text-white tabular-nums">
                  {value > 0 ? `${value.toLocaleString()}+` : "—"}
                </p>
                <p className="text-xs text-white/30 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you can do ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-12">
          <div className="flex-1">
            <p className="text-xs font-medium text-[#E8572A] uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-['Fraunces'] text-4xl lg:text-5xl font-bold text-[#18181B] tracking-tight leading-tight">
              Post. Join. Grow.
            </h2>
          </div>
          <Link href="/auth/register" className="shrink-0">
            <Button variant="outline" size="md" className="gap-2 group">
              Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile tabs */}
        <div className="flex gap-2 mb-6 lg:hidden">
          {["Sign up", "Post a campaign", "Grow together"].map((label, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                activeStep === i
                  ? "bg-[#E8572A] text-white border-[#E8572A]"
                  : "bg-white text-[#71717A] border-[#E4E4DC] hover:border-[#E8572A]/30"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[
            {
              title: "Sign up",
              body: "Join as an individual or a business. Takes under two minutes, no credit card required.",
              cta: { label: "Create account", href: "/auth/register" },
            },
            {
              title: "Post a campaign",
              body: "Write your cause, set a date, upload an image. Reviewed within 24 hours and published to the community",
              cta: { label: "See active campaigns", href: "/campaigns" },
            },
            {
              title: "Grow together",
              body: "Supporters find your campaign and join. Businesses can connect with communities that match their values.",
              cta: { label: "Browse businesses", href: "/businesses" },
            },
          ].map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={cn(
                "text-left rounded-2xl border p-8 transition-all duration-200",
                "lg:block",
                i !== activeStep ? "hidden lg:block" : "block",
                activeStep === i
                  ? "border-[#E8572A] bg-white shadow-sm"
                  : "border-[#E4E4DC] bg-white hover:border-[#E8572A]/40"
              )}
            >
              <p className="text-xs font-medium text-[#A1A1AA] mb-3">0{i + 1}</p>
              <h3 className="font-['Fraunces'] text-xl font-bold text-[#18181B] mb-3 tracking-tight">{step.title}</h3>
              <p className="text-sm text-[#71717A] leading-relaxed mb-5">{step.body}</p>
              <Link
                href={step.cta.href}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8572A] hover:underline"
              >
                {step.cta.label} <ArrowRight className="h-3 w-3" />
              </Link>
            </button>
          ))}
        </div>
      </section>

      {/* ── Real quotes ── */}
      <section className="bg-[#18181B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-12">
            From people who started something
          </p>

          <div className="grid lg:grid-cols-3 gap-px bg-white/6 rounded-2xl overflow-hidden">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={cn(
                  "text-left p-8 transition-colors duration-200",
                  activeTestimonial === i
                    ? "bg-[#E8572A]/12"
                    : "bg-[#18181B] hover:bg-white/4"
                )}
              >
                <blockquote className="font-['Fraunces'] text-lg text-white/80 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/35 mt-1 leading-relaxed">{t.context}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Active campaigns ── */}
      <section className="bg-[#F4F4F0] border-y border-[#E4E4DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-medium text-[#E8572A] uppercase tracking-widest mb-2">Latest</p>
              <h2 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">
                Active campaigns
                {total > 0 && (
                  <span className="ml-3 font-['Inter'] text-base font-normal text-[#A1A1AA]">
                    {total} total
                  </span>
                )}
              </h2>
            </div>
            <Link href="/campaigns" className="hidden sm:block shrink-0">
              <Button variant="outline" size="sm" className="gap-2 group">
                View all <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Category filter */}
          {availableCategories.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap mb-8">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  activeCategory === null
                    ? "bg-[#18181B] text-white border-[#18181B]"
                    : "bg-white text-[#52525B] border-[#E4E4DC] hover:border-[#18181B]/30"
                )}
              >
                All
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    activeCategory === cat
                      ? "bg-[#E8572A] text-white border-[#E8572A]"
                      : "bg-white text-[#52525B] border-[#E4E4DC] hover:border-[#E8572A]/40"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#71717A] text-sm mb-4">
                {activeCategory
                  ? `No ${activeCategory} campaigns at the moment.`
                  : "No campaigns yet — be the first."}
              </p>
              {activeCategory ? (
                <button onClick={() => setActiveCategory(null)} className="text-sm text-[#E8572A] hover:underline font-medium">
                  Show all
                </button>
              ) : (
                <Link href="/auth/register"><Button size="md">Start a campaign</Button></Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} registrationCount={c._count.registrations} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/campaigns">
              <Button variant="outline" size="md" className="gap-2">
                View all campaigns <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── For businesses ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-medium text-[#2D6A4F] uppercase tracking-widest mb-3">For businesses</p>
            <h2 className="font-['Fraunces'] text-4xl lg:text-5xl font-bold text-[#18181B] tracking-tight leading-tight mb-5">
              Your values,<br />visible.
            </h2>
            <p className="text-base text-[#71717A] leading-relaxed mb-8 max-w-md">
              List your business in the directory, connect with the community, and run ads that align with your mission. Verified businesses earn a badge after admin review.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2 group">
                  List your business
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/businesses">
                <Button size="lg" variant="outline">Browse directory</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Business listing", desc: "Public profile with location, contacts and gallery." },
              { title: "Sponsored ads", desc: "Placements across the platform, reviewed before going live." },
              { title: "Verified badge", desc: "Admin-reviewed verification that builds community trust." },
              { title: "Campaign tools", desc: "Run awareness campaigns under your business name." },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="bg-[#F4F4F0] border border-[#E4E4DC] rounded-2xl p-5 hover:border-[#2D6A4F]/40 hover:bg-[#F0FAF5] transition-all"
              >
                <p className="text-sm font-semibold text-[#18181B] mb-1.5">{title}</p>
                <p className="text-xs text-[#71717A] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#E8572A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-['Fraunces'] text-3xl md:text-4xl font-bold text-white tracking-tight">
              Something worth raising?
            </h2>
            <p className="mt-1.5 text-white/60 text-sm">Start for free. No approval needed to join.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-[#E8572A] hover:bg-white/90 shadow-none font-semibold">
                Create account
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button size="lg" className="bg-transparent border border-white/30 text-white hover:bg-white/8 shadow-none">
                Browse first
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

IndexPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async () => {
  const [campaigns, total, totalUsers, totalBusinesses] = await Promise.all([
    db.campaign.findMany({
      where: { status: CampaignStatus.APPROVED, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        images: { orderBy: { order: "asc" }, take: 1 },
        _count: { select: { registrations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.campaign.count({ where: { status: CampaignStatus.APPROVED, deletedAt: null } }),
    db.user.count({ where: { deletedAt: null } }),
    db.business.count({ where: { isVerified: true, deletedAt: null } }),
  ]);

  return {
    props: {
      campaigns: JSON.parse(JSON.stringify(campaigns)),
      total,
      stats: { campaigns: total, users: totalUsers, businesses: totalBusinesses },
    },
  };
};

export default IndexPage;
