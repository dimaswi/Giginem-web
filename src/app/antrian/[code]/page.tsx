import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle, Users, Stethoscope, RefreshCcw } from "lucide-react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ code: string }>;
}

const STATUS_CONFIG = {
  waiting: { label: "Menunggu", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock, desc: "Antrian Anda sedang menunggu dipanggil." },
  called: { label: "Dipanggil! 📣", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Users, desc: "Silakan segera menuju ruang periksa!" },
  in_progress: { label: "Sedang Diperiksa", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Stethoscope, desc: "Anda sedang dalam proses pemeriksaan." },
  done: { label: "Selesai ✓", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2, desc: "Kunjungan Anda telah selesai. Terima kasih!" },
  cancelled: { label: "Dibatalkan", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle, desc: "Antrian ini telah dibatalkan." },
};

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  return { title: `Status Antrian ${code}`, description: "Pantau status antrian Anda secara real-time." };
}

export default async function QueueStatusPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: queue } = await supabase.from("queues")
    .select(`*, doctors(name, specialization), polyclinics(name), services(name, duration)`)
    .eq("unique_code", code).single();

  if (!queue) return notFound();

  // Get all people ahead who are NOT done or cancelled
  const { data: aheadQueues } = await supabase.from("queues")
    .select("service_id, services(duration)")
    .eq("doctor_id", queue.doctor_id)
    .eq("queue_date", queue.queue_date)
    .in("status", ["waiting", "called", "in_progress"])
    .lt("queue_number", queue.queue_number);

  const aheadCount = aheadQueues?.length ?? 0;

  // Calculate estimation: Now + sum of durations of people ahead
  let totalMinutesAhead = 0;
  if (aheadQueues) {
    totalMinutesAhead = aheadQueues.reduce((acc: number, q: any) => acc + (q.services?.duration || 0), 0);
  }

  const now = new Date();
  const estTime = new Date(now.getTime() + totalMinutesAhead * 60000);
  const formattedEstTime = estTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

  const statusConfig = STATUS_CONFIG[queue.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const trackingUrl = `${appUrl}/antrian/${queue.unique_code}`;

  return (
    <div className="min-h-dvh bg-muted/30 flex flex-col items-center justify-start sm:justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-2 mb-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm">Status Antrian</span>
          </Link>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 rounded-2xl p-4 border-2 ${statusConfig.color}`}>
          <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-base">{statusConfig.label}</p>
            <p className="text-xs opacity-80 mt-0.5">{statusConfig.desc}</p>
          </div>
        </div>

        {/* Queue Number Card */}
        <Card className="border shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            {/* Number */}
            <div className="flex flex-col items-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Nomor Antrian Anda</p>
              <p className="text-8xl font-bold text-primary leading-tight mt-1">
                {String(queue.queue_number).padStart(3, "0")}
              </p>
              {queue.status === "waiting" && (
                <div className="mt-3 flex flex-col items-center gap-1 bg-yellow-50 border border-yellow-100 rounded-xl px-6 py-3">
                  <p className="text-3xl font-bold text-yellow-700">{aheadCount ?? 0}</p>
                  <p className="text-xs text-yellow-600 font-medium">antrian di depan Anda</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="w-full bg-muted/40 rounded-xl p-4 grid gap-2.5 text-sm">
              {[
                { label: "Pasien", value: queue.patient_name },
                { label: "Tindakan", value: (queue as any).services?.name || "Konsultasi" },
                { label: "Dokter", value: (queue as any).doctors?.name },
                { label: "Poli", value: (queue as any).polyclinics?.name },
                { label: "Estimasi Dilayani", value: queue.status === "waiting" ? formattedEstTime : "Sedang/Sudah Dilayani", bold: true },
                { label: "Tanggal", value: new Date(queue.queue_date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
              ].map(({ label, value, bold }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className={cn("text-right", bold ? "font-bold text-primary" : "font-medium")}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center gap-2 pt-1 border-t">
                <span className="text-muted-foreground">Kode</span>
                <code className="text-xs font-mono bg-background px-2 py-1 rounded-lg border">{queue.unique_code}</code>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground text-center">Tunjukkan QR ini kepada petugas klinik</p>
              <div className="p-3 bg-white border rounded-xl shadow-sm">
                <QRCode value={trackingUrl} size={140} />
              </div>
            </div>

            {/* Refresh button */}
            <Link
              href={trackingUrl}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-xl px-4 py-2.5 w-full justify-center hover:bg-muted"
            >
              <RefreshCcw className="w-4 h-4" />
              Perbarui Status Antrian
            </Link>
          </CardContent>
        </Card>

        <Link href="/" className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors">
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
