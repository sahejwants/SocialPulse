import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  basePath?: string;
  className?: string;
}

export function SearchBar({
  placeholder = "Search campaigns…",
  basePath = "/campaigns",
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState((router.query.search as string) || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync with URL changes (browser back/forward)
  useEffect(() => {
    setValue((router.query.search as string) || "");
  }, [router.query.search]);

  const push = (search: string) => {
    const query: Record<string, string> = {};
    if (search) query.search = search;
    if (router.query.category) query.category = router.query.category as string;
    router.push({ pathname: basePath, query });
  };

  const handleChange = (v: string) => {
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(v), 350);
  };

  const clear = () => {
    setValue("");
    push("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA] pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#E4E4DC] bg-white text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent transition-colors"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
