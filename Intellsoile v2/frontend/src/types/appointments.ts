// ============================================================
// Appointment System Types
// ============================================================

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type DoctorAvailabilityStatus = 'available' | 'unavailable' | 'closed_today' | 'on_leave';
export type ConsultationType = 'in_person' | 'online' | 'both';

export interface DoctorScheduleSettings {
  id: string;
  doctor_id: string;
  created_at: string;
  updated_at: string;
  availability_status: DoctorAvailabilityStatus;
  unavailability_reason: string | null;
  clinic_name: string;
  clinic_address: string | null;
  clinic_phone: string | null;
  consultation_type: ConsultationType;
  meeting_link: string | null;
  slot_duration_minutes: number;
  buffer_minutes: number;
  max_appointments_per_day: number;
  working_days: string[];
  default_start_time: string; // HH:MM:SS
  default_end_time: string;   // HH:MM:SS
  min_advance_hours: number;
  max_advance_days: number;
}

export interface DoctorClosedDay {
  id: string;
  doctor_id: string;
  closed_date: string; // YYYY-MM-DD
  reason: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // HH:MM:SS
  end_time: string;         // HH:MM:SS
  status: AppointmentStatus;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  chief_complaint: string | null;
  notes: string | null;
  doctor_notes: string | null;
  appointment_type: string;
  meeting_link: string | null;
  // Joined fields
  patient?: { full_name: string; email: string; phone_number: string | null };
  doctor?: { full_name: string; email: string };
}

export interface TimeSlot {
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  available: boolean;
}

// Default schedule settings
export const DEFAULT_SCHEDULE_SETTINGS: Partial<DoctorScheduleSettings> = {
  availability_status: 'available',
  clinic_name: 'عيادة الدكتور',
  consultation_type: 'in_person',
  slot_duration_minutes: 30,
  buffer_minutes: 0,
  max_appointments_per_day: 20,
  working_days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
  default_start_time: '09:00:00',
  default_end_time: '17:00:00',
  min_advance_hours: 1,
  max_advance_days: 30,
};

export const DAYS_ARABIC: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
};

export const AVAILABILITY_STATUS_LABELS: Record<DoctorAvailabilityStatus, { label: string; color: string }> = {
  available: { label: 'متاح للحجز', color: '#22c55e' },
  unavailable: { label: 'غير متاح حالياً', color: '#f97316' },
  closed_today: { label: 'مغلق اليوم', color: '#ef4444' },
  on_leave: { label: 'في إجازة', color: '#8b5cf6' },
};
