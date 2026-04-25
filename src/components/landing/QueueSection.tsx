"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, ChevronRight, Loader2, QrCode, Copy, MapPin, User, Stethoscope, ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import QRCode from "react-qr-code";
import { cn, getWIBDateString, getWIBDay } from "@/lib/utils";

const STEPS = ["Pilih Poli", "Pilih Dokter", "Pilih Hari", "Isi Data"];
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface Service { id: string; name: string; duration: number; polyclinic_id: string; }
interface Polyclinic { id: string; name: string; description?: string | null; }
interface Doctor { 
  id: string; name: string; specialization: string; polyclinic_id: string; 
  doctor_schedules?: { id: string; day_of_week: number; start_time: string; end_time: string; max_patients: number; is_active: boolean; }[];
}
interface QueueTicket {
  queue_number: number; unique_code: string; doctor_name: string;
  polyclinic_name: string; patient_name: string; queue_date: string;
  estimated_time?: string;
}

export default function QueueSection() {
  const [step, setStep] = useState(0);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPoli, setSelectedPoli] = useState<Polyclinic | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ day: number; date: string; schedule_id: string; start_time: string; end_time: string } | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", complaint: "" });
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<QueueTicket | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: "" });
  const [captchaInput, setCaptchaInput] = useState("");
  const [scheduleCapacities, setScheduleCapacities] = useState<Record<string, { usedMinutes: number; totalMinutes: number; queueCount: number }>>({});
  const [capacityLoading, setCapacityLoading] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1, num2, answer: (num1 + num2).toString() });
    setCaptchaInput("");
  };

  function timeToMinutes(t: string) { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (step === 3) generateCaptcha();
  }, [step]);

  async function loadData() {
    setDataLoading(true);
    const [poliRes, docRes, srvRes] = await Promise.all([
      supabase.from("polyclinics").select("*").order("name"),
      supabase.from("doctors").select("*, doctor_schedules(id, day_of_week, start_time, end_time, max_patients, is_active)").eq("is_active", true),
      supabase.from("services").select("*").eq("is_active", true).order("name"),
    ]);
    if (poliRes.data) setPolyclinics(poliRes.data);
    if (docRes.data) setDoctors(docRes.data as Doctor[]);
    if (srvRes.data) setServices(srvRes.data);
    setDataLoading(false);
  }

  function handleSelectPoli(poli: Polyclinic) {
    setSelectedPoli(poli);
    setFilteredDoctors(doctors.filter((d) => d.polyclinic_id === poli.id));
    setSelectedDoctor(null);
    setSelectedDate(null);
    setStep(1);
  }

  async function loadScheduleCapacities(doctor: Doctor) {
    if (!doctor.doctor_schedules) return;
    setCapacityLoading(true);
    const caps: Record<string, { usedMinutes: number; totalMinutes: number; queueCount: number }> = {};
    const activeScheds = doctor.doctor_schedules.filter(s => s.is_active);
    await Promise.all(activeScheds.map(async (sched) => {
      const dateStr = getNextDateForDay(sched.day_of_week);
      // Total kapasitas = selisih menit jam buka hingga jam tutup
      const totalMin = timeToMinutes(sched.end_time) - timeToMinutes(sched.start_time);
      // Hitung semua antrian non-cancelled (termasuk done) untuk kapasitas
      const { data: queues } = await supabase.from("queues")
        .select("services(duration)")
        .eq("schedule_id", sched.id).eq("queue_date", dateStr).neq("status", "cancelled");
      const usedMin = queues ? (queues as any[]).reduce((a: number, q: any) => a + (q.services?.duration || 15), 0) : 0;
      caps[`${sched.id}_${dateStr}`] = { usedMinutes: usedMin, totalMinutes: totalMin, queueCount: queues?.length ?? 0 };
    }));
    setScheduleCapacities(caps);
    setCapacityLoading(false);
  }

  function handleSelectSchedule(sched: Doctor["doctor_schedules"] extends (infer T)[] | undefined ? NonNullable<T> : never, dateString: string) {
    const capKey = `${sched.id}_${dateString}`;
    const cap = scheduleCapacities[capKey];
    const totalMin = timeToMinutes(sched.end_time) - timeToMinutes(sched.start_time);
    const isFull = cap && cap.usedMinutes >= totalMin;

    if (isFull) {
      // Jadwal penuh — tampilkan warning tapi jangan otomatis daftar, beri tahu user untuk pilih jadwal lain
      const nextDate = new Date(dateString + "T00:00:00+07:00");
      nextDate.setDate(nextDate.getDate() + 7);
      const nextDateStr = getWIBDateString(nextDate);
      const nextDayLabel = new Date(nextDateStr + "T00:00:00+07:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      toast.warning("⚠️ Jadwal Ini Sudah Penuh", {
        description: `Kapasitas jadwal ${DAYS[sched.day_of_week]} (${sched.start_time.slice(0,5)}-${sched.end_time.slice(0,5)}) sudah penuh. Jadwal berikutnya tersedia pada ${nextDayLabel}.`,
        duration: 7000,
      });
      // Tetap set ke jadwal minggu depan dan lanjut ke step 3 dengan info
      setSelectedDate({ day: sched.day_of_week, date: nextDateStr, schedule_id: sched.id, start_time: sched.start_time, end_time: sched.end_time });
    } else {
      setSelectedDate({ day: sched.day_of_week, date: dateString, schedule_id: sched.id, start_time: sched.start_time, end_time: sched.end_time });
    }
    setStep(3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoctor || !selectedPoli || !selectedDate) return;
    
    // Check if service is required (if any services exist for this poli)
    const poliServices = services.filter(s => s.polyclinic_id === selectedPoli.id);
    if (poliServices.length > 0 && !selectedService) {
      toast.error("Silakan pilih tindakan/layanan terlebih dahulu!");
      return;
    }

    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Nama dan nomor HP wajib diisi!");
      return;
    }
    if (captchaInput !== captcha.answer) {
      toast.error("Jawaban captcha salah! Silakan coba lagi.");
      generateCaptcha();
      return;
    }
    setLoading(true);
    try {
      const queueDate = selectedDate.date;
      const serviceDuration = selectedService?.duration || 15;

      // === STEP 1: Ambil semua antrian non-cancelled untuk jadwal ini ===
      // (digunakan untuk: cek kapasitas dan estimasi waktu)
      const { data: allQueuesForSchedule, error: fetchAllError } = await supabase
        .from("queues")
        .select("id, patient_name, patient_phone, status, services(duration)")
        .eq("schedule_id", selectedDate.schedule_id)
        .eq("queue_date", queueDate)
        .neq("status", "cancelled");

      if (fetchAllError) throw new Error(fetchAllError.message);

      const allQueues = (allQueuesForSchedule as any[]) ?? [];

      // Ambil MAX queue_number dari SEMUA antrian hari ini (termasuk cancelled)
      // agar pasien yang cancel bisa daftar ulang tanpa konflik nomor antrian
      const { data: allQueuesIncCancelled } = await supabase
        .from("queues")
        .select("queue_number")
        .eq("schedule_id", selectedDate.schedule_id)
        .eq("queue_date", queueDate)
        .order("queue_number", { ascending: false })
        .limit(1);
      const maxQueueNumber = (allQueuesIncCancelled as any[])?.[0]?.queue_number ?? 0;

      // === STEP 2: Cek kapasitas jadwal ===
      // Estimasi waktu SELALU dihitung dari jam buka praktek + total durasi semua antrian (non-cancelled)
      // PENTING: .slice(0,5) karena Supabase mengembalikan time sebagai "HH:MM:SS",
      // menambahkan ":00" langsung akan menghasilkan "T16:00:00:00+07:00" yang invalid.
      const practiceStart = new Date(`${queueDate}T${selectedDate.start_time.slice(0, 5)}:00+07:00`);
      const schedEnd = new Date(`${queueDate}T${selectedDate.end_time.slice(0, 5)}:00+07:00`);
      const totalUsedMinutes = allQueues.reduce((acc: number, q: any) => acc + (q.services?.duration || 15), 0);
      const newQueueEstStart = new Date(practiceStart.getTime() + totalUsedMinutes * 60000);
      const newQueueEstEnd = new Date(newQueueEstStart.getTime() + serviceDuration * 60000);

      if (newQueueEstEnd > schedEnd) {
        // Jadwal penuh — estimasi waktu selesai melebihi jam tutup
        const closingTime = schedEnd.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
        const nextWeekDate = new Date(queueDate + "T00:00:00+07:00");
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);
        const nextDayLabel = nextWeekDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        toast.warning("⚠️ Jadwal Sudah Penuh!", {
          description: `Estimasi layanan melewati jam tutup praktek (${closingTime} WIB). Silakan pilih jadwal lain atau daftar ke jadwal berikutnya: ${nextDayLabel}.`,
          duration: 8000,
        });
        // Kembalikan ke step pilih hari agar user bisa pilih jadwal lain
        setSelectedDate({ ...selectedDate, date: nextWeekDate.toISOString().slice(0, 10) });
        setLoading(false);
        setStep(2);
        return;
      }

      // === STEP 3: Cek duplikat pendaftar ===
      const cleanName = form.name.trim().toLowerCase().replace(/\s+/g, ' ');
      const cleanPhone = form.phone.replace(/\D/g, "").replace(/^0|^62/, "");

      const activeQueues = allQueues.filter(q => ["waiting", "called", "in_progress"].includes(q.status));
      const duplicate = activeQueues.find((q: any) => {
        const dbName = (q.patient_name || "").trim().toLowerCase().replace(/\s+/g, ' ');
        const dbPhone = (q.patient_phone || "").replace(/\D/g, "").replace(/^0|^62/, "");
        return dbName === cleanName || (dbPhone && dbPhone === cleanPhone);
      });

      if (duplicate) {
        toast.error("Pendaftaran Gagal", {
          description: "Data (Nama/Nomor WA) sudah terdaftar di antrian aktif dokter ini.",
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // === STEP 4: Tentukan nomor antrian dan estimasi waktu ===
      // Gunakan MAX queue_number (termasuk cancelled) + 1, bukan count,
      // agar tidak konflik saat pasien yang cancel daftar ulang.
      const nextNumber = maxQueueNumber + 1;
      
      // Estimasi waktu dilayani = jam buka praktek + total durasi antrian sebelumnya
      // (bukan dari waktu sekarang, agar konsisten)
      const formattedEstTime = newQueueEstStart.toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
      }) + " WIB";

      // === STEP 5: Insert antrian baru ===
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const uniqueCode = `${selectedDoctor.id.slice(0, 4).toUpperCase()}-${queueDate.replace(/-/g, "")}-${String(nextNumber).padStart(3, "0")}-${randomSuffix}`;
      
      const { data, error: insertError } = await (supabase.from("queues") as any).insert({
        doctor_id: selectedDoctor.id, 
        schedule_id: selectedDate.schedule_id,
        polyclinic_id: selectedPoli.id,
        service_id: selectedService?.id || null,
        patient_name: cleanName, 
        patient_phone: cleanPhone,
        complaint: form.complaint.trim() || null,
        queue_number: nextNumber, 
        unique_code: uniqueCode, 
        queue_date: queueDate, 
        status: "waiting",
      }).select().single();
      
      if (insertError) {
        console.error("Supabase Insert Error:", insertError);
        throw new Error(insertError.message);
      }

      setTicket({
        queue_number: data.queue_number, unique_code: data.unique_code,
        doctor_name: selectedDoctor.name, polyclinic_name: selectedPoli.name,
        patient_name: form.name.trim(), queue_date: queueDate,
        estimated_time: formattedEstTime,
      });
      setStep(4);
      setTicketDialogOpen(true);
      toast.success("Antrian berhasil dibuat!");
    } catch (err: any) {
      console.error("Detailed Error:", err);
      toast.error(`Gagal: ${err.message || "Silakan coba lagi"}`);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep(0); setSelectedPoli(null); setSelectedDoctor(null); setSelectedDate(null); setSelectedService(null);
    setFilteredDoctors([]); setForm({ name: "", phone: "", complaint: "" });
    setTicket(null); setTicketDialogOpen(false);
  }

  const trackingUrl = ticket ? `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}/antrian/${ticket.unique_code}` : "";
  const todayDay = getWIBDay();

  // Helper to calculate exact date for a given day_of_week
  function getNextDateForDay(targetDay: number) {
    const today = new Date();
    const currentDay = todayDay;
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7; // Get next occurrence

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    return getWIBDateString(targetDate);
  }

  return (
    <section id="queue" className="py-16 sm:py-24 bg-gradient-to-b from-white to-muted/20">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <Badge variant="outline" className="px-4 py-1.5 text-primary border-primary/20 bg-primary/5 shadow-sm text-sm font-semibold tracking-wide uppercase">
            Pendaftaran Antrian
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Langkah Mudah <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Berobat</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            Ikuti 3 langkah mudah untuk mendaftar antrian secara online tanpa perlu datang lebih awal.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 overflow-hidden">
          {/* Stepper Header */}
          <div className="bg-muted/30 px-4 sm:px-8 py-6 border-b border-border/50">
            <div className="flex items-center justify-between relative max-w-lg mx-auto">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-border/50 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-in-out"
                  style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
                />
              </div>

              {/* Steps */}
              {STEPS.map((s, i) => {
                const isActive = i === step;
                const isCompleted = i < step;
                return (
                  <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-muted/30 px-2">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm border-2",
                      isCompleted ? "bg-primary border-primary text-white scale-100"
                        : isActive ? "bg-white border-primary text-primary scale-110 shadow-md ring-4 ring-primary/10"
                          : "bg-white border-muted-foreground/30 text-muted-foreground scale-95"
                    )}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                    </div>
                    <span className={cn(
                      "text-[10px] sm:text-xs font-semibold uppercase tracking-wider hidden sm:block absolute -bottom-6 w-max text-center transition-colors",
                      isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-8 sm:pt-10 min-h-[400px]">
            {dataLoading ? (
              <div className="flex flex-col items-center justify-center h-[300px] gap-4 text-primary">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-sm font-medium animate-pulse text-muted-foreground">Menyiapkan data klinik...</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* STEP 0: Pilih Poli */}
                {step === 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Pilih Poliklinik
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">Silakan pilih poliklinik yang sesuai dengan keluhan Anda.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {polyclinics.map((poli) => (
                        <button key={poli.id} onClick={() => handleSelectPoli(poli)}
                          className="group relative flex flex-col items-start text-left p-5 rounded-2xl border-2 border-border/60 bg-white hover:border-primary hover:shadow-md hover:shadow-primary/5 active:scale-[0.98] transition-all overflow-hidden">
                          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                            <Stethoscope className="w-5 h-5 text-primary" />
                          </div>
                          <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors relative z-10">{poli.name}</p>
                          {poli.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 relative z-10">{poli.description}</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 1: Pilih Dokter */}
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          Pilih Dokter
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Pilih dokter yang tersedia di <strong className="text-foreground">{selectedPoli?.name}</strong>.</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                      </Button>
                    </div>

                    {filteredDoctors.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-muted-foreground bg-muted/20 border-2 border-dashed rounded-2xl">
                        <User className="w-10 h-10 opacity-20" />
                        <p className="text-sm font-medium text-center">Belum ada dokter yang terdaftar di poli ini.</p>
                        <Button variant="outline" size="sm" onClick={() => setStep(0)} className="mt-2">Pilih Poli Lain</Button>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {filteredDoctors.map((doctor) => {
                          const todaySchedule = doctor.doctor_schedules?.find((s) => s.day_of_week === todayDay && s.is_active);
                          return (
                            <button key={doctor.id} onClick={() => { setSelectedDoctor(doctor); loadScheduleCapacities(doctor); setStep(2); }}
                              className="group w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-border/60 bg-white hover:border-primary hover:shadow-md hover:shadow-primary/5 active:scale-[0.99] transition-all flex items-center gap-4">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/10 flex items-center justify-center shrink-0 border border-primary/10">
                                <span className="font-bold text-primary text-lg sm:text-xl">
                                  {doctor.name.split(" ").filter(n => !n.toLowerCase().includes("dr")).map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 flex-1 min-w-0">
                                <p className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors truncate">{doctor.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{doctor.specialization}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  {todaySchedule ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] sm:text-xs py-0 h-5">
                                      Praktek Hari Ini
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 text-[10px] sm:text-xs py-0 h-5">
                                      Tidak Praktek Hari Ini
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 shrink-0 transition-all" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Pilih Hari Kunjungan */}
                {step === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          Pilih Hari Kunjungan
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Pilih jadwal praktek <strong className="text-foreground">{selectedDoctor?.name}</strong>.</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali
                      </Button>
                    </div>

                    {(!selectedDoctor?.doctor_schedules || selectedDoctor.doctor_schedules.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-muted-foreground bg-muted/20 border-2 border-dashed rounded-2xl">
                        <Clock className="w-10 h-10 opacity-20" />
                        <p className="text-sm font-medium text-center">Jadwal dokter belum tersedia.</p>
                      </div>
                    ) : capacityLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-4 text-primary">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">Memeriksa ketersediaan jadwal...</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedDoctor.doctor_schedules.filter(s => s.is_active).sort((a, b) => a.day_of_week - b.day_of_week).map((sched, i) => {
                          const dateString = getNextDateForDay(sched.day_of_week);
                          const isToday = dateString === getWIBDateString();
                          const capKey = `${sched.id}_${dateString}`;
                          const cap = scheduleCapacities[capKey];
                          const totalMin = timeToMinutes(sched.end_time) - timeToMinutes(sched.start_time);
                          const remainingMin = cap ? totalMin - cap.usedMinutes : totalMin;
                          const isFull = cap ? remainingMin <= 0 : false;

                          return (
                            <button key={sched.id || i}
                              onClick={() => handleSelectSchedule(sched, dateString)}
                              className={cn(
                                "group w-full text-left p-5 rounded-2xl border-2 transition-all flex flex-col gap-2 relative overflow-hidden",
                                isFull
                                  ? "border-red-200 bg-red-50/50 hover:border-red-300"
                                  : "border-border/60 bg-white hover:border-primary hover:shadow-md hover:shadow-primary/5 active:scale-[0.98]"
                              )}
                            >
                              <div className={cn("absolute right-0 top-0 w-20 h-20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110", isFull ? "bg-gradient-to-bl from-red-500/5 to-transparent" : "bg-gradient-to-bl from-primary/5 to-transparent")} />

                              <div className="flex items-center justify-between relative z-10">
                                <span className={cn("font-bold text-lg transition-colors", isFull ? "text-muted-foreground" : "text-foreground group-hover:text-primary")}>
                                  Hari {DAYS[sched.day_of_week]}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {isToday && !isFull && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] py-0 h-5">
                                      Hari Ini
                                    </Badge>
                                  )}
                                  {isFull && (
                                    <Badge variant="secondary" className="bg-red-100 text-red-600 hover:bg-red-100 border-red-200 text-[10px] py-0 h-5 gap-1">
                                      <AlertTriangle className="w-3 h-3" /> PENUH
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground relative z-10 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {sched.start_time.slice(0, 5)} - {sched.end_time.slice(0, 5)} WIB
                              </p>
                              {cap && !isFull && (
                                <p className="text-[11px] text-green-600 font-medium relative z-10">✓ Sisa waktu: ±{remainingMin} menit ({cap.queueCount} antrian)</p>
                              )}
                              {isFull && (
                                <p className="text-[11px] text-red-500 font-medium relative z-10">Klik untuk daftar minggu depan →</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: Data Diri */}
                {step === 3 && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          📝 Lengkapi Data Anda
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Anda mendaftar ke <strong>{selectedDoctor?.name}</strong> untuk{" "}
                          <strong>
                            {selectedDate
                              ? new Date(selectedDate.date + "T00:00:00+07:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                              : ""}{" "}
                            ({selectedDate?.start_time.slice(0, 5)} - {selectedDate?.end_time.slice(0, 5)} WIB)
                          </strong>.
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground shrink-0">
                        <ArrowLeft className="w-3.5 h-3.5" /> Ganti Hari
                      </Button>
                    </div>

                    {/* Banner peringatan jika antrian digeser ke minggu depan */}
                    {selectedDate && selectedDate.date !== getNextDateForDay(selectedDate.day) && (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-amber-800">Jadwal Minggu Ini Sudah Penuh</p>
                          <p className="text-xs text-amber-700">
                            Anda akan didaftarkan ke jadwal berikutnya:{" "}
                            <strong>
                              {new Date(selectedDate.date + "T00:00:00+07:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                            </strong>.
                            Jika tidak ingin mendaftar ke jadwal ini, klik <strong>Ganti Hari</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2 sm:col-span-2">
                          <Label htmlFor="patient_name" className="text-sm font-semibold">Nama Lengkap Pasien <span className="text-red-500">*</span></Label>
                          <Input id="patient_name" placeholder="Sesuai KTP"
                            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="h-12 sm:h-14 px-4 text-base rounded-xl bg-muted/30 focus-visible:bg-white transition-colors" required />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                          <Label htmlFor="patient_phone" className="text-sm font-semibold">Nomor WhatsApp <span className="text-red-500">*</span></Label>
                          <Input id="patient_phone" placeholder="Contoh: 081234567890" type="tel"
                            value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            className="h-12 sm:h-14 px-4 text-base rounded-xl bg-muted/30 focus-visible:bg-white transition-colors" required />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                          <Label className="text-sm font-semibold">Tindakan / Keperluan <span className="text-red-500">*</span></Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {services
                              .filter(s => s.polyclinic_id === selectedPoli?.id)
                              .map((srv) => (
                                <button
                                  key={srv.id}
                                  type="button"
                                  onClick={() => setSelectedService(srv)}
                                  className={cn(
                                    "flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left",
                                    selectedService?.id === srv.id
                                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                      : "border-border/60 hover:border-primary/40 hover:bg-muted/50"
                                  )}
                                >
                                  <span className="text-sm font-bold">{srv.name}</span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" /> ± {srv.duration} Menit
                                  </span>
                                </button>
                              ))}
                          </div>
                          {services.filter(s => s.polyclinic_id === selectedPoli?.id).length === 0 && (
                            <p className="text-[10px] text-muted-foreground italic">Tidak ada pilihan tindakan khusus untuk poli ini.</p>
                          )}
                          {!selectedService && services.filter(s => s.polyclinic_id === selectedPoli?.id).length > 0 && (
                            <p className="text-[10px] text-red-500 mt-1">Silakan pilih salah satu tindakan.</p>
                          )}
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                          <Label htmlFor="complaint" className="text-sm font-semibold">Catatan Tambahan <span className="text-muted-foreground font-normal">(Opsional)</span></Label>
                          <Textarea id="complaint" placeholder="Berikan catatan tambahan jika diperlukan..."
                            value={form.complaint} onChange={(e) => setForm((f) => ({ ...f, complaint: e.target.value }))} rows={2}
                            className="resize-none p-4 text-base rounded-xl bg-muted/30 focus-visible:bg-white transition-colors" />
                        </div>

                        {/* MATH CAPTCHA */}
                        <div className="grid gap-3 sm:col-span-2 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-col gap-0.5">
                              <Label className="text-sm font-bold text-primary">Verifikasi Keamanan</Label>
                              <p className="text-[11px] text-muted-foreground">Selesaikan perhitungan untuk melanjutkan.</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-10 px-4 flex items-center justify-center bg-white border-2 border-primary/20 rounded-xl font-bold text-lg text-primary shadow-sm select-none">
                                {captcha.num1} + {captcha.num2} = ?
                              </div>
                              <Input 
                                type="number" 
                                placeholder="Jawab" 
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                className="w-24 h-10 text-center font-bold text-lg rounded-xl border-2 border-primary focus-visible:ring-primary/20"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button type="submit" size="lg" disabled={loading} className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                          {loading ? (<><Loader2 className="mr-3 h-5 w-5 animate-spin" />Memproses Pendaftaran...</>) : (
                            <>Konfirmasi & Ambil Antrian <ChevronRight className="ml-2 h-5 w-5" /></>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Data Anda aman dan terenkripsi.
                        </p>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Dialog */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="max-w-sm w-[90vw] sm:w-[400px] rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          {ticket && (
            <div className="flex flex-col">
              {/* Premium Header */}
              <div className="bg-gradient-to-br from-primary via-primary to-blue-600 px-6 py-5 sm:py-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <DialogTitle className="text-xl font-black tracking-tight text-white drop-shadow-md">
                    Antrian Berhasil!
                  </DialogTitle>
                  <p className="text-white/80 text-xs font-medium px-4">
                    Pendaftaran Anda telah tercatat
                  </p>
                </div>

                {/* Ticket Cutouts (Top half) */}
                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white rounded-full shadow-inner" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full shadow-inner" />
              </div>

              {/* Ticket Body */}
              <div className="bg-white px-5 py-5 sm:px-6 sm:py-6 relative">
                {/* Dashed line separator */}
                <div className="absolute top-0 left-4 right-4 border-t-2 border-dashed border-border/60" />

                <div className="flex flex-col items-center gap-4">
                  {/* Queue number */}
                  <div className="flex flex-col items-center gap-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Nomor Antrian Anda</p>
                    <div className="text-6xl font-black text-foreground leading-none tracking-tighter drop-shadow-sm mt-1">
                      {String(ticket.queue_number).padStart(3, "0")}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="w-full bg-muted/30 rounded-2xl p-4 border border-border/40 flex flex-col gap-2.5 shadow-sm">
                    {[
                      { label: "Pasien", value: ticket.patient_name, bold: true },
                      { label: "Dokter", value: ticket.doctor_name },
                      { label: "Poli", value: ticket.polyclinic_name },
                      { label: "Tanggal", value: new Date(ticket.queue_date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
                    ].map(({ label, value, bold }) => (
                      <div key={label} className="flex justify-between items-center gap-3">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
                        <span className={cn("text-xs text-right", bold ? "font-bold text-foreground" : "font-medium text-foreground/80")}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* QR Code Segment */}
                  <div className="w-full flex flex-col items-center gap-2">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-1.5">
                      <QrCode className="w-3 h-3" /> Scan untuk Status Real-time
                    </p>
                    <div className="p-2.5 bg-white border border-border/50 rounded-2xl shadow-sm ring-1 ring-black/5">
                      <QRCode value={trackingUrl} size={110} />
                    </div>
                    <div className="bg-muted/50 px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold tracking-[0.2em] text-foreground border border-border/50">
                      {ticket.unique_code}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full flex flex-col gap-2 mt-1">
                    <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-bold border-2 hover:bg-muted/50 transition-colors"
                      onClick={() => { navigator.clipboard.writeText(trackingUrl); toast.success("Link berhasil disalin!"); }}>
                      <Copy className="w-3.5 h-3.5 mr-2" /> Salin Link Tracking
                    </Button>
                    <Button className="w-full h-10 rounded-xl text-xs font-bold shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5" onClick={handleReset}>
                      Selesai
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
