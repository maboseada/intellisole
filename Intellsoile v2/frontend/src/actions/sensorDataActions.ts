'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// In a real app we'd get these from env, using fallback for dev testing if missing
export async function createClientForServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            )
          } catch {
            // Ignored since setAll isn't needed for fetching data
          }
        },
      },
    }
  )
}

export async function getHistoricalSensorData(patient_id: string, limit = 50) {
  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from('sensor_data')
    .select('*')
    .eq('patient_id', patient_id)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching historical sensor data:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getActiveAlerts(patient_id: string) {
  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('patient_id', patient_id)
    .neq('status', 'resolved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching active alerts:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getPatientSettings(patient_id: string) {
  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from('users')
    .select('alert_thresholds')
    .eq('id', patient_id)
    .single();

  if (error) {
    console.error("Error fetching thresholds:", error.message);
    throw new Error(error.message);
  }
  return data;
}
