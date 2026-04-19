import { createServerSupabaseClient } from "@/lib/supabase-server";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import DoctorScheduleSection from "@/components/landing/DoctorScheduleSection";
import QueueSection from "@/components/landing/QueueSection";
import Footer from "@/components/landing/Footer";
import WhatsAppFloating from "@/components/landing/WhatsAppFloating";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: seo }, { data: doctors }, { count: totalQueueToday }] =
    await Promise.all([
      supabase.from("seo_settings").select("*").single(),
      supabase
        .from("doctors")
        .select("*, doctor_schedules(id, day_of_week, start_time, end_time, is_active), polyclinics(name)")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("queues")
        .select("*", { count: "exact", head: true })
        .eq("queue_date", new Date().toISOString().split("T")[0])
        .neq("status", "cancelled"),
    ]);

  const heroStats = [
    { value: seo?.stat_1_value, label: seo?.stat_1_label },
    { value: seo?.stat_2_value, label: seo?.stat_2_label },
    { value: seo?.stat_3_value, label: seo?.stat_3_label },
    { value: (seo as any)?.stat_4_value, label: (seo as any)?.stat_4_label },
    { value: (seo as any)?.stat_5_value, label: (seo as any)?.stat_5_label },
  ];

  return (
    <main className="min-h-screen">
      <Navbar clinicName={seo?.clinic_name} logoUrl={seo?.logo_url ?? undefined} />
      <HeroSection
        clinicName={seo?.clinic_name}
        tagline={seo?.clinic_tagline ?? undefined}
        heroTitle={(seo as any)?.hero_title}
        heroDescription={(seo as any)?.hero_description}
        totalQueueToday={totalQueueToday ?? 0}
        stats={heroStats}
      />
      <DoctorScheduleSection doctors={(doctors as any) ?? []} />
      <QueueSection />
      <Footer
        clinicName={seo?.clinic_name}
        address={seo?.clinic_address ?? undefined}
        phone={seo?.clinic_phone ?? undefined}
        email={seo?.clinic_email ?? undefined}
      />
      <WhatsAppFloating phone={seo?.clinic_phone ?? undefined} clinicName={seo?.clinic_name} />
    </main>
  );
}
