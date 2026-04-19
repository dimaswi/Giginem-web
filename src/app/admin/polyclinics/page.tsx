"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Layout } from "lucide-react";

interface Polyclinic { id: string; name: string; description: string | null; }
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

const EMPTY_FORM = { name: "", description: "" };

export default function AdminPolyclinicsPage() {
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("polyclinics").select("*").order("name");
    if (data) setPolyclinics(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name) { toast.error("Nama poli wajib diisi!"); return; }
    setSaving(true);
    const payload = { name: form.name, description: form.description || null };
    let error;
    if (editingId) {
      ({ error } = await (supabase.from("polyclinics") as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await (supabase.from("polyclinics") as any).insert(payload));
    }
    if (error) toast.error("Gagal menyimpan");
    else { toast.success("Poli disimpan!"); setDialogOpen(false); load(); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("polyclinics").delete().eq("id", deleteId);
    if (error) toast.error("Gagal menghapus poli");
    else {
      toast.success("Poli dihapus");
      load();
    }
    setDeleting(false);
    setDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Poliklinik?"
        description="Apakah Anda yakin ingin menghapus poliklinik ini? Semua dokter dan jadwal yang ada di poli ini mungkin akan terpengaruh."
      />
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Manajemen Poliklinik</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true); }}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Poli
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-0 shadow-2xl">
                <DialogHeader className="px-6 pt-6 pb-4 bg-primary/5 border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">{editingId ? "Edit Poliklinik" : "Tambah Poliklinik"}</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Kelola unit layanan poliklinik Anda.</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="p-6 grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="poli-name" className="text-sm font-semibold">Nama Poliklinik *</Label>
                    <Input
                      id="poli-name"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Contoh: Poli Umum / Gigi"
                      className="h-11 bg-white border-border/60 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="poli-desc" className="text-sm font-semibold">Deskripsi Layanan</Label>
                    <Textarea
                      id="poli-desc"
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                      placeholder="Jelaskan secara singkat layanan di poli ini..."
                      className="bg-white border-border/60 focus:ring-primary/20 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-muted/50 border-t">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-10 px-6">Batal</Button>
                  <Button onClick={handleSave} disabled={saving} className="h-10 px-8 gap-2 shadow-lg shadow-primary/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {editingId ? "Simpan Perubahan" : "Buat Poliklinik"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-xs">Nama Poliklinik</TableHead>
                    <TableHead className="font-semibold text-xs hidden sm:table-cell">Deskripsi</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {polyclinics.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {p.description ?? <span className="italic opacity-40">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => { setEditingId(p.id); setForm({ name: p.name, description: p.description ?? "" }); setDialogOpen(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(p.id)}>
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
