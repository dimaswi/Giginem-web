"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, GraduationCap, MapPin, ChevronRight, CalendarDays } from "lucide-react";
import { cn, getWIBDay } from "@/lib/utils";

const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

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

/** Group schedules by day_of_week — each day can have multiple time slots */
function groupSchedulesByDay(schedules: Schedule[]) {
  const grouped: Record<number, Schedule[]> = {};
  for (const s of schedules) {
    if (!s.is_active) continue;
    if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
    grouped[s.day_of_week].push(s);
  }
  for (const day in grouped) {
    grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
  return grouped;
}

export default function DoctorScheduleSection({ doctors }: DoctorScheduleSectionProps) {
  if (!doctors || doctors.length === 0) return null;
  const todayDay = getWIBDay();

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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {doctors.map((doctor) => {
            const grouped = groupSchedulesByDay(doctor.doctor_schedules ?? []);
            const activeDays = Object.keys(grouped).map(Number).sort((a, b) => a - b);
            const totalSlots = Object.values(grouped).reduce((sum, slots) => sum + slots.length, 0);
            const hasTodaySchedule = activeDays.includes(todayDay);

            return (
              <div key={doctor.id} className="group relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">

                {/* Top accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary/60" />

                <div className="p-6 sm:p-8 pt-5 sm:pt-6 flex flex-col h-full">
                  {/* Card Decoration */}
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-primary/[0.03] to-transparent rounded-bl-full transition-transform group-hover:scale-125" />

                  {/* Profile Header */}
                  <div className="flex items-start gap-4 mb-5 relative z-10">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-blue-500/10 flex items-center justify-center border border-primary/10 shadow-sm overflow-hidden group-hover:shadow-md group-hover:from-primary/20 transition-all">
                        <span className="font-bold text-primary text-lg sm:text-xl tracking-tight">
                          {getInitials(doctor.name)}
                        </span>
                      </div>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-white rounded-full",
                        hasTodaySchedule ? "bg-green-500" : "bg-slate-300"
                      )} />
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0 pt-0.5">
                      <h3 className="font-bold text-base sm:text-lg text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {doctor.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span className="truncate">{doctor.specialization}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{doctor.polyclinics?.name}</span>
                        </div>
                        {hasTodaySchedule && (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-[10px] py-0 h-5 gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Hari Ini
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div className="mt-auto relative z-10">
                    <div className="flex items-center justify-between mb-3 pt-4 border-t border-dashed border-border/60">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Jadwal Praktek</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
                        {activeDays.length} hari · {totalSlots} sesi
                      </span>
                    </div>

                    {activeDays.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {activeDays.map((day) => {
                          const slots = grouped[day];
                          const isToday = day === todayDay;
                          return (
                            <div
                              key={day}
                              className={cn(
                                "flex items-center gap-2 rounded-xl px-3 py-2 transition-colors",
                                isToday
                                  ? "bg-primary/[0.06] border border-primary/15"
                                  : "bg-muted/30 border border-transparent hover:bg-muted/50"
                              )}
                            >
                              {/* Day label */}
                              <span className={cn(
                                "w-10 text-xs font-black shrink-0",
                                isToday ? "text-primary" : "text-foreground/80"
                              )}>
                                {DAYS_SHORT[day]}
                              </span>

                              {/* Time slots */}
                              <div className="flex flex-wrap gap-1 flex-1">
                                {slots.map((s, idx) => (
                                  <span
                                    key={s.id || idx}
                                    className={cn(
                                      "inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md",
                                      isToday
                                        ? "bg-primary/10 text-primary"
                                        : "bg-white text-muted-foreground border border-border/50"
                                    )}
                                  >
                                    <Clock className="w-3 h-3 mr-1 opacity-60" />
                                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                                  </span>
                                ))}
                              </div>

                              {/* Multi-session indicator */}
                              {slots.length > 1 && (
                                <span className={cn(
                                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                                  isToday ? "bg-primary/15 text-primary" : "bg-blue-50 text-blue-600 border border-blue-100"
                                )}>
                                  {slots.length}x
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-xl p-3 border border-dashed border-border/50">
                        <p className="text-xs text-muted-foreground italic text-center">Jadwal belum tersedia untuk saat ini</p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <a href="#queue" className="mt-5 flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 active:scale-[0.98] shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all relative z-10">
                    Ambil Antrian
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
