import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

// Mock Data جاهزة للاستخدام
const mockSensorData = [
  {
    patient_id: 1,
    pressure_readings: { fsr1: 50, fsr2: 60, fsr3: 55, fsr4: 65, fsr5: 40, fsr6: 52 },
    temperature: 36.5,
    battery_percentage: 14,
    pump_percentage: 12,
    timestamp: new Date().toISOString(),
  },
  {
    patient_id: 2,
    pressure_readings: { fsr1: 45, fsr2: 55, fsr3: 50, fsr4: 60, fsr5: 35, fsr6: 48 },
    temperature: 37.2,
    battery_percentage: 18,
    pump_percentage: 15,
    timestamp: new Date().toISOString(),
  },
];

export async function POST(request: Request) {
  try {
    let data;
    try {
      data = await request.json(); // لو فيه بيانات من ESP32
    } catch {
      data = mockSensorData[0]; // لو مفيش، استخدم Mock Data
    }

    // Validate basic Auth via API KEY header
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.IOT_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { device_id, patient_id, pressure_readings, temperature, battery_percentage, pump_percentage } = data;

    if (!device_id && !patient_id) {
      return NextResponse.json({ error: 'Missing device_id or patient_id' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: insertedData, error } = await supabase
      .from('sensor_data')
      .insert({
        device_id: device_id || 'manual_entry',
        patient_id,
        pressure_readings: pressure_readings || {},
        temperature: temperature || 0,
        battery_percentage: battery_percentage || 100,
        pump_percentage: pump_percentage || 100
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: insertedData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}