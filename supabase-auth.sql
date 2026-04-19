-- ============================================
-- ADD THIS TO SUPABASE SQL EDITOR
-- Admin Auth & Updated RLS Policies
-- ============================================

-- Drop old permissive policies first
DROP POLICY IF EXISTS "Admin all seo_settings" ON seo_settings;
DROP POLICY IF EXISTS "Admin all polyclinics" ON polyclinics;
DROP POLICY IF EXISTS "Admin all doctors" ON doctors;
DROP POLICY IF EXISTS "Admin all doctor_schedules" ON doctor_schedules;
DROP POLICY IF EXISTS "Admin update queues" ON queues;
DROP POLICY IF EXISTS "Admin delete queues" ON queues;

-- Re-create policies: only authenticated users (admin) can modify data
CREATE POLICY "Authenticated can manage seo_settings" ON seo_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage polyclinics" ON polyclinics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage doctors" ON doctors
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage doctor_schedules" ON doctor_schedules
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update queues" ON queues
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete queues" ON queues
  FOR DELETE USING (auth.role() = 'authenticated');

-- Note: To create an admin user, go to:
-- Supabase Dashboard > Authentication > Users > Add User
-- Then add their email and a strong password.
