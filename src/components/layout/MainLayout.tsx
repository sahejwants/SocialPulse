import { ReactNode } from "react";
import Head from "next/head";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  fullWidth?: boolean;
  hideFooter?: boolean;
}

export function MainLayout({
  children,
  title,
  description,
  fullWidth = false,
  hideFooter = false,
}: MainLayoutProps) {
  const pageTitle = title ? `${title} — SocialPulse` : "SocialPulse — Raise Awareness, Drive Change";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:title" content={pageTitle} />
        {description && <meta property="og:description" content={description} />}
      </Head>

      <div className="flex flex-col min-h-screen bg-[#FAFAF7]">
        <Navbar />
        {/* Top padding to account for fixed navbar */}
        <main className={`flex-1 pt-16 ${fullWidth ? "" : ""}`}>
          {children}
        </main>
        {!hideFooter && <Footer />}
      </div>
    </>
  );
}
