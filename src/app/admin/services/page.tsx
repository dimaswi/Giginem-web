"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Loader2, Trash2, Activity, Clock } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

interface Polyclinic { id: string; name: string; }
interface Service {
  id: string;
  name: string;
  duration: number;
  is_active: boolean;
  polyclinic_id: string;
  polyclinics: { name: string } | null;
}

const EMPTY_FORM = { name: "", duration: "30", is_active: "true", polyclinic_id: "" };

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    setLoading(true);
    const [srvRes, poliRes] = await Promise.all([
      supabase.from("services").select("*, polyclinics(name)").order("name"),
      supabase.from("polyclinics").select("*").order("name"),
    ]);
    if (srvRes.data) setServices(srvRes.data as Service[]);
    if (poliRes.data) setPolyclinics(poliRes.data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(srv: Service) {
    setEditingId(srv.id);
    setForm({
      name: srv.name,
      duration: String(srv.duration),
      is_active: String(srv.is_active),
      polyclinic_id: srv.polyclinic_id,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.duration || !form.polyclinic_id) {
      toast.error("Nama, durasi, dan poli wajib diisi!");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      duration: parseInt(form.duration),
      is_active: form.is_active === "true",
      polyclinic_id: form.polyclinic_id,
    };

    let error;
    if (editingId) {
      ({ error } = await (supabase.from("services") as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await (supabase.from("services") as any).insert(payload));
    }

    if (error) toast.error("Gagal menyimpan layanan");
    else {
      toast.success(editingId ? "Layanan diperbarui!" : "Layanan ditambahkan!");
      setDialogOpen(false);
      loadData();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("services").delete().eq("id", deleteId);
    if (error) toast.error("Gagal menghapus layanan");
    else {
      toast.success("Layanan dihapus");
      loadData();
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
        title="Hapus Layanan/Tindakan?"
        description="Apakah Anda yakin ingin menghapus tindakan ini? Pasien tidak akan bisa memilih tindakan ini lagi."
      />
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Daftar Tindakan & Estimasi Waktu</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Tindakan
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0 shadow-2xl">
                <DialogHeader className="px-6 pt-6 pb-4 bg-primary/5 border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">{editingId ? "Edit Tindakan" : "Tambah Tindakan"}</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Tentukan nama tindakan dan estimasi durasi layanan.</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="p-6 grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="srv-name">Nama Tindakan *</Label>
                    <Input
                      id="srv-name"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Contoh: Pembersihan Karang Gigi"
                      className="bg-white border-border/60 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Unit Poliklinik *</Label>
                    <Select
                      value={form.polyclinic_id}
                      onValueChange={(v) => setForm(f => ({ ...f, polyclinic_id: v || "" }))}
                    >
                      <SelectTrigger className="bg-white border-border/60 focus:ring-primary/20 transition-all">
                        {polyclinics.find(p => p.id === form.polyclinic_id)?.name || <span className="text-muted-foreground">Pilih unit...</span>}
                      </SelectTrigger>
                      <SelectContent>
                        {polyclinics.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="srv-dur">Estimasi Durasi (Menit) *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="srv-dur"
                        type="number"
                        value={form.duration}
                        onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))}
                        className="pl-10 bg-white border-border/60 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={form.is_active}
                      onValueChange={(v) => setForm(f => ({ ...f, is_active: v || "true" }))}
                    >
                      <SelectTrigger className="bg-white border-border/60 focus:ring-primary/20">
                        {form.is_active === "true" ? "Aktif" : "Nonaktif"}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/50 border-t">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-10 px-6">Batal</Button>
                  <Button onClick={handleSave} disabled={saving} className="h-10 px-8 gap-2 shadow-lg shadow-primary/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {editingId ? "Perbarui" : "Simpan"}
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
              <span className="text-sm">Memuat...</span>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-xs">Nama Tindakan</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Unit Poliklinik</TableHead>
                    <TableHead className="font-semibold text-xs">Estimasi Waktu</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((srv) => (
                    <TableRow key={srv.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm">{srv.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">{srv.polyclinics?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{srv.duration} Menit</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${srv.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-600 border-red-200"}`}>
                          {srv.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(srv)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(srv.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {services.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Belum ada data tindakan.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

