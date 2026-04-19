"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, GraduationCap, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

interface Schedule {
  id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean;
}
interface Doctor {
  id: string; name: string; specialization: string; photo_url: string | null;
  polyclinic_id: string; doctor_schedules: Schedule[]; polyclinics: { name: string };
}
interface DoctorScheduleSectionProps { doctors: Doctor[]; }

function getInitials(name: string) {
  return name.split(" ").filter((n) => !n.toLowerCase().startsWith("dr") && !n.startsWith("Sp")).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || name[0].toUpperCase();
}

export default function DoctorScheduleSection({ doctors }: DoctorScheduleSectionProps) {
  if (!doctors || doctors.length === 0) return null;

  return (
    <section id="schedule" className="py-20 sm:py-28 bg-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-14 sm:mb-20">
          <Badge variant="outline" className="px-4 py-1.5 text-primary border-primary/20 bg-white shadow-sm text-sm font-semibold tracking-wide uppercase">
            Tim Medis Kami
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Jadwal <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Dokter Spesialis</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Dapatkan pelayanan kesehatan terbaik dari tim medis profesional kami yang berpengalaman dan berdedikasi tinggi.
          </p>
        </div>

        {/* Modern Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
              
              {/* Card Decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full transition-transform group-hover:scale-110" />

              {/* Profile Header */}
              <div className="flex items-start gap-4 mb-6 relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center border border-primary/10 shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
                    <span className="font-bold text-primary text-xl sm:text-2xl tracking-tight">
                      {getInitials(doctor.name)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                
                <div className="flex flex-col gap-1 min-w-0 pt-1">
                  <h3 className="font-bold text-lg sm:text-xl text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {doctor.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground font-medium">
                    <GraduationCap className="w-4 h-4 text-primary/70 shrink-0" />
                    <span className="truncate">{doctor.specialization}</span>
                  </div>
                </div>
              </div>

              {/* Poly & Info */}
              <div className="mb-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{doctor.polyclinics?.name}</span>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="mt-auto pt-5 border-t border-dashed border-border/70 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jadwal Praktek</h4>
                </div>
                
                {doctor.doctor_schedules?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {doctor.doctor_schedules.map((sched) => (
                      <div key={sched.id} className="flex flex-col items-center justify-center bg-muted/40 rounded-xl px-3 py-2 border border-border/50 min-w-[60px] group-hover:bg-muted/60 transition-colors">
                        <span className="text-xs font-black text-foreground mb-0.5">{DAYS[sched.day_of_week]}</span>
                        <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground font-medium">
                          <span>{sched.start_time.slice(0, 5)}</span>
                          <span className="mx-0.5">-</span>
                          <span>{sched.end_time.slice(0, 5)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl p-3 border border-dashed border-border/50">
                    <p className="text-xs text-muted-foreground italic text-center">Jadwal belum tersedia untuk saat ini</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <a href="#queue" className="mt-6 flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 active:bg-primary/15 border border-primary/10 transition-all relative z-10">
                Ambil Antrian
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
