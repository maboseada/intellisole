-- PostgreSQL Schema for IntelliSole (Supabase)

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type user_role as enum ('patient', 'doctor');
create type alert_status as enum ('acknowledged', 'unacknowledged', 'resolved');

-- 3. TABLES

-- Users Table (Extends Supabase Auth)
create table if not exists users (
    id uuid references auth.users on delete cascade primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    role user_role not null default 'patient',
    full_name text not null,
    email text unique not null,
    phone_number text,
    avatar_url text,
    doctor_id uuid references users(id) on delete set null, -- For patients assigned to a doctor
    -- Configurable thresholds for alerts (default values provided)
    alert_thresholds jsonb default '{"battery": 15, "pump": 10, "high_temp": 35.0, "low_temp": 25.0}'::jsonb
);

-- Sensor Data Table
create table if not exists sensor_data (
    id uuid default uuid_generate_v4() primary key,
    device_id text not null, -- The physical ESP32 ID
    patient_id uuid references users(id) on delete cascade, -- Linked via backend mapping
    recorded_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- FSR Pressure Array (e.g. 6-8 sensors mapped to specific foot areas)
    pressure_readings jsonb not null default '{}'::jsonb, 
    
    -- Temperature reading from DS18B20
    temperature numeric not null,
    
    -- Hardware vitals
    battery_percentage integer,
    pump_percentage integer
);

-- Device Registry (Mapping)
create table if not exists devices (
    device_id text primary key,
    patient_id uuid references users(id) on delete set null,
    assigned_at timestamp with time zone default now()
);

-- Pump Commands Table
create table if not exists device_commands (
    id uuid default uuid_generate_v4() primary key,
    device_id text not null,
    command text, -- 'PUMP_ON', 'PUMP_OFF'
    pump_on boolean default false,
    created_at timestamp with time zone default now()
);

-- Alerts Table
create table if not exists alerts (
    id uuid default uuid_generate_v4() primary key,
    patient_id uuid references users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    alert_type text not null, -- 'low_battery', 'pump_error', 'abnormal_pressure', 'high_temperature', 'emergency_sos'
    description text,
    status alert_status default 'unacknowledged' not null,
    location_lat numeric, -- Optional for SOS
    location_lng numeric  -- Optional for SOS
);

-- Community Posts Table
create table if not exists posts (
    id uuid default uuid_generate_v4() primary key,
    author_id uuid references users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    content text not null,
    likes integer default 0
);

-- Tips Table (Managed by Doctors)
create table if not exists tips (
    id uuid default uuid_generate_v4() primary key,
    doctor_id uuid references users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    content text not null,
    category text -- e.g., 'Diet', 'Foot Care'
);

-- Reports Table
create table if not exists reports (
    id uuid default uuid_generate_v4() primary key,
    patient_id uuid references users(id) on delete cascade not null,
    doctor_id uuid references users(id) on delete cascade,
    generated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    report_url text not null, -- URL to PDF file stored in Supabase Storage
    report_type text -- 'daily', 'weekly', 'custom'
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
alter table users enable row level security;
alter table sensor_data enable row level security;
alter table alerts enable row level security;
alter table posts enable row level security;
alter table tips enable row level security;
alter table reports enable row level security;
alter table devices enable row level security;
alter table device_commands enable row level security;

-- USERS Table Policies
create policy "Users can view their own profile" on users
    for select using (auth.uid() = id);

create policy "Doctors can view their patients" on users
    for select using (
        auth.uid() in (
            select id from users where role = 'doctor'
        ) and (doctor_id = auth.uid() or id = auth.uid())
    );

create policy "Users can update their own profile" on users
    for update using (auth.uid() = id);

-- SENSOR DATA Policies
create policy "Patients can view their own sensor data" on sensor_data
    for select using (auth.uid() = patient_id);

create policy "Doctors can view their patients sensor data" on sensor_data
    for select using (
        auth.uid() in (
            select doctor_id from users where id = sensor_data.patient_id
        )
    );

create policy "Authenticated devices can insert sensor data" on sensor_data
    for insert with check (auth.uid() = patient_id);

-- ALERTS Policies
create policy "Patients can view their own alerts" on alerts
    for select using (auth.uid() = patient_id);

create policy "Doctors can view and update their patients alerts" on alerts
    for all using (
        auth.uid() in (
            select doctor_id from users where id = alerts.patient_id
        )
    );

-- 5. REALTIME CONFIGURATION
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table sensor_data;
alter publication supabase_realtime add table alerts;
alter publication supabase_realtime add table device_commands;

-- 6. DATABASE TRIGGERS & FUNCTIONS

-- Function to handle sensor data thresholds and create alerts
create or replace function process_sensor_data_alerts()
returns trigger as $$
declare
    patient_thresholds jsonb;
    batt_thresh integer;
    pump_thresh integer;
    high_temp_thresh numeric;
    low_temp_thresh numeric;
begin
    -- Fetch the threshold config for the patient
    select alert_thresholds into patient_thresholds from users where id = NEW.patient_id;
    
    -- Extract values or use fallbacks if missing
    batt_thresh := coalesce((patient_thresholds->>'battery')::integer, 15);
    pump_thresh := coalesce((patient_thresholds->>'pump')::integer, 10);
    high_temp_thresh := coalesce((patient_thresholds->>'high_temp')::numeric, 35.0);
    low_temp_thresh := coalesce((patient_thresholds->>'low_temp')::numeric, 25.0);

    -- Check battery
    if NEW.battery_percentage is not null and NEW.battery_percentage < batt_thresh then
        insert into alerts (patient_id, alert_type, description) 
        values (NEW.patient_id, 'low_battery', 'Battery below threshold (' || NEW.battery_percentage || '%)');
    end if;

    -- Check pump
    if NEW.pump_percentage is not null and NEW.pump_percentage < pump_thresh then
        insert into alerts (patient_id, alert_type, description) 
        values (NEW.patient_id, 'pump_error', 'Pump usage low/abnormal (' || NEW.pump_percentage || '%)');
    end if;

    -- Check high temperature
    if NEW.temperature is not null and NEW.temperature > high_temp_thresh then
        insert into alerts (patient_id, alert_type, description) 
        values (NEW.patient_id, 'high_temperature', 'High temperature detected (' || NEW.temperature || '°C)');
    end if;

    -- Check low temperature (abnormal_pressure type or maybe cold_temperature, we'll use abnormal_pressure for now but let's just make it low_temperature if allowed, wait the schema says: 'low_battery', 'pump_error', 'abnormal_pressure', 'high_temperature', 'emergency_sos')
    -- Let's use 'abnormal_pressure' as a fallback, or we can just append 'low_temperature' to the list if it's text. In schema alert_type is just 'text' not an Enum, so custom strings are okay.
    if NEW.temperature is not null and NEW.temperature < low_temp_thresh then
        insert into alerts (patient_id, alert_type, description) 
        values (NEW.patient_id, 'low_temperature', 'Low temperature detected (' || NEW.temperature || '°C)');
    end if;

    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to fire after each new sensor_data insert
drop trigger if exists process_sensor_data_alerts_trigger on sensor_data;
create trigger process_sensor_data_alerts_trigger
after insert on sensor_data
for each row execute function process_sensor_data_alerts();

-- Function to Link Device to Patient on ingestion
create or replace function link_device_to_patient()
returns trigger as $$
begin
    -- If patient_id is null, look it up in the devices mapping table
    if NEW.patient_id is null then
        select patient_id into NEW.patient_id 
        from devices 
        where device_id = NEW.device_id;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to link patient_id before insertion
drop trigger if exists link_device_to_patient_trigger on sensor_data;
create trigger link_device_to_patient_trigger
before insert on sensor_data
for each row execute function link_device_to_patient();

