import Link from "next/link";
import Image from "next/image";
import { formatDateShort, formatDateTime, truncate, getInitials } from "@/lib/utils";
import type { CampaignWithRelations } from "@/types";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

function getCampaignBadge(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
): "live" | "upcoming" | null {
  if (!startDate) return null;
  const now = new Date();
  const start = new Date(startDate);
  if (endDate && new Date(endDate) < now) return null; // ended — no badge
  if (start > now) return "upcoming";
  return "live";
}

function CampaignBadge({ badge }: { badge: "live" | "upcoming" }) {
  if (badge === "live") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700 border border-sky-200">
      <Clock className="h-2.5 w-2.5" /> Upcoming
    </span>
  );
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Environment:   "from-emerald-800 to-green-600",
  Education:     "from-blue-800 to-indigo-600",
  Health:        "from-rose-800 to-pink-600",
  "Animal Welfare": "from-amber-700 to-orange-500",
  "Human Rights": "from-purple-800 to-violet-600",
  Community:     "from-teal-700 to-cyan-600",
  "Arts & Culture": "from-pink-700 to-fuchsia-600",
  Poverty:       "from-stone-700 to-zinc-600",
  "Disaster Relief": "from-red-800 to-orange-700",
  Other:         "from-slate-700 to-slate-500",
};

function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-sm text-white border border-white/10">
      {category}
    </span>
  );
}

interface CampaignCardProps {
  campaign: CampaignWithRelations & { startDate?: Date | string | null; location?: string | null };
  registrationCount?: number;
  featured?: boolean;
}

export function CampaignCard({ campaign, registrationCount, featured = false }: CampaignCardProps) {
  const gradient = CATEGORY_GRADIENTS[campaign.category] ?? CATEGORY_GRADIENTS.Other;
  const hasImage = !!campaign.posterImage;
  const badge = getCampaignBadge(campaign.startDate, (campaign as CampaignWithRelations & { endDate?: Date | string | null }).endDate);

  if (featured) {
    return (
      <Link
        href={`/campaigns/${campaign.slug}`}
        className="group relative flex flex-col lg:flex-row bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden hover:border-[#E8572A] hover:shadow-xl transition-all duration-300"
      >
        {/* Image */}
        <div className="relative lg:w-[55%] aspect-[16/9] lg:aspect-auto overflow-hidden bg-[#18181B] shrink-0">
          {hasImage ? (
            <Image
              src={campaign.posterImage}
              alt={campaign.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <CategoryPill category={campaign.category} />
            {badge && <CampaignBadge badge={badge} />}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between p-6 lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E8572A] mb-3">Featured</p>
            <h2 className="font-['Fraunces'] text-2xl lg:text-3xl font-bold text-[#18181B] leading-tight tracking-tight mb-3 group-hover:text-[#E8572A] transition-colors">
              {campaign.title}
            </h2>
            <p className="text-sm text-[#71717A] leading-relaxed line-clamp-3">
              {campaign.description}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-6 pt-5 border-t border-[#F4F4F0]">
            <AuthorAvatar name={campaign.user.name} image={campaign.user.image} />
            <div>
              <p className="text-xs font-medium text-[#18181B]">{campaign.user.name ?? "Anonymous"}</p>
              <p className="text-xs text-[#A1A1AA]">{formatDateShort(campaign.createdAt)}</p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden hover:border-[#E8572A] hover:shadow-lg transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-[#18181B] shrink-0">
        {hasImage ? (
          <Image
            src={campaign.posterImage}
            alt={campaign.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <CategoryPill category={campaign.category} />
          {badge && <CampaignBadge badge={badge} />}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-['Fraunces'] text-lg font-bold text-[#18181B] leading-tight tracking-tight mb-2 group-hover:text-[#E8572A] transition-colors line-clamp-2">
          {campaign.title}
        </h3>
        <p className="text-sm text-[#71717A] leading-relaxed line-clamp-2 flex-1">
          {truncate(campaign.description, 120)}
        </p>
        {(campaign.startDate || campaign.location) && (
          <div className="mt-3 space-y-1">
            {campaign.startDate && (
              <p className="flex items-center gap-1.5 text-xs text-[#52525B] font-medium">
                <Calendar className="h-3 w-3 text-[#E8572A] shrink-0" />
                {formatDateTime(campaign.startDate)}
              </p>
            )}
            {campaign.location && (
              <p className="flex items-center gap-1.5 text-xs text-[#71717A]">
                <MapPin className="h-3 w-3 text-[#E8572A] shrink-0" />
                <span className="truncate">{campaign.location}</span>
              </p>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#F4F4F0]">
          <AuthorAvatar name={campaign.user.name} image={campaign.user.image} size="sm" />
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xs font-medium text-[#52525B] truncate">
              {campaign.user.name ?? "Anonymous"}
            </span>
            <span className="text-[#D4D4C8] text-xs">·</span>
            <span className="text-xs text-[#A1A1AA] shrink-0">
              {formatDateShort(campaign.createdAt)}
            </span>
          </div>
          {registrationCount !== undefined && registrationCount > 0 && (
            <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-[#52525B]">
              <Users className="h-3 w-3 text-[#E8572A]" /> {registrationCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function AuthorAvatar({
  name,
  image,
  size = "md",
}: {
  name?: string | null;
  image?: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-[10px]";
  if (image) {
    return (
      <img
        src={image}
        alt={name ?? ""}
        className={`${dim} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-[#E8572A] flex items-center justify-center shrink-0`}>
      <span className="font-bold text-white">{getInitials(name ?? "A")}</span>
    </div>
  );
}
