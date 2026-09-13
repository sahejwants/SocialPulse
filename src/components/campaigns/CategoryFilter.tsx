import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import { CAMPAIGN_CATEGORIES } from "@/types";

interface CategoryFilterProps {
  active?: string;
  basePath?: string;
}

export function CategoryFilter({ active = "", basePath = "/campaigns" }: CategoryFilterProps) {
  const router = useRouter();

  const navigate = (category: string) => {
    const query: Record<string, string> = {};
    if (router.query.search) query.search = router.query.search as string;
    if (category) query.category = category;
    router.push({ pathname: basePath, query });
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
      <button
        onClick={() => navigate("")}
        className={cn(
          "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border",
          !active
            ? "bg-[#18181B] text-white border-[#18181B]"
            : "bg-transparent text-[#52525B] border-[#E4E4DC] hover:border-[#18181B] hover:text-[#18181B]"
        )}
      >
        All
      </button>

      {CAMPAIGN_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => navigate(cat)}
          className={cn(
            "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border",
            active === cat
              ? "bg-[#E8572A] text-white border-[#E8572A]"
              : "bg-transparent text-[#52525B] border-[#E4E4DC] hover:border-[#E8572A] hover:text-[#E8572A]"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
