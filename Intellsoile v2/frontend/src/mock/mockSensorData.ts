// frontend/src/mock/mockSensorData.ts
export const mockSensorData = [
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