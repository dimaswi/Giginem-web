"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  Search,
  PhoneCall,
  XCircle,
  Loader2,
  CalendarDays,
  MoreHorizontal,
  Stethoscope,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { getWIBDateString } from "@/lib/utils";

const STATUS_CONFIG = {
  waiting: { label: "Menunggu", badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  called: { label: "Dipanggil", badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  in_progress: { label: "Diperiksa", badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  done: { label: "Selesai", badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
  cancelled: { label: "Batal", badge: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

type QueueStatus = keyof typeof STATUS_CONFIG;

interface Queue {
  id: string;
  queue_number: number;
  unique_code: string;
  patient_name: string;
  patient_phone: string;
  complaint: string | null;
  status: QueueStatus;
  queue_date: string;
  created_at: string;
  called_at: string | null;
  doctors: { name: string; specialization: string } | null;
  doctor_schedules: { start_time: string; end_time: string } | null;
  polyclinics: { name: string } | null;
  services: { name: string; duration: number } | null;
}

interface Doctor {
  id: string;
  name: string;
}

export default function AdminQueuePage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getWIBDateString());
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [cancelId, setCancelId] = useState<string | null>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const loadQueues = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    let query = supabase
      .from("queues")
      .select(`*, doctors(name, specialization), doctor_schedules(start_time, end_time), polyclinics(name), services(name, duration)`)
      .eq("queue_date", selectedDate)
      .order("queue_number", { ascending: true });

    if (selectedDoctorFilter !== "all") query = query.eq("doctor_id", selectedDoctorFilter);
    if (selectedStatusFilter !== "all") query = query.eq("status", selectedStatusFilter);

    const { data, error } = await query;
    if (error) toast.error("Gagal memuat antrian");
    else setQueues((data as Queue[]) ?? []);

    setLoading(false);
    setRefreshing(false);
  }, [selectedDate, selectedDoctorFilter, selectedStatusFilter]);

  useEffect(() => {
    supabase.from("doctors").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setDoctors(data); });
  }, []);

  useEffect(() => { loadQueues(); }, [loadQueues]);

  async function updateStatus(id: string, status: QueueStatus) {
    setUpdatingId(id);
    const updateData: Record<string, string | null> = { status };
    if (status === "called") updateData.called_at = new Date().toISOString();
    if (status === "done") updateData.done_at = new Date().toISOString();

    if (status === "cancelled") {
      const qToCancel = queues.find((q) => q.id === id);
      if (qToCancel) {
        // Fetch from DB to be safe
        const { data: dbQueue } = await (supabase.from("queues") as any).select("doctor_id, schedule_id, queue_date, queue_number").eq("id", id).single();
        if (dbQueue && dbQueue.queue_number > 0) {
          // 1. Clear current queue number (set to 0) to avoid duplicates after shifting
          await (supabase.from("queues") as any).update({ queue_number: 0 }).eq("id", id);

          // 2. Shift others: No = No - 1 where No > currentNo
          let subQuery = (supabase.from("queues") as any)
            .select("id, queue_number")
            .eq("doctor_id", dbQueue.doctor_id)
            .eq("queue_date", dbQueue.queue_date)
            .gt("queue_number", dbQueue.queue_number);
          if (dbQueue.schedule_id) subQuery = subQuery.eq("schedule_id", dbQueue.schedule_id);
          const { data: subs } = await subQuery;
          if (subs) {
            await Promise.all((subs as any[]).map(s =>
              (supabase.from("queues") as any).update({ queue_number: s.queue_number - 1 }).eq("id", s.id)
            ));
          }
        }
      }
    }

    const { error } = await (supabase.from("queues") as any).update(updateData).eq("id", id);
    if (error) toast.error("Gagal memperbarui status");
    else {
      toast.success(`Status diperbarui: ${STATUS_CONFIG[status].label}`);
      loadQueues(true);
    }
    setUpdatingId(null);
    setCancelId(null);
  }

  function buildWAUrl(queue: Queue) {
    const phoneDigits = queue.patient_phone.replace(/\D/g, "");
    // Ensure it starts with 62. If it starts with 0, replace it. If it starts with 8, prepend 62.
    const phone = phoneDigits.startsWith("62")
      ? phoneDigits
      : phoneDigits.startsWith("0")
        ? phoneDigits.replace(/^0/, "62")
        : "62" + phoneDigits;

    const msg = encodeURIComponent(
      `Halo *${queue.patient_name}*, antrian Anda di *${queue.polyclinics?.name}* ` +
      `dengan dokter *${queue.doctors?.name}* sudah mendekati giliran.\n\n` +
      `📋 Nomor Antrian: *${String(queue.queue_number).padStart(3, "0")}*\n` +
      `🔗 Cek status: ${appUrl}/antrian/${queue.unique_code}\n\n` +
      `Mohon segera hadir di klinik. Terima kasih! 🏥`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  }

  const filteredQueues = queues.filter((q) =>
    q.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    q.unique_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <DeleteConfirmDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
        onConfirm={() => cancelId && updateStatus(cancelId, "cancelled")}
        loading={!!updatingId}
        title="Batalkan Antrian?"
        description="Apakah Anda yakin ingin membatalkan antrian ini? Pasien akan mendapatkan status 'Batal' di halaman tracking mereka."
      />
      <Card className="border shadow-sm">
        {/* ── Header ── */}
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <CardTitle className="text-base font-semibold">Daftar Antrian</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => loadQueues(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* ── Filter area ── */}
          <div className="flex flex-col gap-3 pb-4 border-b">
            {/* Row 1: Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau kode antrian..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Row 2: Date + Status (2 kolom) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 h-10 text-sm bg-white border-border/60 focus:ring-primary/20"
                />
              </div>
              <Select value={selectedStatusFilter} onValueChange={(v) => setSelectedStatusFilter(v || "all")}>
                <SelectTrigger className="h-10 text-sm bg-white border-border/60 focus:ring-primary/20">
                  <SelectValue placeholder="Semua Status">
                    {selectedStatusFilter === "all" ? "Semua Status" : STATUS_CONFIG[selectedStatusFilter as keyof typeof STATUS_CONFIG]?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="font-medium">Semua Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key} className="py-2">
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 3: Doctor filter (full width) */}
            <Select value={selectedDoctorFilter} onValueChange={(v) => setSelectedDoctorFilter(v || "all")}>
              <SelectTrigger className="h-10 text-sm w-full bg-white border-border/60 focus:ring-primary/20">
                <SelectValue placeholder="Semua Dokter">
                  {selectedDoctorFilter === "all" ? "Semua Dokter" : doctors.find(d => d.id === selectedDoctorFilter)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-medium">Semua Dokter</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="py-2">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* ── Content ── */}
        <CardContent className="px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Memuat antrian...</span>
            </div>
          ) : filteredQueues.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <Users className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">Tidak ada antrian</p>
              <p className="text-xs text-center max-w-[200px]">
                Belum ada antrian untuk tanggal & filter yang dipilih.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredQueues.map((queue) => {
                const cfg = STATUS_CONFIG[queue.status];
                const isUpdating = updatingId === queue.id;

                return (
                  <div
                    key={queue.id}
                    className={cn(
                      "border rounded-xl p-4 bg-white transition-all",
                      isUpdating && "opacity-50 pointer-events-none"
                    )}
                  >
                    {/* Top row: number + name + status + menu */}
                    <div className="flex items-start gap-3">
                      {/* Queue number badge */}
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-base font-bold text-primary leading-none">
                          {String(queue.queue_number).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Name + doctor + poli */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm leading-tight truncate">{queue.patient_name}</p>
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                            cfg.badge
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Stethoscope className="w-3 h-3 shrink-0" />
                          <span className="truncate">{queue.doctors?.name}</span>
                          <span className="opacity-40">·</span>
                          <span className="truncate">{queue.polyclinics?.name}</span>
                          {queue.doctor_schedules && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="truncate text-primary font-medium">{queue.doctor_schedules.start_time.slice(0, 5)} - {queue.doctor_schedules.end_time.slice(0, 5)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Dropdown menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 rounded-lg shrink-0")}>
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl">
                          <DropdownMenuItem>
                            <a
                              href={buildWAUrl(queue)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 px-2.5 py-2 text-green-600 cursor-pointer rounded-lg w-full"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Hubungi via WA</span>
                            </a>
                          </DropdownMenuItem>
                          {queue.status === "waiting" && (
                            <DropdownMenuItem
                              onClick={() => setCancelId(queue.id)}
                              className="flex items-center gap-2.5 px-2.5 py-2 text-red-500 cursor-pointer rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Batalkan</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Service & Complaint */}
                    <div className="mt-2.5 pl-14 flex flex-col gap-1.5">
                      {queue.services && (
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                          <Activity className="w-3.5 h-3.5" />
                          <span>{queue.services.name} ({queue.services.duration}m)</span>
                        </div>
                      )}
                      {queue.complaint && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 ml-0.5">
                          "{queue.complaint}"
                        </p>
                      )}
                    </div>

                    {/* Bottom row: time + action buttons */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(queue.created_at), "HH:mm", { locale: id })}
                        </span>
                        {queue.called_at && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <CheckCircle2 className="w-3 h-3" />
                            {format(new Date(queue.called_at), "HH:mm", { locale: id })}
                          </span>
                        )}
                        <span className="font-mono text-[10px] opacity-60">{queue.unique_code}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUpdating && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {!isUpdating && queue.status === "waiting" && (
                          <Button
                            size="sm"
                            className="h-8 px-3 gap-1.5 text-xs font-semibold"
                            onClick={() => updateStatus(queue.id, "called")}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            Panggil
                          </Button>
                        )}
                        {!isUpdating && (queue.status === "called" || queue.status === "in_progress") && (
                          <Button
                            size="sm"
                            className="h-8 px-3 gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700"
                            onClick={() => updateStatus(queue.id, "done")}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Selesai
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
