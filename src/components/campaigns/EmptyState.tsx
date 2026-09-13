import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  search?: string;
  category?: string;
}

export function EmptyState({ search, category }: EmptyStateProps) {
  const isFiltered = !!search || !!category;

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F4F4F0] flex items-center justify-center mb-5">
        <Megaphone className="h-7 w-7 text-[#A1A1AA]" />
      </div>
      <h3 className="font-['Fraunces'] text-2xl font-bold text-[#18181B] mb-2">
        {isFiltered ? "No campaigns found" : "No campaigns yet"}
      </h3>
      <p className="text-sm text-[#71717A] max-w-sm mb-6 leading-relaxed">
        {isFiltered
          ? `No approved campaigns match "${search || category}". Try a different search or browse all causes.`
          : "Be the first to start a campaign and make a difference in your community."}
      </p>
      {isFiltered ? (
        <Link href="/campaigns">
          <Button variant="outline" size="md">Clear filters</Button>
        </Link>
      ) : (
        <Link href="/auth/register">
          <Button size="md">Start a campaign</Button>
        </Link>
      )}
    </div>
  );
}
