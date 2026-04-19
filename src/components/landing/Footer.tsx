"use client";

import { Stethoscope, MapPin, Phone, Mail } from "lucide-react";

interface FooterProps {
  clinicName?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function Footer({
  clinicName = "Klinik Sehat",
  address,
  phone,
  email,
}: FooterProps) {
  return (
    <footer id="contact" className="bg-foreground text-background py-14">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span>{clinicName}</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              Memberikan pelayanan kesehatan terbaik dengan penuh dedikasi dan profesionalisme.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4">
            <p className="font-semibold text-sm">Navigasi</p>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: "Beranda", href: "#hero" },
                { label: "Jadwal Dokter", href: "#schedule" },
                { label: "Ambil Antrian", href: "#queue" },
                { label: "Admin", href: "/admin" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <p className="font-semibold text-sm">Kontak Kami</p>
            <ul className="flex flex-col gap-3">
              {address && (
                <li className="flex items-start gap-2.5 text-sm text-background/60">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  {address}
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2.5 text-sm text-background/60">
                  <Phone className="w-4 h-4 shrink-0" />
                  {phone}
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2.5 text-sm text-background/60">
                  <Mail className="w-4 h-4 shrink-0" />
                  {email}
                </li>
              )}
              {!address && !phone && !email && (
                <li className="text-sm text-background/40 italic">
                  Info kontak belum diatur. Silakan atur di Admin Dashboard.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} {clinicName}. Hak cipta dilindungi.
          </p>
          <p className="text-xs text-background/40">
            Antrian Online & Company Profile by Giginem
          </p>
        </div>
      </div>
    </footer>
  );
}
