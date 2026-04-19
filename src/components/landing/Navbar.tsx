"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Stethoscope, X } from "lucide-react";

interface NavbarProps {
  clinicName?: string;
  logoUrl?: string;
}

const navLinks = [
  { label: "Beranda", href: "#hero" },
  { label: "Jadwal Dokter", href: "#schedule" },
  { label: "Layanan", href: "#services" },
  { label: "Kontak", href: "#contact" },
];

export default function Navbar({ clinicName = "Klinik Sehat", logoUrl }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/50">
      <nav className="container mx-auto max-w-6xl px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-primary shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={clinicName} className="w-8 h-8 object-contain shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="truncate max-w-[140px] sm:max-w-none">{clinicName}</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/admin">
            <Button variant="outline" size="sm">Admin</Button>
          </Link>
          <a href="#queue">
            <Button size="sm">Ambil Antrian</Button>
          </a>
        </div>

        {/* Mobile: Ambil Antrian button + Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <a href="#queue">
            <Button size="sm" className="h-9 text-xs px-3">Ambil Antrian</Button>
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex items-center justify-center rounded-lg w-9 h-9 hover:bg-muted transition-colors">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 max-w-[85vw] p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    {logoUrl ? (
                      <img src={logoUrl} alt={clinicName} className="w-7 h-7 object-contain shrink-0" />
                    ) : (
                      <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm">{clinicName}</span>
                  </div>
                </div>
                <nav className="flex flex-col p-4 gap-1 flex-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
                <div className="p-4 border-t flex flex-col gap-2">
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">Admin Dashboard</Button>
                  </Link>
                  <a href="#queue" onClick={() => setOpen(false)}>
                    <Button className="w-full">Ambil Antrian Sekarang</Button>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
