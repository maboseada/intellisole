"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Activity,
  Thermometer,
  Battery,
  Wind,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Power,
  Zap,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const staticData = [
  { time: "08:00", temp: 36.5, pressure: 120 },
  { time: "10:00", temp: 37.0, pressure: 125 },
  { time: "12:00", temp: 36.8, pressure: 118 },
  { time: "14:00", temp: 37.2, pressure: 130 },
  { time: "16:00", temp: 36.6, pressure: 122 },
];

// 6-sensor positions in anatomical order
const FSR_LABELS = [
  { key: "fsr1", name: "Heel",     color: "#3b82f6" },
  { key: "fsr2", name: "Med Arch", color: "#8b5cf6" },
  { key: "fsr3", name: "Lat Arch", color: "#a78bfa" },
  { key: "fsr4", name: "Med Ball", color: "#f59e0b" },
  { key: "fsr5", name: "Lat Ball", color: "#f97316" },
  { key: "fsr6", name: "Toe",      color: "#ef4444" },
];

type PumpStatus = "idle" | "ON" | "OFF" | "sending";

export default function MetricsPage() {
  const [session, setSession] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Live sensor data
  const [fsrValues, setFsrValues] = useState<Record<string, number>>({
    fsr1: 0, fsr2: 0, fsr3: 0, fsr4: 0, fsr5: 0, fsr6: 0,
  });
  const [temp, setTemp] = useState(0);
  const [battery, setBattery] = useState(0);

  // Pump state
  const [pumpStatus, setPumpStatus] = useState<PumpStatus>("idle");
  const [pumpActionLoading, setPumpActionLoading] = useState(false);
  const [pumpMessage, setPumpMessage] = useState<string | null>(null);

  const handlePumpCommand = async (state: "ON" | "OFF") => {
    if (!deviceId) return alert("No device linked to this patient.");
    setPumpActionLoading(true);
    setPumpStatus("sending");
    const supabase = createClient();
    try {
      const { error } = await supabase.from("device_commands").insert({
        device_id: deviceId,
        command: state === "ON" ? "PUMP_ON" : "PUMP_OFF",
        pump_on: state === "ON"
      });
      if (error) throw error;
      setPumpStatus(state);
      setPumpMessage(`Pump ${state} command sent.`);
    } catch {
      setPumpStatus("idle");
      setPumpMessage("Failed to send command.");
    } finally {
      setPumpActionLoading(false);
      setTimeout(() => setPumpMessage(null), 4000);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user?.id) {
        // Fetch linkage
        supabase
          .from("devices")
          .select("device_id")
          .eq("patient_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setDeviceId(data.device_id);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Subscribe to latest sensor data for live FSR display
    const fetchLatest = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("sensor_data")
        .select("pressure_readings, temperature, battery_percentage")
        .eq("patient_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const pr = data.pressure_readings || {};
        setFsrValues({
          fsr1: pr.fsr1 ?? 0,
          fsr2: pr.fsr2 ?? 0,
          fsr3: pr.fsr3 ?? 0,
          fsr4: pr.fsr4 ?? 0,
          fsr5: pr.fsr5 ?? 0,
          fsr6: pr.fsr6 ?? 0,
        });
        setTemp(data.temperature ?? 0);
        setBattery(data.battery_percentage ?? 0);
      }
    };

    fetchLatest();
  }, []);

  // Bar chart data for 6 FSR sensors
  const fsrChartData = FSR_LABELS.map((f) => ({
    name: f.name,
    value: fsrValues[f.key] ?? 0,
    fill: f.color,
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900/20 mb-4" />
            <div className="h-4 w-32 bg-slate-100 rounded dark:bg-slate-800" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Health Metrics
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Detailed biometric analysis &amp; 6-sensor diagnostics.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600 dark:text-slate-300">Last updated: Just now</span>
          </div>
        </header>

        {/* Vital Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Foot Temperature"
            value={`${temp || 36.8}°C`}
            trend={temp > 35 ? "+elevated" : "Normal"}
            icon={<Thermometer className="w-6 h-6" />}
            status={temp > 35 ? "Elevated" : "Normal"}
            color="blue"
          />
          <MetricCard
            title="Activity"
            value="Stable"
            trend="Walking gait"
            icon={<Activity className="w-6 h-6" />}
            status="Normal"
            color="emerald"
          />
          <MetricCard
            title="Battery Level"
            value={`${battery || 85}%`}
            trend={battery < 20 ? "Low!" : "Healthy"}
            icon={<Battery className="w-6 h-6" />}
            status={battery < 20 ? "Low" : "Optimized"}
            color="amber"
          />
          <MetricCard
            title="Pump Status"
            value={pumpStatus === "ON" ? "Active" : pumpStatus === "OFF" ? "Off" : "Auto"}
            trend={pumpStatus === "ON" ? "Running" : "Standby"}
            icon={<Wind className="w-6 h-6" />}
            status={pumpStatus === "ON" ? "Running" : "Standby"}
            color="indigo"
          />
        </div>

        {/* Pump Control Card */}
        <Card className="glass border-0 shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wind className="w-5 h-5 text-indigo-500" />
              Pump Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status bar */}
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all duration-500",
                pumpStatus === "ON"
                  ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-900/10"
                  : pumpStatus === "OFF"
                  ? "border-slate-200 bg-slate-50/40 dark:border-slate-700"
                  : pumpStatus === "sending"
                  ? "border-amber-200 bg-amber-50/40 dark:border-amber-800 animate-pulse"
                  : "border-slate-100 bg-slate-50/20 dark:border-slate-800"
              )}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full shrink-0",
                  pumpStatus === "ON"
                    ? "bg-emerald-500 shadow-lg shadow-emerald-300 animate-pulse"
                    : pumpStatus === "sending"
                    ? "bg-amber-400 animate-ping"
                    : "bg-slate-300 dark:bg-slate-600"
                )}
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  {pumpStatus === "ON"
                    ? "Pump is ACTIVE — compensating heel pressure"
                    : pumpStatus === "OFF"
                    ? "Pump is OFF — manual override engaged"
                    : pumpStatus === "sending"
                    ? "Sending command to device…"
                    : "Pump in automatic mode (device-controlled)"}
                </p>
                {pumpMessage && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {pumpMessage}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest",
                  pumpStatus === "ON"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : pumpStatus === "OFF"
                    ? "bg-slate-200 text-slate-500 dark:bg-slate-700"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}
              >
                {pumpStatus === "sending" ? "Pending" : pumpStatus === "ON" ? "ON" : pumpStatus === "OFF" ? "OFF" : "AUTO"}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-4">
              <button
                id="metrics-pump-on-btn"
                onClick={() => handlePumpCommand("ON")}
                disabled={pumpActionLoading || pumpStatus === "ON"}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                  pumpStatus === "ON"
                    ? "bg-emerald-500 text-white opacity-60 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95"
                )}
              >
                {pumpActionLoading && pumpStatus === "sending" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Force Pump ON
              </button>
              <button
                id="metrics-pump-off-btn"
                onClick={() => handlePumpCommand("OFF")}
                disabled={pumpActionLoading || pumpStatus === "OFF"}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                  pumpStatus === "OFF"
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white active:scale-95"
                )}
              >
                <Power className="w-4 h-4" />
                Force Pump OFF
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Temperature trend */}
          <Card className="glass border-0 shadow-xl overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Temperature Trend
                </CardTitle>
                <select className="bg-slate-100 dark:bg-slate-800 border-0 text-xs font-bold rounded-lg px-2 py-1 outline-none">
                  <option>Last 24 Hours</option>
                  <option>Last Week</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={staticData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f033" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[36, 38]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "12px",
                      color: "white",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    name="Temperature (°C)"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 6-Sensor Pressure Distribution Bar Chart */}
          <Card className="glass border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wind className="w-5 h-5 text-orange-500" />
                Pressure Distribution — 6 FSR Sensors
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fsrChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f033" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 4095]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "12px",
                      color: "white",
                    }}
                    formatter={(value: any) => [value, "ADC Value"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {fsrChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sub-system Alerts */}
        <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-400">
              Peripheral Warning
            </h3>
            <p className="text-red-700 dark:text-red-700/80 text-sm">
              Pressure detected exceeding threshold in the heel region (FSR S1). Internal pump activating for compensation.
            </p>
          </div>
          <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 dark:shadow-none transition-all">
            Run Diagnostic
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ title, value, trend, icon, status, color }: any) {
  const colorClasses: any = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
  };

  return (
    <Card className="glass border-0 shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300",
              colorClasses[color]
            )}
          >
            {icon}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{value}</h2>
            <span className="text-xs font-bold text-emerald-500">{trend}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
          <span
            className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
              colorClasses[color]
            )}
          >
            {status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
