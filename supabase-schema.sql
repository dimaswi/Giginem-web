-- ============================================
-- GIGINEM CLINIC - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: seo_settings
-- ============================================
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_name TEXT NOT NULL DEFAULT 'Giginem Clinic',
  clinic_tagline TEXT DEFAULT 'Layanan Kesehatan Terpercaya',
  clinic_address TEXT,
  clinic_phone TEXT,
  clinic_email TEXT,
  meta_title TEXT NOT NULL DEFAULT 'Giginem Clinic - Layanan Kesehatan Terpercaya',
  meta_description TEXT NOT NULL DEFAULT 'Klinik kesehatan modern dengan layanan dokter spesialis terpercaya.',
  keywords TEXT,
  og_image TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default SEO settings
INSERT INTO seo_settings (clinic_name, meta_title, meta_description)
VALUES ('Giginem Clinic', 'Giginem Clinic - Layanan Kesehatan Terpercaya', 'Klinik kesehatan modern dengan layanan dokter spesialis terpercaya.')
ON CONFLICT DO NOTHING;

-- ============================================
-- TABLE: polyclinics
-- ============================================
CREATE TABLE IF NOT EXISTS polyclinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample polyclinics
INSERT INTO polyclinics (name, description) VALUES
  ('Poli Umum', 'Layanan dokter umum untuk berbagai keluhan'),
  ('Poli Gigi', 'Layanan kesehatan gigi dan mulut'),
  ('Poli Anak', 'Layanan kesehatan khusus anak dan bayi'),
  ('Poli Kandungan', 'Layanan kesehatan wanita dan kebidanan'),
  ('Poli Mata', 'Layanan kesehatan mata dan penglihatan');

-- ============================================
-- TABLE: doctors
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  photo_url TEXT,
  phone_number TEXT,
  polyclinic_id UUID NOT NULL REFERENCES polyclinics(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample doctors
INSERT INTO doctors (name, specialization, phone_number, polyclinic_id) VALUES
  ('dr. Siti Rahma, Sp.U', 'Dokter Umum', '6281234567890', (SELECT id FROM polyclinics WHERE name = 'Poli Umum' LIMIT 1)),
  ('dr. Budi Santoso', 'Dokter Umum', '6281234567891', (SELECT id FROM polyclinics WHERE name = 'Poli Umum' LIMIT 1)),
  ('drg. Anisa Putri', 'Dokter Gigi', '6281234567892', (SELECT id FROM polyclinics WHERE name = 'Poli Gigi' LIMIT 1)),
  ('dr. Hendra, Sp.A', 'Dokter Spesialis Anak', '6281234567893', (SELECT id FROM polyclinics WHERE name = 'Poli Anak' LIMIT 1)),
  ('dr. Dewi, Sp.OG', 'Dokter Spesialis Kandungan', '6281234567894', (SELECT id FROM polyclinics WHERE name = 'Poli Kandungan' LIMIT 1)),
  ('dr. Reza, Sp.M', 'Dokter Spesialis Mata', '6281234567895', (SELECT id FROM polyclinics WHERE name = 'Poli Mata' LIMIT 1));

-- ============================================
-- TABLE: doctor_schedules
-- ============================================
-- day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_patients INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample schedules for doctors
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 1, '08:00', '12:00', 30 FROM doctors WHERE name = 'dr. Siti Rahma, Sp.U';
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 3, '08:00', '12:00', 30 FROM doctors WHERE name = 'dr. Siti Rahma, Sp.U';
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 5, '08:00', '12:00', 30 FROM doctors WHERE name = 'dr. Siti Rahma, Sp.U';

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 2, '13:00', '17:00', 25 FROM doctors WHERE name = 'dr. Budi Santoso';
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 4, '13:00', '17:00', 25 FROM doctors WHERE name = 'dr. Budi Santoso';

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 1, '09:00', '13:00', 20 FROM doctors WHERE name = 'drg. Anisa Putri';
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 4, '09:00', '13:00', 20 FROM doctors WHERE name = 'drg. Anisa Putri';

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 2, '08:00', '11:00', 20 FROM doctors WHERE name = 'dr. Hendra, Sp.A';
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 5, '08:00', '11:00', 20 FROM doctors WHERE name = 'dr. Hendra, Sp.A';

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 3, '10:00', '14:00', 15 FROM doctors WHERE name = 'dr. Dewi, Sp.OG';
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 6, '09:00', '13:00', 15 FROM doctors WHERE name = 'dr. Dewi, Sp.OG';

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 1, '14:00', '17:00', 15 FROM doctors WHERE name = 'dr. Reza, Sp.M';
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, max_patients)
SELECT id, 5, '14:00', '17:00', 15 FROM doctors WHERE name = 'dr. Reza, Sp.M';

-- ============================================
-- TABLE: services (Tindakan/Layanan)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  polyclinic_id UUID NOT NULL REFERENCES polyclinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30, -- In minutes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample services
INSERT INTO services (polyclinic_id, name, duration) VALUES
  ((SELECT id FROM polyclinics WHERE name = 'Poli Umum' LIMIT 1), 'Konsultasi Umum', 15),
  ((SELECT id FROM polyclinics WHERE name = 'Poli Gigi' LIMIT 1), 'Pembersihan Karang Gigi (Scaling)', 45),
  ((SELECT id FROM polyclinics WHERE name = 'Poli Gigi' LIMIT 1), 'Tambal Gigi', 60),
  ((SELECT id FROM polyclinics WHERE name = 'Poli Gigi' LIMIT 1), 'Cabut Gigi', 40),
  ((SELECT id FROM polyclinics WHERE name = 'Poli Anak' LIMIT 1), 'Pemeriksaan Anak', 20),
  ((SELECT id FROM polyclinics WHERE name = 'Poli Kandungan' LIMIT 1), 'USG Kehamilan', 30);

-- ============================================
-- TABLE: queues
-- ============================================
CREATE TABLE IF NOT EXISTS queues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  polyclinic_id UUID NOT NULL REFERENCES polyclinics(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  complaint TEXT,
  queue_number INTEGER NOT NULL,
  unique_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_progress', 'done', 'cancelled')),
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_queues_date_doctor ON queues (queue_date, doctor_id);
CREATE INDEX IF NOT EXISTS idx_queues_unique_code ON queues (unique_code);
CREATE INDEX IF NOT EXISTS idx_queues_status ON queues (status);
CREATE INDEX IF NOT EXISTS idx_queues_service ON queues (service_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE polyclinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public read access for public pages
CREATE POLICY "Public read seo_settings" ON seo_settings FOR SELECT USING (true);
CREATE POLICY "Public read polyclinics" ON polyclinics FOR SELECT USING (true);
CREATE POLICY "Public read doctors" ON doctors FOR SELECT USING (is_active = true);
CREATE POLICY "Public read doctor_schedules" ON doctor_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Public read queues" ON queues FOR SELECT USING (true);
CREATE POLICY "Public insert queues" ON queues FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (is_active = true);

-- Admin full access (for authenticated users via service role)
CREATE POLICY "Admin all seo_settings" ON seo_settings FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Admin all polyclinics" ON polyclinics FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Admin all doctors" ON doctors FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Admin all doctor_schedules" ON doctor_schedules FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Admin all services" ON services FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Admin update queues" ON queues FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
CREATE POLICY "Admin delete queues" ON queues FOR DELETE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
