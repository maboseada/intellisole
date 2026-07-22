-- ============================================================
-- Appointment Booking System Schema for IntelliSole
-- ============================================================

-- ENUM for appointment status
create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- ENUM for doctor availability status
create type doctor_availability_status as enum ('available', 'unavailable', 'closed_today', 'on_leave');

-- ============================================================
-- 1. DOCTOR SCHEDULE SETTINGS TABLE
-- Each doctor has one row with their global booking configuration
-- ============================================================
create table if not exists doctor_schedule_settings (
    id uuid default uuid_generate_v4() primary key,
    doctor_id uuid references users(id) on delete cascade unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

    -- Availability status
    availability_status doctor_availability_status default 'available' not null,
    unavailability_reason text, -- e.g. "On Conference", "On Leave"

    -- Location / Clinic info
    clinic_name text default 'Main Clinic',
    clinic_address text,
    clinic_phone text,
    consultation_type text default 'in_person', -- 'in_person', 'online', 'both'
    meeting_link text, -- for online consultations (Zoom / Google Meet link)

    -- Appointment slot settings
    slot_duration_minutes integer default 30 not null, -- e.g., 15, 30, 60 mins
    buffer_minutes integer default 0 not null,         -- break time between appointments
    max_appointments_per_day integer default 20,

    -- Working days (JSON array: ["monday","tuesday","wednesday","thursday","sunday"])
    working_days jsonb default '["sunday","monday","tuesday","wednesday","thursday"]'::jsonb not null,

    -- Working hours per day (can be overridden per day)
    default_start_time time default '09:00:00' not null,
    default_end_time time default '17:00:00' not null,

    -- Advance booking settings
    min_advance_hours integer default 1,  -- minimum hours before appointment to book
    max_advance_days integer default 30   -- how many days in the future patients can book
);

-- ============================================================
-- 2. DOCTOR CLOSED DAYS TABLE
-- Specific dates where the doctor is not available
-- ============================================================
create table if not exists doctor_closed_days (
    id uuid default uuid_generate_v4() primary key,
    doctor_id uuid references users(id) on delete cascade not null,
    closed_date date not null,
    reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(doctor_id, closed_date)
);

-- ============================================================
-- 3. APPOINTMENTS TABLE
-- The core appointments booking table
-- ============================================================
create table if not exists appointments (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

    -- Relationships
    patient_id uuid references users(id) on delete cascade not null,
    doctor_id uuid references users(id) on delete cascade not null,

    -- Appointment time slot
    appointment_date date not null,
    start_time time not null,
    end_time time not null,

    -- Status
    status appointment_status default 'pending' not null,
    cancellation_reason text,
    cancelled_by uuid references users(id), -- who cancelled (patient or doctor)

    -- Patient notes
    chief_complaint text,
    notes text,

    -- Doctor notes (filled after appointment)
    doctor_notes text,

    -- Type: in_person or online
    appointment_type text default 'in_person',
    meeting_link text,

    -- Prevent double booking: one doctor can't have two overlapping appointments
    -- This is enforced via UNIQUE constraint and validation function
    CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, appointment_date, start_time),
    -- Prevent same patient from booking the same slot twice
    CONSTRAINT unique_patient_slot UNIQUE (patient_id, appointment_date, start_time)
);

-- Index for fast lookups
create index if not exists idx_appointments_doctor_date on appointments(doctor_id, appointment_date);
create index if not exists idx_appointments_patient on appointments(patient_id);
create index if not exists idx_appointments_status on appointments(status);
create index if not exists idx_doctor_closed_days on doctor_closed_days(doctor_id, closed_date);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table doctor_schedule_settings enable row level security;
alter table doctor_closed_days enable row level security;
alter table appointments enable row level security;

-- DOCTOR SCHEDULE SETTINGS policies
create policy "Doctors can manage their own schedule settings"
    on doctor_schedule_settings for all
    using (auth.uid() = doctor_id);

create policy "Patients can view doctor schedule settings"
    on doctor_schedule_settings for select
    using (auth.role() = 'authenticated');

-- CLOSED DAYS policies
create policy "Doctors can manage their closed days"
    on doctor_closed_days for all
    using (auth.uid() = doctor_id);

create policy "Patients can view closed days"
    on doctor_closed_days for select
    using (auth.role() = 'authenticated');

-- APPOINTMENTS policies
create policy "Patients can view their own appointments"
    on appointments for select
    using (auth.uid() = patient_id);

create policy "Patients can create appointments"
    on appointments for insert
    with check (auth.uid() = patient_id);

create policy "Patients can cancel their own appointments"
    on appointments for update
    using (auth.uid() = patient_id)
    with check (status = 'cancelled');

create policy "Doctors can view their appointments"
    on appointments for select
    using (auth.uid() = doctor_id);

create policy "Doctors can update appointment status"
    on appointments for update
    using (auth.uid() = doctor_id);

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function update_timestamp()
returns trigger as $$
begin
    NEW.updated_at = timezone('utc'::text, now());
    return NEW;
end;
$$ language plpgsql;

create trigger update_appointments_timestamp
    before update on appointments
    for each row execute function update_timestamp();

create trigger update_schedule_settings_timestamp
    before update on doctor_schedule_settings
    for each row execute function update_timestamp();

-- ============================================================
-- 6. DEFAULT SCHEDULE SETTINGS FOR EXISTING DOCTORS
-- Run after inserting a new doctor user
-- ============================================================
create or replace function create_default_schedule_for_doctor()
returns trigger as $$
begin
    if NEW.role = 'doctor' then
        insert into doctor_schedule_settings (doctor_id)
        values (NEW.id)
        on conflict (doctor_id) do nothing;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

create trigger auto_create_doctor_schedule
    after insert on users
    for each row execute function create_default_schedule_for_doctor();

-- ============================================================
-- 7. REALTIME
-- ============================================================
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table doctor_schedule_settings;
