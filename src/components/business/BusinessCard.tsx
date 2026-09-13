import Link from "next/link";
import Image from "next/image";
import { MapPin, Globe, Phone } from "lucide-react";
import type { BusinessWithRelations } from "@/types";
import { truncate, getInitials } from "@/lib/utils";

const CATEGORY_GRADIENTS: Record<string, string> = {
  Retail:                "from-blue-700 to-indigo-600",
  "Food & Beverage":     "from-orange-600 to-amber-500",
  Technology:            "from-violet-700 to-purple-600",
  Healthcare:            "from-emerald-700 to-teal-600",
  Education:             "from-sky-700 to-blue-600",
  Finance:               "from-slate-700 to-zinc-600",
  "Real Estate":         "from-stone-600 to-amber-700",
  "Arts & Entertainment":"from-pink-700 to-fuchsia-600",
  Hospitality:           "from-rose-600 to-orange-500",
  "Professional Services":"from-gray-700 to-slate-600",
  Construction:          "from-yellow-700 to-amber-600",
  Transport:             "from-cyan-700 to-sky-600",
  Other:                 "from-neutral-600 to-stone-500",
};

interface BusinessCardProps {
  business: BusinessWithRelations;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const gradient = CATEGORY_GRADIENTS[business.category] ?? CATEGORY_GRADIENTS.Other;
  const phone = business.contacts.find((c) => c.type === "phone");
  const website = business.website;

  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden hover:border-[#E8572A] hover:shadow-lg transition-all duration-200"
    >
      {/* Logo / Hero area */}
      <div className="relative h-32 overflow-hidden bg-[#18181B] shrink-0">
        {business.logoUrl ? (
          <Image
            src={business.logoUrl}
            alt={business.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="font-['Fraunces'] text-4xl font-bold text-white/20 select-none">
              {getInitials(business.name)}
            </span>
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/40 backdrop-blur-sm text-white border border-white/10">
            {business.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-['Fraunces'] text-lg font-bold text-[#18181B] leading-tight tracking-tight mb-1.5 group-hover:text-[#E8572A] transition-colors">
          {business.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] mb-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{business.city}, {business.state}</span>
        </div>

        <p className="text-sm text-[#71717A] leading-relaxed line-clamp-2 flex-1">
          {truncate(business.description, 100)}
        </p>

        {/* Contact snippets */}
        {(website || phone) && (
          <div className="mt-4 pt-4 border-t border-[#F4F4F0] flex items-center gap-4">
            {website && (
              <span className="flex items-center gap-1 text-xs text-[#52525B]">
                <Globe className="h-3 w-3 text-[#E8572A]" />
                <span className="truncate max-w-[100px]">{website.replace(/^https?:\/\//, "")}</span>
              </span>
            )}
            {phone && (
              <span className="flex items-center gap-1 text-xs text-[#52525B]">
                <Phone className="h-3 w-3 text-[#E8572A]" />
                <span className="truncate">{phone.value}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
