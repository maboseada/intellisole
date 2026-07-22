"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FootHeatmap } from "@/components/dashboard/FootHeatmap";
import {
  Battery,
  Zap,
  Thermometer,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileText,
  Wind,
  Power,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/utils/supabase/client";

// Mock history data
const mockData = [
  { time: "08:00", p: 1200 },
  { time: "10:00", p: 2100 },
  { time: "12:00", p: 1800 },
  { time: "14:00", p: 2400 },
  { time: "16:00", p: 2200 },
  { time: "18:00", p: 1500 },
];

// Helper: compute 6-sensor average with graceful degradation for old 4-sensor data
function computeAvg(pr: Record<string, number>): number {
  const vals = [
    pr.fsr1 ?? 0,
    pr.fsr2 ?? 0,
    pr.fsr3 ?? 0,
    pr.fsr4 ?? 0,
    pr.fsr5 ?? 0,
    pr.fsr6 ?? 0,
  ];
  const count = [pr.fsr5, pr.fsr6].some((v) => v !== undefined) ? 6 : 4;
  const sum = vals.slice(0, count).reduce((a, b) => a + b, 0);
  return Math.round(sum / count);
}

type PumpStatus = "idle" | "ON" | "OFF" | "sending";

export default function PatientDashboard() {
  const [sensors, setSensors] = useState([0, 0, 0, 0, 0, 0]);
  const [battery, setBattery] = useState(0);
  const [temp, setTemp] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [avgPressure, setAvgPressure] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Pump state
  const [pumpStatus, setPumpStatus] = useState<PumpStatus>("idle");
  const [pumpActionLoading, setPumpActionLoading] = useState(false);
  const [pumpMessage, setPumpMessage] = useState<string | null>(null);

  const handlePumpCommand = async (state: "ON" | "OFF") => {
    if (isGuest) {
      setPumpStatus(state);
      setPumpMessage(`Pump ${state} (simulated in guest mode)`);
      setTimeout(() => setPumpMessage(null), 3000);
      return;
    }
    if (!user?.id) return;
    setPumpActionLoading(true);
    setPumpStatus("sending");
    const supabase = createClient();
    try {
      const { error } = await supabase.from("device_commands").insert({
        device_id: user.id,
        command: state === "ON" ? "PUMP_ON" : "PUMP_OFF",
      });
      if (error) throw error;
      setPumpStatus(state);
      setPumpMessage(`Pump ${state} command sent successfully.`);
    } catch {
      setPumpStatus("idle");
      setPumpMessage("Failed to send pump command.");
    } finally {
      setPumpActionLoading(false);
      setTimeout(() => setPumpMessage(null), 4000);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    async function setupDashboard() {
      // Guest mode
      const mockUserStr = sessionStorage.getItem("mock_user");
      if (mockUserStr) {
        const mockUser = JSON.parse(mockUserStr);
        setUser(mockUser);
        setIsGuest(true);
        setSensors([1200, 800, 1500, 1300, 1100, 400]);
        setBattery(85);
        setTemp(32.4);
        setAvgPressure(1050);
        setAlertCount(0);
        setHistory(mockData);
        setLoading(false);
        return;
      }

      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();
      if (!supabaseUser) return;
      setUser(supabaseUser);

      // Latest reading
      const { data: latest } = await supabase
        .from("sensor_data")
        .select("*")
        .eq("patient_id", supabaseUser.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (latest) updateStats(latest);

      // Alert count
      const { count: unackCount } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", supabaseUser.id)
        .eq("status", "unacknowledged");
      setAlertCount(unackCount || 0);

      // History
      const { data: historyData } = await supabase
        .from("sensor_data")
        .select("recorded_at, temperature, battery_percentage, pressure_readings")
        .eq("patient_id", supabaseUser.id)
        .order("recorded_at", { ascending: false })
        .limit(20);

      if (historyData) {
        setHistory(
          historyData.reverse().map((d: any) => ({
            time: new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(d.recorded_at)),
            p: computeAvg(d.pressure_readings),
            temp: d.temperature,
          }))
        );
      }

      setLoading(false);

      // Realtime
      const tempChannelName = `realtime-dashboard-${supabaseUser.id}-${Date.now()}`;
      const channel = supabase
        .channel(tempChannelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "sensor_data",
            filter: `patient_id=eq.${supabaseUser.id}`,
          },
          (payload) => {
            updateStats(payload.new);
            setHistory((prev) => {
              const newPt = {
                time: new Intl.DateTimeFormat("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(payload.new.recorded_at)),
                p: computeAvg(payload.new.pressure_readings || {}),
                temp: payload.new.temperature,
              };
              return [...prev.slice(-19), newPt];
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "alerts",
            filter: `patient_id=eq.${supabaseUser.id}`,
          },
          () => {
            supabase
              .from("alerts")
              .select("*", { count: "exact", head: true })
              .eq("patient_id", supabaseUser.id)
              .eq("status", "unacknowledged")
              .then(({ count }) => setAlertCount(count || 0));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    setupDashboard();
  }, []);

  const updateStats = (data: any) => {
    if (data.pressure_readings) {
      const pr = data.pressure_readings;
      const fsr1 = pr.fsr1 ?? 0;
      const fsr2 = pr.fsr2 ?? 0;
      const fsr3 = pr.fsr3 ?? 0;
      const fsr4 = pr.fsr4 ?? 0;
      const fsr5 = pr.fsr5 ?? 0;
      const fsr6 = pr.fsr6 ?? 0;
      setSensors([fsr1, fsr2, fsr3, fsr4, fsr5, fsr6]);
      setAvgPressure(computeAvg(pr));
    }
    setBattery(data.battery_percentage ?? 0);
    setTemp(data.temperature ?? 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Good Morning, {user?.user_metadata?.full_name?.split(" ")[0] || "Patient"}
              {isGuest && <Badge className="ml-2 bg-amber-500">Guest Mode</Badge>}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Your foot health is looking stable today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <FileText className="w-4 h-4 mr-2" /> View Reports
              </Button>
            </Link>
            <Link href="/emergency">
              <Button size="sm" variant="danger" className="shadow-lg shadow-red-500/20">
                EMERGENCY SOS
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Battery Status</CardTitle>
              <Battery
                className={cn("w-4 h-4", battery < 20 ? "text-red-500" : "text-emerald-500")}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{battery}%</div>
              <p className="text-xs text-muted-foreground mt-1">~12 hours remaining</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Foot Temperature</CardTitle>
              <Thermometer className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{temp}°C</div>
              <Badge variant={temp > 35 ? "destructive" : "default"} className="mt-1">
                {temp > 35 ? "Elevated" : "Normal Range"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Pressure (6 FSR)</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPressure.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Normal walking gait</p>
            </CardContent>
          </Card>

          <Card className="glass border-red-100 dark:border-red-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle
                className={cn(
                  "w-4 h-4",
                  alertCount > 0 ? "text-red-500 animate-bounce" : "text-slate-400"
                )}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {alertCount > 0 ? "Requires attention" : "System healthy"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap, Chart & Pump Control */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Foot Heatmap */}
          <Card className="lg:col-span-2 glass">
            <CardHeader>
              <CardTitle className="text-sm">Pressure Map (6 FSR)</CardTitle>
            </CardHeader>
            <CardContent>
              <FootHeatmap sensors={sensors} />
            </CardContent>
          </Card>

          {/* Pressure Trend Chart */}
          <Card className="lg:col-span-3 glass">
            <CardHeader>
              <CardTitle>Pressure Trends (24h)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history.length > 0 ? history : mockData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="p"
                    name="Avg Pressure"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pump Control */}
          <Card className="lg:col-span-2 glass flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wind className="w-4 h-4 text-indigo-500" />
                Pump Control
              </CardTitle>
              {/* Live status badge */}
              <span
                className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                  pumpStatus === "ON"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : pumpStatus === "OFF"
                    ? "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    : pumpStatus === "sending"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                )}
              >
                {pumpStatus === "sending" ? "Sending…" : pumpStatus === "ON" ? "● ON" : pumpStatus === "OFF" ? "○ OFF" : "● Idle"}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 flex-1 justify-between pt-2">
              {/* Status indicator */}
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-sm transition-all duration-500",
                  pumpStatus === "ON"
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-900/10"
                    : pumpStatus === "OFF"
                    ? "border-slate-200 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-800/20"
                    : "border-slate-100 bg-slate-50/20 dark:border-slate-800"
                )}
              >
                <Power
                  className={cn(
                    "w-5 h-5 transition-colors",
                    pumpStatus === "ON" ? "text-emerald-500" : "text-slate-400"
                  )}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                  {pumpStatus === "ON"
                    ? "Pump is running — compensating pressure"
                    : pumpStatus === "OFF"
                    ? "Pump is off — manual override active"
                    : pumpStatus === "sending"
                    ? "Sending command to device…"
                    : "Pump in automatic mode"}
                </span>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="pump-on-btn"
                  onClick={() => handlePumpCommand("ON")}
                  disabled={pumpActionLoading || pumpStatus === "ON"}
                  className={cn(
                    "py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                    pumpStatus === "ON"
                      ? "bg-emerald-500 text-white opacity-80 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow shadow-emerald-200 dark:shadow-none active:scale-95"
                  )}
                >
                  {pumpActionLoading && pumpStatus === "sending" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  ON
                </button>
                <button
                  id="pump-off-btn"
                  onClick={() => handlePumpCommand("OFF")}
                  disabled={pumpActionLoading || pumpStatus === "OFF"}
                  className={cn(
                    "py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                    pumpStatus === "OFF"
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white active:scale-95"
                  )}
                >
                  <Power className="w-4 h-4" />
                  OFF
                </button>
              </div>

              {/* Feedback toast */}
              {pumpMessage && (
                <p className="text-[11px] text-center font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 animate-in fade-in duration-300">
                  {pumpMessage}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FSR Sensor Bar Summary */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>6-Sensor Pressure Breakdown</CardTitle>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              FSR 1 – 6
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Heel", idx: 0 },
                { label: "Med Arch", idx: 1 },
                { label: "Lat Arch", idx: 2 },
                { label: "Med Ball", idx: 3 },
                { label: "Lat Ball", idx: 4 },
                { label: "Toe", idx: 5 },
              ].map(({ label, idx }) => {
                const val = sensors[idx] ?? 0;
                const pct = Math.min(100, Math.round((val / 4095) * 100));
                const color =
                  pct < 30
                    ? "bg-emerald-400"
                    : pct < 70
                    ? "bg-amber-400"
                    : "bg-rose-500";
                return (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        S{idx + 1}
                      </span>
                      <span className="text-slate-400">{label}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          color
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-center text-slate-700 dark:text-slate-200">
                      {val}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Insights */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Insights</CardTitle>
            <Button variant="ghost" size="sm">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/30">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/40">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">
                  Check your left heel pressure
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  FSR S1 detected elevated pressure. Consider adjusting your gait.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}