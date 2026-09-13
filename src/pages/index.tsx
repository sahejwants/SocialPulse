import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "./_app";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { ArrowRight, Megaphone, Building2, Users } from "lucide-react";
import { db } from "@/lib/db";
import { CampaignStatus } from "@prisma/client";
import type { CampaignWithRelations } from "@/types";

const CAMPAIGN_CATEGORIES = [
  "Environment", "Education", "Health", "Animal Welfare",
  "Human Rights", "Community", "Arts & Culture",
];

type HomeCampaign = CampaignWithRelations & { _count: { registrations: number } };

interface IndexPageProps {
  campaigns: HomeCampaign[];
  total: number;
}

const IndexPage: NextPageWithLayout<IndexPageProps> = ({ campaigns, total }) => {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#18181B] min-h-[85vh] flex items-center">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#E8572A 1px, transparent 1px), linear-gradient(90deg, #E8572A 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E8572A] rounded-full opacity-[0.07] blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#2D6A4F] rounded-full opacity-[0.06] blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8572A] animate-pulse" />
              <span className="text-xs font-medium text-white/60 tracking-wide uppercase">Raise Awareness</span>
            </div>

            <h1 className="font-['Fraunces'] text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Be the change<br />
              <span className="text-[#E8572A]">the world</span><br />
              is waiting for.
            </h1>

            <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-lg">
              Create and support campaigns for causes you believe in. Connect your business with a community that cares.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/campaigns">
                <Button size="lg" className="gap-2 group">
                  Browse campaigns
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:border-white/30">
                  Start your own
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative vertical text */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block">
          <p
            className="text-xs tracking-[0.4em] uppercase text-white/10 font-medium"
            style={{ writingMode: "vertical-rl" }}
          >
            Advanced Consulting Services
          </p>
        </div>
      </section>

      {/* ── Category chips ── */}
      <section className="bg-white border-b border-[#E4E4DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="shrink-0 text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider pr-2 border-r border-[#E4E4DC]">
              Causes
            </span>
            {CAMPAIGN_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/campaigns?category=${encodeURIComponent(cat)}`}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#F4F4F0] text-[#52525B] hover:bg-[#E8572A] hover:text-white transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-14">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A] mb-3">How it works</p>
            <h2 className="font-['Fraunces'] text-4xl lg:text-5xl font-bold text-[#18181B] tracking-tight leading-tight">
              Three steps to<br />make a difference.
            </h2>
          </div>
          <Link href="/auth/register" className="shrink-0">
            <Button variant="outline" size="md" className="gap-2 group">
              Get started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              icon: Users,
              title: "Create your account",
              body: "Sign up as an individual supporter or a small business owner. It takes less than 2 minutes.",
            },
            {
              step: "02",
              icon: Megaphone,
              title: "Post a campaign",
              body: "Share your cause with a compelling story and poster. Our team reviews and approves campaigns within 24 hours.",
            },
            {
              step: "03",
              icon: Building2,
              title: "Grow together",
              body: "Supporters discover your cause. Businesses connect with a community that shares their values.",
            },
          ].map(({ step, icon: Icon, title, body }) => (
            <div
              key={step}
              className="group relative bg-white rounded-2xl border border-[#E4E4DC] p-8 hover:border-[#E8572A] hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F0] group-hover:bg-[#FFF5F2] flex items-center justify-center transition-colors">
                  <Icon className="h-5 w-5 text-[#E8572A]" />
                </div>
                <span className="font-['Fraunces'] text-4xl font-bold text-[#F4F4F0] group-hover:text-[#FFF5F2] transition-colors select-none">
                  {step}
                </span>
              </div>
              <h3 className="font-['Fraunces'] text-xl font-bold text-[#18181B] mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-[#71717A] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Campaigns teaser ── */}
      <section className="bg-[#F4F4F0] border-y border-[#E4E4DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A] mb-2">Latest</p>
              <h2 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">
                Active campaigns
                {total > 0 && (
                  <span className="ml-3 font-['Inter'] text-base font-normal text-[#A1A1AA]">
                    {total} total
                  </span>
                )}
              </h2>
            </div>
            <Link href="/campaigns">
              <Button variant="outline" size="sm" className="gap-2 group hidden sm:flex">
                View all <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#71717A] text-sm mb-4">No campaigns yet — be the first to start one.</p>
              <Link href="/auth/register">
                <Button size="md">Start a campaign</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} registrationCount={c._count.registrations} />
              ))}
            </div>
          )}

          {campaigns.length > 0 && (
            <div className="mt-8 text-center sm:hidden">
              <Link href="/campaigns">
                <Button variant="outline" size="md" className="gap-2">
                  View all campaigns <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-[#E8572A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-['Fraunces'] text-3xl md:text-4xl font-bold text-white tracking-tight">
              Ready to make noise?
            </h2>
            <p className="mt-2 text-white/70 text-sm">Join hundreds of Australians driving real change.</p>
          </div>
          <Link href="/auth/register" className="shrink-0">
            <Button
              size="lg"
              className="bg-white text-[#E8572A] hover:bg-white/90 active:bg-white/80 shadow-none"
            >
              Create free account
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
};

IndexPage.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export const getServerSideProps: GetServerSideProps = async () => {
  const [campaigns, total] = await Promise.all([
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
  ]);

  return {
    props: {
      campaigns: JSON.parse(JSON.stringify(campaigns)),
      total,
    },
  };
};

export default IndexPage;
