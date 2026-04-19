"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Stethoscope, Eye, EyeOff, Lock } from "lucide-react";

import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    (supabase.from("seo_settings") as any).select("logo_url").single().then(({ data }: any) => {
      if (data?.logo_url) setLogoUrl(data.logo_url);
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi!");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Login gagal: " + (error.message === "Invalid login credentials" ? "Email atau password salah." : error.message));
      setLoading(false);
      return;
    }
    toast.success("Login berhasil! Mengalihkan...");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 opacity-[0.06] rounded-full"
          style={{ background: "linear-gradient(135deg, oklch(0.5 0.2 250), oklch(0.6 0.2 200))" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 opacity-[0.04] rounded-full"
          style={{ background: "linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.6 0.2 250))" }}
        />
      </div>

      <div className="relative w-full max-w-sm flex flex-col gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain drop-shadow-sm" />
          ) : (
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Masuk untuk mengelola antrian klinik
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Admin
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@klinik.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11 text-base"
                required
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 text-base pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full h-11 text-base font-semibold gap-2 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Masuk ke Dashboard
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Back to landing */}
        <p className="text-center text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors underline underline-offset-4">
            ← Kembali ke Website Klinik
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
