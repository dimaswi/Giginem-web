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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Loader2, Trash2, Stethoscope, Layout } from "lucide-react";

interface Polyclinic { id: string; name: string; }
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone_number: string | null;
  polyclinic_id: string;
  is_active: boolean;
  polyclinics: { name: string } | null;
}

import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

const EMPTY_FORM = { name: "", specialization: "", phone_number: "", polyclinic_id: "", is_active: "true" };

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [{ data: docs }, { data: polis }] = await Promise.all([
      supabase.from("doctors").select("*, polyclinics(name)").order("name"),
      supabase.from("polyclinics").select("*").order("name"),
    ]);
    if (docs) setDoctors(docs as Doctor[]);
    if (polis) setPolyclinics(polis);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(doc: Doctor) {
    setEditingId(doc.id);
    setForm({
      name: doc.name,
      specialization: doc.specialization,
      phone_number: doc.phone_number ?? "",
      polyclinic_id: doc.polyclinic_id,
      is_active: String(doc.is_active),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.specialization || !form.polyclinic_id) {
      toast.error("Nama, spesialisasi, dan poli wajib diisi!");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      specialization: form.specialization,
      phone_number: form.phone_number || null,
      polyclinic_id: form.polyclinic_id,
      is_active: form.is_active === "true",
    };

    let error;
    if (editingId) {
      ({ error } = await (supabase.from("doctors") as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await (supabase.from("doctors") as any).insert(payload));
    }

    if (error) toast.error("Gagal menyimpan dokter");
    else {
      toast.success(editingId ? "Data dokter diperbarui!" : "Dokter berhasil ditambahkan!");
      setDialogOpen(false);
      loadAll();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("doctors").delete().eq("id", deleteId);
    if (error) toast.error("Gagal menghapus dokter");
    else {
      toast.success("Dokter dihapus");
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
        title="Hapus Dokter?"
        description="Apakah Anda yakin ingin menghapus dokter ini? Semua jadwal dokter yang terkait juga akan terhapus secara permanen."
      />
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Daftar Dokter</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Dokter
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl">
                <DialogHeader className="px-6 pt-6 pb-4 bg-primary/5 border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">{editingId ? "Edit Data Dokter" : "Tambah Dokter Baru"}</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Lengkapi informasi dokter di bawah ini.</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="p-6 grid gap-5">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informasi Utama</Label>
                    <div className="grid gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="grid gap-2">
                        <Label htmlFor="doc-name">Nama Lengkap *</Label>
                        <Input
                          id="doc-name"
                          value={form.name}
                          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="dr. Nama Dokter, Sp.X"
                          className="bg-white border-border/60 focus:ring-primary/20"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="doc-spec">Spesialisasi *</Label>
                        <Input
                          id="doc-spec"
                          value={form.specialization}
                          onChange={(e) => setForm(f => ({ ...f, specialization: e.target.value }))}
                          placeholder="Dokter Umum / Sp. Anak"
                          className="bg-white border-border/60 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Penempatan & Kontak</Label>
                    <div className="grid gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold">Poliklinik Tujuan *</Label>
                        <Select
                          key={`poly-${editingId || 'new'}`}
                          value={form.polyclinic_id || undefined}
                          onValueChange={(v) => setForm(f => ({ ...f, polyclinic_id: v || "" }))}
                        >
                          <SelectTrigger className="bg-white border-border/60 focus:ring-primary/20 transition-all">
                            {polyclinics.find(p => p.id === form.polyclinic_id)?.name || <span className="text-muted-foreground">Pilih unit poliklinik...</span>}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {polyclinics.map(p => (
                              <SelectItem key={p.id} value={p.id} className="py-2.5">
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="doc-wa" className="text-sm font-semibold">Nomor WhatsApp (Aktif)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">+62</span>
                          <Input
                            id="doc-wa"
                            value={form.phone_number}
                            onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))}
                            placeholder="812345678"
                            className="h-11 pl-12 bg-white border-border/60 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status Kepegawaian</Label>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <Select
                        key={`status-${editingId || 'new'}`}
                        value={form.is_active}
                        onValueChange={(v) => setForm(f => ({ ...f, is_active: v || "true" }))}
                      >
                        <SelectTrigger className="bg-white border-border/60 focus:ring-primary/20 transition-all">
                          {form.is_active === "true" ? "Aktif Melayani Pasien" : "Sedang Tidak Aktif"}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="true" className="py-2.5 font-medium text-green-600">Aktif Melayani Pasien</SelectItem>
                          <SelectItem value="false" className="py-2.5 font-medium text-red-600">Sedang Tidak Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/50 border-t">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-10 px-6">Batal</Button>
                  <Button onClick={handleSave} disabled={saving} className="h-10 px-8 gap-2 shadow-lg shadow-primary/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {editingId ? "Perbarui Data" : "Simpan Dokter"}
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
                    <TableHead className="font-semibold text-xs">Nama Dokter</TableHead>
                    <TableHead className="font-semibold text-xs">Spesialisasi</TableHead>
                    <TableHead className="font-semibold text-xs hidden md:table-cell">Poli</TableHead>
                    <TableHead className="font-semibold text-xs hidden lg:table-cell">No. WA</TableHead>
                    <TableHead className="font-semibold text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.specialization}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs">{doc.polyclinics?.name}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground font-mono">
                        {doc.phone_number ?? <span className="italic opacity-50">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${doc.is_active ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-600 border-red-200"}`}>
                          {doc.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(doc)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(doc.id)}>
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
