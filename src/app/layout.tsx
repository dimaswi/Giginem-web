import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: seo } = await supabase
      .from("seo_settings")
      .select("*")
      .single();

    if (seo) {
      return {
        title: {
          default: seo.meta_title,
          template: `%s | ${seo.clinic_name}`,
        },
        description: seo.meta_description,
        keywords: seo.keywords ?? undefined,
        icons: {
          icon: seo.logo_url ?? "/favicon.ico",
          shortcut: seo.logo_url ?? "/favicon.ico",
          apple: seo.logo_url ?? "/favicon.ico",
        },
        openGraph: {
          title: seo.meta_title,
          description: seo.meta_description,
          images: seo.og_image ? [seo.og_image] : undefined,
          type: "website",
        },
      };
    }
  } catch {
    // Fallback metadata
  }

  return {
    title: {
      default: "Klinik - Layanan Kesehatan Terpercaya",
      template: "%s | Klinik",
    },
    description: "Klinik kesehatan modern dengan layanan dokter spesialis terpercaya.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
