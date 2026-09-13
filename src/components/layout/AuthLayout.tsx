import { ReactNode, useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const QUOTES = [
  {
    text: "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.",
    author: "Albert Einstein",
  },
  {
    text: "Be the change you wish to see in the world.",
    author: "Mahatma Gandhi",
  },
  {
    text: "Alone we can do so little; together we can do so much.",
    author: "Helen Keller",
  },
];

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  return (
    <>
      <Head>
        <title>{title} — SocialPulse</title>
        {description && <meta name="description" content={description} />}
      </Head>

      <div className="min-h-screen flex">
        {/* Left panel — brand */}
        <div className="hidden lg:flex lg:w-[44%] bg-[#18181B] flex-col justify-between p-12 relative overflow-hidden">
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(#E8572A 1px, transparent 1px), linear-gradient(90deg, #E8572A 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Accent shape */}
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#E8572A] opacity-10 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="font-['Fraunces'] text-2xl font-bold text-white tracking-tight">
                Social<span className="text-[#E8572A]">Pulse</span>
              </span>
            </Link>
          </div>

          <div className="relative space-y-8">
            <blockquote>
              <p className="font-['Fraunces'] text-3xl font-light text-white leading-snug tracking-tight">
                &ldquo;{quote.text}&rdquo;
              </p>
              <footer className="mt-4 text-sm text-[#71717A]">— {quote.author}</footer>
            </blockquote>

            <div className="flex gap-3">
              <div className="w-8 h-1 bg-[#E8572A] rounded-full" />
              <div className="w-2 h-1 bg-[#3F3F46] rounded-full" />
              <div className="w-2 h-1 bg-[#3F3F46] rounded-full" />
            </div>
          </div>

          <div className="relative">
            <p className="text-xs text-[#52525B]">
              &copy; {new Date().getFullYear()} SocialPulse — Advanced Consulting Services
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-[#FAFAF7]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <Link href="/">
              <span className="font-['Fraunces'] text-2xl font-bold text-[#18181B] tracking-tight">
                Social<span className="text-[#E8572A]">Pulse</span>
              </span>
            </Link>
          </div>

          <div className="w-full max-w-[400px] mx-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
