"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Globe, Building2, Phone, Users, Layout, Info } from "lucide-react";

interface SeoSettings {
  id: string;
  clinic_name: string;
  clinic_tagline: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  clinic_email: string | null;
  meta_title: string;
  meta_description: string;
  keywords: string | null;
  og_image: string | null;
  logo_url: string | null;
  stat_1_value: string | null;
  stat_1_label: string | null;
  stat_2_value: string | null;
  stat_2_label: string | null;
  stat_3_value: string | null;
  stat_3_label: string | null;
  stat_4_value?: string | null;
  stat_4_label?: string | null;
  stat_5_value?: string | null;
  stat_5_label?: string | null;
  hero_title?: string | null;
  hero_description?: string | null;
}

export default function SeoSettingsPage() {
  const [settings, setSettings] = useState<SeoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clinic_name: "",
    clinic_tagline: "",
    clinic_address: "",
    clinic_phone: "",
    clinic_email: "",
    meta_title: "",
    meta_description: "",
    keywords: "",
    og_image: "",
    logo_url: "",
    stat_1_value: "",
    stat_1_label: "",
    stat_2_value: "",
    stat_2_label: "",
    stat_3_value: "",
    stat_3_label: "",
    stat_4_value: "",
    stat_4_label: "",
    stat_5_value: "",
    stat_5_label: "",
    hero_title: "",
    hero_description: "",
  });

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await (supabase.from("seo_settings") as any).select("*").single();
      if (!error && data) {
        setSettings(data);
        setForm({
          clinic_name: data.clinic_name ?? "",
          clinic_tagline: data.clinic_tagline ?? "",
          clinic_address: data.clinic_address ?? "",
          clinic_phone: data.clinic_phone ?? "",
          clinic_email: data.clinic_email ?? "",
          meta_title: data.meta_title ?? "",
          meta_description: data.meta_description ?? "",
          keywords: data.keywords ?? "",
          og_image: data.og_image ?? "",
          logo_url: data.logo_url ?? "",
          stat_1_value: data.stat_1_value ?? "",
          stat_1_label: data.stat_1_label ?? "",
          stat_2_value: data.stat_2_value ?? "",
          stat_2_label: data.stat_2_label ?? "",
          stat_3_value: data.stat_3_value ?? "",
          stat_3_label: data.stat_3_label ?? "",
          stat_4_value: data.stat_4_value ?? "",
          stat_4_label: data.stat_4_label ?? "",
          stat_5_value: data.stat_5_value ?? "",
          stat_5_label: data.stat_5_label ?? "",
          hero_title: data.hero_title ?? "",
          hero_description: data.hero_description ?? "",
        });
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    
    const updatePayload: any = {
      ...form,
      clinic_tagline: form.clinic_tagline || null,
      clinic_address: form.clinic_address || null,
      clinic_phone: form.clinic_phone || null,
      clinic_email: form.clinic_email || null,
      keywords: form.keywords || null,
      og_image: form.og_image || null,
      logo_url: form.logo_url || null,
      stat_1_value: form.stat_1_value || null,
      stat_1_label: form.stat_1_label || null,
      stat_2_value: form.stat_2_value || null,
      stat_2_label: form.stat_2_label || null,
      stat_3_value: form.stat_3_value || null,
      stat_3_label: form.stat_3_label || null,
      stat_4_value: form.stat_4_value || null,
      stat_4_label: form.stat_4_label || null,
      stat_5_value: form.stat_5_value || null,
      stat_5_label: form.stat_5_label || null,
      hero_title: form.hero_title || null,
      hero_description: form.hero_description || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase
      .from("seo_settings") as any)
      .update(updatePayload)
      .eq("id", settings.id);

    if (error) {
      console.error(error);
      toast.error("Gagal menyimpan. Pastikan Anda sudah menjalankan SQL untuk menambah kolom baru.");
    } else {
      toast.success("Pengaturan berhasil disimpan!");
    }
    setSaving(false);
  }

  function handleChange(key: string, value: string) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Ukuran logo maksimal 1MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleChange("logo_url", event.target.result as string);
        toast.success("Logo berhasil dimuat (klik simpan untuk memperbarui)");
      }
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Website</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sesuaikan konten halaman utama dan informasi klinik Anda.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg shadow-primary/20 bg-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </Button>
      </div>

      <div className="grid gap-8">
        {/* Kustomisasi Hero Section */}
        <Card className="border shadow-md border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Layout className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Kustomisasi Hero (Halaman Utama)</CardTitle>
                <CardDescription className="text-xs">Ubah tulisan besar yang muncul di bagian paling atas website.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="bg-primary/10" />
          <CardContent className="pt-6 grid gap-6">
            <div className="grid gap-2">
              <Label className="font-bold">Judul Besar (Hero Title)</Label>
              <Input
                value={form.hero_title}
                onChange={(e) => handleChange("hero_title", e.target.value)}
                placeholder="Contoh: Kesehatan Anda, [Prioritas Kami]"
                className="bg-white"
              />
              <div className="flex items-start gap-2 mt-1 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  <strong>Tips:</strong> Gunakan kurung siku <strong>[teks]</strong> untuk memberikan warna gradien pada kata tertentu. 
                  Contoh: <code className="bg-blue-100 px-1 rounded">Kesehatan Anda, [Prioritas Kami]</code>
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-bold">Deskripsi (Hero Description)</Label>
              <Textarea
                value={form.hero_description}
                onChange={(e) => handleChange("hero_description", e.target.value)}
                placeholder="Tuliskan deskripsi lengkap di sini..."
                className="min-h-[100px] bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Identitas Klinik */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-base">Informasi Klinik & Kontak</CardTitle>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 grid gap-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nama Klinik</Label>
                <Input
                  value={form.clinic_name}
                  onChange={(e) => handleChange("clinic_name", e.target.value)}
                  placeholder="Contoh: Giginem Clinic"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tagline Utama</Label>
                <Input
                  value={form.clinic_tagline}
                  onChange={(e) => handleChange("clinic_tagline", e.target.value)}
                  placeholder="Contoh: Senyum Indah Setiap Hari"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Logo Klinik</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Globe className="w-6 h-6 text-muted-foreground opacity-20" />
                  )}
                </div>
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} className="h-9 text-xs" />
                  <p className="text-[10px] text-muted-foreground mt-1.5">Format PNG/JPG/SVG. Maks 1MB.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Alamat Lengkap</Label>
              <Textarea
                value={form.clinic_address}
                onChange={(e) => handleChange("clinic_address", e.target.value)}
                placeholder="Alamat klinik..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>WhatsApp (untuk tombol kontak)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={form.clinic_phone}
                    onChange={(e) => handleChange("clinic_phone", e.target.value)}
                    placeholder="62812345678"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  value={form.clinic_email}
                  onChange={(e) => handleChange("clinic_email", e.target.value)}
                  placeholder="kontak@klinik.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Statistics */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Data Statistik Hero</CardTitle>
                <CardDescription className="text-xs">Muncul di bawah judul besar. Kosongkan jika ingin disembunyikan.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 grid gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20 relative">
                <span className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {i}
                </span>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">Angka/Nilai</Label>
                  <Input
                    value={(form as any)[`stat_${i}_value`]}
                    onChange={(e) => handleChange(`stat_${i}_value`, e.target.value)}
                    placeholder="Contoh: 50+"
                    className="h-9 bg-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">Keterangan</Label>
                  <Input
                    value={(form as any)[`stat_${i}_label`]}
                    onChange={(e) => handleChange(`stat_${i}_label`, e.target.value)}
                    placeholder="Contoh: Dokter Spesialis"
                    className="h-9 bg-white"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-base">Optimasi SEO (Google Search)</CardTitle>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 grid gap-6">
            <div className="grid gap-2">
              <Label>Meta Title</Label>
              <Input
                value={form.meta_title}
                onChange={(e) => handleChange("meta_title", e.target.value)}
                placeholder="Judul website di Google..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Meta Description</Label>
              <Textarea
                value={form.meta_description}
                onChange={(e) => handleChange("meta_description", e.target.value)}
                placeholder="Deskripsi singkat website..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
