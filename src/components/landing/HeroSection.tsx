"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Clock, Shield } from "lucide-react";

interface StatItem {
  value?: string | null;
  label?: string | null;
}

interface HeroSectionProps {
  clinicName?: string;
  tagline?: string;
  heroTitle?: string | null;
  heroDescription?: string | null;
  totalQueueToday?: number;
  stats?: StatItem[];
}

export default function HeroSection({
  clinicName = "Klinik Sehat",
  tagline = "Layanan Kesehatan Terpercaya",
  heroTitle,
  heroDescription,
  totalQueueToday = 0,
  stats = [],
}: HeroSectionProps) {
  // Only show stats that have BOTH value and label filled
  const activeStats = stats.filter((s) => s?.value && s?.label);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-white"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-20 sm:-right-32 w-72 sm:w-[500px] h-72 sm:h-[500px] opacity-[0.08] animate-blob rounded-full"
          style={{ background: "linear-gradient(135deg, oklch(0.5 0.2 250), oklch(0.6 0.2 200))" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-56 sm:w-96 h-56 sm:h-96 opacity-[0.05] animate-blob rounded-full"
          style={{ background: "linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.6 0.2 250))", animationDelay: "3s" }}
        />
      </div>

      <div className="container mx-auto max-w-6xl px-4 pt-16 sm:pt-20 pb-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center min-h-[calc(100vh-4rem)]">
          {/* Left: Text Content */}
          <div className="flex flex-col gap-5 pt-4 lg:pt-0">
            <Badge variant="secondary" className="w-fit text-primary border-primary/20 bg-primary/5 text-xs">
              ✦ Layanan Kesehatan Modern
            </Badge>

            <div className="flex flex-col gap-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-foreground tracking-tight whitespace-pre-line">
                {heroTitle ? (
                  heroTitle.split(/(\[.*?\])/).map((part, index) => {
                    if (part.startsWith("[") && part.endsWith("]")) {
                      return (
                        <span key={index} className="gradient-text">
                          {part.slice(1, -1)}
                        </span>
                      );
                    }
                    return part;
                  })
                ) : (
                  <>
                    Kesehatan Anda,{" "}
                    <span className="gradient-text">Prioritas Kami</span>
                  </>
                )}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                {heroDescription || (
                  <>
                    {tagline}. Dapatkan pelayanan terbaik dari dokter-dokter
                    berpengalaman kami. Daftar antrian online dan hemat waktu Anda.
                  </>
                )}
              </p>
            </div>

            {/* Stats — dynamic, only render if there are active stats */}
            {activeStats.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-3 py-1">
                {activeStats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-4">
                    {i > 0 && <div className="w-px h-8 bg-border" />}
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-primary leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#queue" className="flex-1 sm:flex-none">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20 text-base h-12">
                  Ambil Antrian Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#schedule" className="flex-1 sm:flex-none">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12">
                  Jadwal Dokter
                </Button>
              </a>
            </div>

            {/* Live queue badge */}
            {totalQueueToday > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>
                  <strong className="text-foreground">{totalQueueToday}</strong> antrian aktif hari ini
                </span>
              </div>
            )}
          </div>

          {/* Right: Visual - hidden on mobile, shown on lg */}
          <div className="hidden lg:flex relative items-center justify-center">
            <div
              className="relative w-[400px] h-[400px] animate-float"
              style={{
                borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
                background: "linear-gradient(135deg, oklch(0.5 0.2 250 / 0.10), oklch(0.6 0.2 200 / 0.07))",
                border: "1px solid oklch(0.5 0.2 250 / 0.15)",
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-12 h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M32 8 C20 8 10 18 10 30 C10 44 22 56 32 58 C42 56 54 44 54 30 C54 18 44 8 32 8Z" />
                    <path d="M32 20 L32 44 M20 32 L44 32" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-5xl font-bold text-primary">{totalQueueToday > 0 ? totalQueueToday : "--"}</p>
                  <p className="text-sm text-muted-foreground mt-1">Pasien Hari Ini</p>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute top-4 -left-4 bg-white rounded-2xl shadow-lg shadow-black/5 border p-3 flex items-center gap-3 animate-float" style={{ animationDelay: "1s" }}>
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Antrian Online</p>
                <p className="font-bold text-sm">Mudah &amp; Cepat</p>
              </div>
            </div>
            <div className="absolute bottom-8 -right-4 bg-white rounded-2xl shadow-lg shadow-black/5 border p-3 flex items-center gap-3 animate-float" style={{ animationDelay: "2s" }}>
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimasi Waktu</p>
                <p className="font-bold text-sm">Real-time</p>
              </div>
            </div>
            <div className="absolute -bottom-2 left-0 bg-white rounded-2xl shadow-lg shadow-black/5 border p-3 flex items-center gap-3 animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">QR Code</p>
                <p className="font-bold text-sm">Aman &amp; Terenkripsi</p>
              </div>
            </div>
          </div>

          {/* Mobile: Mini feature cards instead of big blob */}
          <div className="flex lg:hidden gap-3">
            {[
              { icon: Users, color: "bg-green-100 text-green-600", label: "Antrian Online", desc: "Mudah & Cepat" },
              { icon: Clock, color: "bg-blue-100 text-blue-600", label: "Status Real-time", desc: "Pantau kapanpun" },
              { icon: Shield, color: "bg-purple-100 text-purple-600", label: "QR Code", desc: "Aman & Terenkripsi" },
            ].map((item) => (
              <div key={item.label} className="flex-1 bg-muted/50 rounded-2xl p-3 flex flex-col gap-2">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
