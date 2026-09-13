import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { ExternalLink, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface AdData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

interface AdCardProps {
  ad: AdData;
  variant?: "grid" | "banner";
}

function BusinessLogo({ ad }: { ad: AdData }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#F4F4F0] border border-[#E4E4DC] overflow-hidden flex items-center justify-center shrink-0">
      {ad.business.logoUrl ? (
        <Image src={ad.business.logoUrl} alt={ad.business.name} width={40} height={40} className="object-cover" />
      ) : (
        <span className="text-xs font-bold text-[#71717A]">{getInitials(ad.business.name)}</span>
      )}
    </div>
  );
}

function AdModal({ ad, onClose }: { ad: AdData; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full aspect-video bg-[#F4F4F0]">
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            fill
            className="object-cover"
            sizes="448px"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#18181B]/70 text-white/80 backdrop-blur-sm">
            Sponsored
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Business row */}
          <Link
            href={`/businesses/${ad.business.slug}`}
            onClick={onClose}
            className="flex items-center gap-3 mb-5 group"
          >
            <BusinessLogo ad={ad} />
            <div>
              <p className="text-[11px] text-[#A1A1AA] font-medium uppercase tracking-wider">Sponsored by</p>
              <p className="text-sm font-semibold text-[#18181B] group-hover:text-[#E8572A] transition-colors">
                {ad.business.name}
              </p>
            </div>
          </Link>

          {/* Title + description */}
          <h3 className="font-['Fraunces'] text-xl font-bold text-[#18181B] leading-snug tracking-tight mb-2">
            {ad.title}
          </h3>
          {ad.description && (
            <p className="text-sm text-[#71717A] leading-relaxed mb-6">{ad.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            {ad.linkUrl && (
              <a
                href={ad.linkUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={onClose}
                className="block"
              >
                <Button size="md" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" /> Visit website
                </Button>
              </a>
            )}
            <Link href={`/businesses/${ad.business.slug}`} onClick={onClose} className="block">
              <Button variant="outline" size="md" className="w-full gap-2">
                <Building2 className="h-4 w-4" /> View business profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdGridCard({ ad, onOpen }: { ad: AdData; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative flex flex-col bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden hover:border-[#E8572A] hover:shadow-lg transition-all duration-200 h-full w-full text-left"
    >
      {/* Sponsored label */}
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#18181B]/70 text-white/80 backdrop-blur-sm">
          Sponsored
        </span>
      </div>

      {/* Ad image */}
      <div className="relative h-44 bg-[#F4F4F0] overflow-hidden shrink-0">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-['Fraunces'] text-lg font-bold text-[#18181B] leading-tight tracking-tight mb-2 group-hover:text-[#E8572A] transition-colors line-clamp-2">
          {ad.title}
        </h3>
        {ad.description && (
          <p className="text-sm text-[#71717A] leading-relaxed line-clamp-2 flex-1 mb-3">
            {ad.description}
          </p>
        )}

        {/* Business credit */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F4F4F0]">
          <span className="flex items-center gap-2 text-xs text-[#71717A]">
            <span className="w-5 h-5 rounded-full bg-[#E4E4DC] overflow-hidden flex items-center justify-center shrink-0">
              {ad.business.logoUrl ? (
                <Image src={ad.business.logoUrl} alt={ad.business.name} width={20} height={20} className="object-cover" />
              ) : (
                <span className="text-[8px] font-bold text-[#71717A]">{getInitials(ad.business.name)}</span>
              )}
            </span>
            <span className="truncate max-w-[120px]">{ad.business.name}</span>
          </span>
          <span className="text-[10px] text-[#E8572A] font-semibold">View details →</span>
        </div>
      </div>
    </button>
  );
}

function AdBanner({ ad, onOpen }: { ad: AdData; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group w-full flex items-center gap-5 bg-white border border-[#E4E4DC] rounded-2xl overflow-hidden hover:border-[#E8572A] hover:shadow-md transition-all duration-200 p-0 text-left"
    >
      {/* Image strip */}
      <div className="relative w-28 sm:w-36 h-20 shrink-0 overflow-hidden bg-[#F4F4F0]">
        <Image
          src={ad.imageUrl}
          alt={ad.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="150px"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-3 pr-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Sponsored</span>
          <span className="text-[#E4E4DC]">·</span>
          <span className="text-[10px] text-[#71717A] truncate">{ad.business.name}</span>
        </div>
        <p className="font-['Fraunces'] text-base font-bold text-[#18181B] leading-snug line-clamp-1 group-hover:text-[#E8572A] transition-colors">
          {ad.title}
        </p>
        {ad.description && (
          <p className="text-xs text-[#71717A] mt-0.5 line-clamp-1">{ad.description}</p>
        )}
      </div>

      {/* CTA */}
      <div className="pr-5 shrink-0">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E8572A] text-white group-hover:bg-[#C73E1A] transition-colors">
          See details <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

export function AdCard({ ad, variant = "grid" }: AdCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <AdModal ad={ad} onClose={() => setOpen(false)} />}
      {variant === "banner"
        ? <AdBanner ad={ad} onOpen={() => setOpen(true)} />
        : <AdGridCard ad={ad} onOpen={() => setOpen(true)} />
      }
    </>
  );
}
