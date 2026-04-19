"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppFloatingProps {
  phone?: string;
  clinicName?: string;
}

export default function WhatsAppFloating({ phone, clinicName = "Klinik" }: WhatsAppFloatingProps) {
  if (!phone) return null;

  // Format phone to international format for WA link
  const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
  const message = encodeURIComponent(`Halo ${clinicName}, saya ingin bertanya mengenai layanan klinik.`);
  const waUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-[999] group animate-in fade-in slide-in-from-bottom-10 duration-700 delay-1000 fill-mode-both">
      {/* Pulse Effect */}
      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20 group-hover:opacity-0 transition-opacity" />
      
      {/* Label Tooltip */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-white rounded-xl shadow-xl border border-border opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 pointer-events-none whitespace-nowrap">
        <p className="text-sm font-bold text-foreground">Hubungi Kami</p>
        <p className="text-[10px] text-muted-foreground">Admin Online WhatsApp</p>
        {/* Triangle Arrow */}
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-white border-b-[6px] border-b-transparent" />
      </div>

      {/* Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] text-white shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-110 active:scale-95 group-hover:rotate-[360deg]"
        )}
      >
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
      </a>
    </div>
  );
}
