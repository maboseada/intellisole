import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

export interface SensorData {
  patient_id: string;
  pressure_readings: Record<string, number>;
  temperature: number;
  battery_percentage: number;
  pump_percentage: number;
  recorded_at: string;
}

export interface Alert {
  id: string;
  patient_id: string;
  alert_type: string;
  description: string;
  status: 'unacknowledged' | 'acknowledged' | 'resolved';
  created_at: string;
}

interface derivedStats {
  averagePressure: number;
  maxPressure: number;
  highPressureZones: string[];
}

interface IntelliSoleState {
  latestData: SensorData | null;
  alerts: Alert[];
  isMonitoring: boolean;
  isSendingCommand: boolean;
  subscribeToData: (patientId: string) => void;
  unsubscribe: () => void;
  getDerivedStats: () => derivedStats;
  sendPumpCommand: (patientId: string, state: 'ON' | 'OFF') => Promise<void>;
}

export const useStore = create<IntelliSoleState>((set, get) => {
  const supabase = createClient();
  let dataChannel: any = null;
  let alertsChannel: any = null;

  return {
    latestData: null,
    alerts: [],
    isMonitoring: false,
    isSendingCommand: false,

    getDerivedStats: () => {
      const data = get().latestData;
      if (!data || !data.pressure_readings) {
        return { averagePressure: 0, maxPressure: 0, highPressureZones: [] };
      }

      const readings = data.pressure_readings;
      const zones = ['fsr1', 'fsr2', 'fsr3', 'fsr4', 'fsr5', 'fsr6'];
      let total = 0;
      let count = 0;
      let maxPressure = 0;
      const highPressureZones: string[] = [];

      zones.forEach(zone => {
        if (readings[zone] !== undefined && readings[zone] !== null) {
          const val = readings[zone];
          total += val;
          count++;
          if (val > maxPressure) maxPressure = val;
          // Threshold logic, e.g. > 140 PSI or raw value
          if (val > 140) highPressureZones.push(zone);
        }
      });

      return {
        averagePressure: count > 0 ? Math.round(total / count) : 0,
        maxPressure,
        highPressureZones
      };
    },

    sendPumpCommand: async (patientId: string, state: 'ON' | 'OFF') => {
      set({ isSendingCommand: true });
      try {
        // We do NOT optimistically update pump_percentage here.
        // We wait for the next sensor_data sync to reflect the actual state.
        const { error } = await supabase.from('device_commands').insert({
          device_id: patientId,
          command: state === 'ON' ? 'PUMP_ON' : 'PUMP_OFF'
        });
        if (error) throw error;
      } catch (err) {
        console.error('Failed to send pump command:', err);
      } finally {
        set({ isSendingCommand: false });
      }
    },

    subscribeToData: (patientId: string) => {
      // Prevent multiple subscriptions
      if (get().isMonitoring) return;
      set({ isMonitoring: true });

      // Fetch initial state first
      supabase
        .from('sensor_data')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) set({ latestData: data as SensorData });
        });

      supabase
        .from('alerts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'unacknowledged')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          if (data) set({ alerts: data as Alert[] });
        });

      // Subscribe to Sensor Data
      dataChannel = supabase
        .channel('sensor_data_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sensor_data',
            filter: `patient_id=eq.${patientId}`,
          },
          (payload) => {
            set({ latestData: payload.new as SensorData });
          }
        )
        .subscribe();

      // Subscribe to Alerts
      alertsChannel = supabase
        .channel('alerts_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'alerts',
            filter: `patient_id=eq.${patientId}`,
          },
          (payload) => {
            set((state) => ({ 
              alerts: [payload.new as Alert, ...state.alerts].slice(0, 50) 
            }));
          }
        )
        .subscribe();
    },

    unsubscribe: () => {
      if (dataChannel) supabase.removeChannel(dataChannel);
      if (alertsChannel) supabase.removeChannel(alertsChannel);
      set({ isMonitoring: false });
    },
  };
});
