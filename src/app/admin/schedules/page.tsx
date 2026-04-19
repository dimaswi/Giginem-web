"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Clock } from "lucide-react";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface Doctor { id: string; name: string; }
interface Schedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
  doctors: { name: string } | null;
}

import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

const EMPTY_FORM = {
  doctor_id: "", day_of_week: "1", start_time: "08:00", end_time: "12:00",
  max_patients: "30", is_active: "true",
};

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [{ data: scheds }, { data: docs }] = await Promise.all([
      supabase.from("doctor_schedules").select("*, doctors(name)").order("day_of_week"),
      supabase.from("doctors").select("id, name").eq("is_active", true).order("name"),
    ]);
    if (scheds) setSchedules(scheds as Schedule[]);
    if (docs) setDoctors(docs);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function openAdd() { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true); }
  function openEdit(s: Schedule) {
    setEditingId(s.id);
    setForm({
      doctor_id: s.doctor_id, day_of_week: String(s.day_of_week),
      start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5),
      max_patients: String(s.max_patients), is_active: String(s.is_active),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.doctor_id) { toast.error("Pilih dokter terlebih dahulu!"); return; }
    setSaving(true);
    const payload = {
      doctor_id: form.doctor_id, day_of_week: parseInt(form.day_of_week),
      start_time: form.start_time, end_time: form.end_time,
      max_patients: parseInt(form.max_patients), is_active: form.is_active === "true",
    };
    let error;
    if (editingId) {
      ({ error } = await (supabase.from("doctor_schedules") as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await (supabase.from("doctor_schedules") as any).insert(payload));
    }
    if (error) toast.error("Gagal menyimpan jadwal");
    else { toast.success("Jadwal disimpan!"); setDialogOpen(false); loadAll(); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("doctor_schedules").delete().eq("id", deleteId);
    if (error) toast.error("Gagal menghapus jadwal");
    else {
      toast.success("Jadwal dihapus");
      loadAll();
    }
    setDeleting(false);
    setDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Jadwal?"
        description="Apakah Anda yakin ingin menghapus jadwal praktek ini? Tindakan ini tidak dapat dibatalkan."
      />
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Jadwal Dokter</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Jadwal
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl">
                <DialogHeader className="px-6 pt-6 pb-4 bg-primary/5 border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">{editingId ? "Edit Jadwal Dokter" : "Tambah Jadwal Baru"}</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Atur waktu praktek dokter spesialis.</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="p-6 grid gap-5">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dokter & Hari</Label>
                    <div className="grid gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold">Pilih Dokter *</Label>
                        <Select 
                          key={`doc-${editingId || 'new'}`}
                          value={form.doctor_id || undefined} 
                          onValueChange={(v) => setForm(f => ({ ...f, doctor_id: v || "" }))}
                        >
                          <SelectTrigger className="bg-white border-border/60 focus:ring-primary/20 transition-all">
                            {doctors.find(d => d.id === form.doctor_id)?.name || <span className="text-muted-foreground">Cari dokter spesialis...</span>}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {doctors.map(d => (
                              <SelectItem key={d.id} value={d.id} className="py-2.5">
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold">Hari Praktek *</Label>
                        <Select 
                          key={`day-${editingId || 'new'}`}
                          value={form.day_of_week} 
                          onValueChange={(v) => setForm(f => ({ ...f, day_of_week: v || "0" }))}
                        >
                          <SelectTrigger className="bg-white border-border/60 focus:ring-primary/20 transition-all">
                            {DAYS[Number(form.day_of_week)] || <span className="text-muted-foreground">Pilih hari...</span>}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {DAYS.map((d, i) => (
                              <SelectItem key={i} value={String(i)} className="py-2.5 font-medium">
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Waktu & Kapasitas</Label>
                    <div className="grid gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label className="text-xs font-semibold">Jam Mulai</Label>
                          <Input type="time" value={form.start_time} onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))} className="bg-white border-border/60" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs font-semibold">Jam Selesai</Label>
                          <Input type="time" value={form.end_time} onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))} className="bg-white border-border/60" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold">Maksimal Pasien per Sesi</Label>
                        <Input type="number" value={form.max_patients} onChange={(e) => setForm(f => ({ ...f, max_patients: e.target.value }))} min={1} className="bg-white border-border/60" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status Jadwal</Label>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <Select 
                        key={`status-${editingId || 'new'}`}
                        value={form.is_active} 
                        onValueChange={(v) => setForm(f => ({ ...f, is_active: v || "true" }))}
                      >
                        <SelectTrigger className="bg-white border-border/60 focus:ring-primary/20 transition-all">
                          {form.is_active === "true" ? "Jadwal Praktek Aktif" : "Jadwal Libur/Tutup"}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="true" className="py-2.5 font-medium text-green-600">Jadwal Praktek Aktif</SelectItem>
                          <SelectItem value="false" className="py-2.5 font-medium text-red-600">Jadwal Libur/Tutup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/50 border-t">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-10 px-6">Batal</Button>
                  <Button onClick={handleSave} disabled={saving} className="h-10 px-8 gap-2 shadow-lg shadow-primary/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {editingId ? "Perbarui Jadwal" : "Simpan Jadwal"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-xs">Dokter</TableHead>
                    <TableHead className="font-semibold text-xs">Hari</TableHead>
                    <TableHead className="font-semibold text-xs">Jam</TableHead>
                    <TableHead className="font-semibold text-xs hidden sm:table-cell">Maks. Pasien</TableHead>
                    <TableHead className="font-semibold text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm">{s.doctors?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{DAYS[s.day_of_week]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {s.max_patients} pasien
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${s.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-600 border-red-200"}`}>
                          {s.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => openEdit(s)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(s.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
