export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      polyclinics: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      doctors: {
        Row: {
          id: string;
          name: string;
          specialization: string;
          photo_url: string | null;
          phone_number: string | null;
          polyclinic_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          specialization: string;
          photo_url?: string | null;
          phone_number?: string | null;
          polyclinic_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          specialization?: string;
          photo_url?: string | null;
          phone_number?: string | null;
          polyclinic_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      doctor_schedules: {
        Row: {
          id: string;
          doctor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          max_patients: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          max_patients?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          max_patients?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      queues: {
        Row: {
          id: string;
          doctor_id: string;
          schedule_id: string | null;
          polyclinic_id: string;
          service_id: string | null;
          patient_name: string;
          patient_phone: string;
          complaint: string | null;
          queue_number: number;
          unique_code: string;
          status: "waiting" | "called" | "in_progress" | "done" | "cancelled";
          queue_date: string;
          created_at: string;
          called_at: string | null;
          done_at: string | null;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          schedule_id?: string | null;
          polyclinic_id: string;
          service_id?: string | null;
          patient_name: string;
          patient_phone: string;
          complaint?: string | null;
          queue_number?: number;
          unique_code?: string;
          status?: "waiting" | "called" | "in_progress" | "done" | "cancelled";
          queue_date?: string;
          created_at?: string;
          called_at?: string | null;
          done_at?: string | null;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          schedule_id?: string | null;
          polyclinic_id?: string;
          service_id?: string | null;
          patient_name?: string;
          patient_phone?: string;
          complaint?: string | null;
          queue_number?: number;
          unique_code?: string;
          status?: "waiting" | "called" | "in_progress" | "done" | "cancelled";
          queue_date?: string;
          created_at?: string;
          called_at?: string | null;
          done_at?: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          polyclinic_id: string;
          name: string;
          duration: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          polyclinic_id: string;
          name: string;
          duration?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          polyclinic_id?: string;
          name?: string;
          duration?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      seo_settings: {
        Row: {
          id: string;
          meta_title: string;
          meta_description: string;
          keywords: string | null;
          og_image: string | null;
          logo_url: string | null;
          clinic_name: string;
          clinic_address: string | null;
          clinic_phone: string | null;
          clinic_email: string | null;
          clinic_tagline: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meta_title: string;
          meta_description: string;
          keywords?: string | null;
          og_image?: string | null;
          logo_url?: string | null;
          clinic_name: string;
          clinic_address?: string | null;
          clinic_phone?: string | null;
          clinic_email?: string | null;
          clinic_tagline?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meta_title?: string;
          meta_description?: string;
          keywords?: string | null;
          og_image?: string | null;
          logo_url?: string | null;
          clinic_name?: string;
          clinic_address?: string | null;
          clinic_phone?: string | null;
          clinic_email?: string | null;
          clinic_tagline?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
