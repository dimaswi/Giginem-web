"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Menu,
  Stethoscope,
  LogOut,
  ChevronRight,
  ExternalLink,
  UserCircle,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Manajemen Antrian", href: "/admin", icon: LayoutDashboard },
  { label: "Dokter", href: "/admin/doctors", icon: Stethoscope },
  { label: "Jadwal Dokter", href: "/admin/schedules", icon: Calendar },
  { label: "Poliklinik", href: "/admin/polyclinics", icon: Users },
  { label: "Tindakan & Estimasi", href: "/admin/services", icon: Activity },
  { label: "Pengaturan SEO", href: "/admin/settings", icon: Settings },
];

function SidebarContent({
  pathname,
  onNavClick,
  onLogout,
  logoUrl,
}: {
  pathname: string;
  onNavClick?: () => void;
  onLogout: () => void;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5">
        <Link
          href="/admin"
          onClick={onNavClick}
          className="flex items-center gap-2.5 font-bold text-lg text-primary"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain shrink-0" />
          ) : (
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
          )}
          <span>Admin Panel</span>
        </Link>
      </div>
      <Separator />
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary" />}
            </Link>
          );
        })}
      </nav>
      <Separator />
      {/* Footer actions */}
      <div className="p-3 flex flex-col gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ExternalLink className="w-5 h-5 shrink-0" />
          Lihat Website
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-all w-full text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Keluar
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogo() {
      try {
        const { data, error } = await (supabase.from("seo_settings") as any).select("logo_url").single();
        if (!error && data?.logo_url) setLogoUrl(data.logo_url);
      } catch (err) {
        console.error("Error loading logo:", err);
      }
    }
    loadLogo();
  }, []);

  const currentNav = navItems.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Anda telah keluar.");
    router.push("/admin/login");
  }

  // Don't show layout for login page
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="flex h-dvh bg-muted/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r shrink-0">
        <SidebarContent pathname={pathname} onLogout={handleLogout} logoUrl={logoUrl} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b flex items-center px-4 gap-3 shrink-0">
          {/* Mobile menu trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-xl w-10 h-10 hover:bg-muted transition-colors shrink-0">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 max-w-[85vw]">
              <SidebarContent
                pathname={pathname}
                onNavClick={() => setOpen(false)}
                onLogout={handleLogout}
                logoUrl={logoUrl}
              />
            </SheetContent>
          </Sheet>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted-foreground hidden sm:block shrink-0">Admin</span>
            {currentNav && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:block shrink-0" />
                <span className="font-semibold text-sm truncate">{currentNav.label}</span>
              </>
            )}
            {!currentNav && <span className="font-semibold text-sm truncate">Dashboard</span>}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-xl w-10 h-10 hover:bg-muted transition-colors shrink-0">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                render={
                  <Link href="/" target="_blank" className="gap-2" />
                }
              >
                <ExternalLink className="w-4 h-4" />
                Lihat Website
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <button onClick={handleLogout} className="gap-2 text-red-600" />
                }
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
