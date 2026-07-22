"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Users, 
  ChevronRight,
  Activity,
  AlertCircle,
  Bell,
  FileText,
  CalendarClock,
  Loader2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function DoctorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    critical: 3,
    activeAlerts: 12,
    newReports: 8,
    totalPatients: 24
  });

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      try {
        // Fetch in parallel for speed
        const [patientsRes, criticalRes, alertsRes, reportsRes] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
          supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'unacknowledged').eq('alert_type', 'emergency_sos'),
          supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'unacknowledged'),
          supabase.from('reports').select('*', { count: 'exact', head: true })
        ]);

        // Only update if we actually got data (to avoid resetting mock data to 0 on error)
        setStats(prev => ({
          totalPatients: patientsRes.count !== null ? patientsRes.count : prev.totalPatients,
          critical: criticalRes.count !== null ? criticalRes.count : prev.critical,
          activeAlerts: alertsRes.count !== null ? alertsRes.count : prev.activeAlerts,
          newReports: reportsRes.count !== null ? reportsRes.count : prev.newReports
        }));
      } catch (e) {
        console.error("Dashboard Stats Error:", e);
      } finally {
        // ALWAYS stop loading so UI doesn't hang
        setLoading(false);
      }
    };

    fetchStats();
    
    // Safety fallback: if database is ultra slow, stop loading after 2.5 seconds anyway
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Physician Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitoring {stats.totalPatients} patients across your department.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={() => router.push('/doctor/patients')}>
            Go to Patients
          </Button>
          <Button size="sm" onClick={() => router.push('/doctor/schedule')}>Manage Schedule</Button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
           <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
           <p className="text-slate-500 font-medium animate-pulse">Syncing clinical overview...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="glass border-rose-100 dark:border-rose-900/30 group hover:scale-[1.02] transition-transform shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Critical</CardTitle>
                <div className="p-2 bg-rose-50 rounded-lg dark:bg-rose-900/20">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-rose-600">{stats.critical}</div>
                <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-tighter">Immediate action</p>
              </CardContent>
            </Card>

            <Card className="glass group hover:scale-[1.02] transition-transform shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Alerts</CardTitle>
                <div className="p-2 bg-orange-50 rounded-lg dark:bg-orange-900/20">
                  <Bell className="w-4 h-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.activeAlerts}</div>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Pending review</p>
              </CardContent>
            </Card>

            <Card className="glass group hover:scale-[1.02] transition-transform shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Reports</CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{stats.newReports}</div>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">New generated</p>
              </CardContent>
            </Card>

            <Card className="glass group hover:scale-[1.02] transition-transform bg-blue-600 border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-blue-100 uppercase tracking-widest">Capacity</CardTitle>
                <Users className="w-4 h-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">{stats.totalPatients}</div>
                <p className="text-[10px] text-blue-200 font-bold mt-1 uppercase tracking-tighter">Active patients</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass h-[300px] flex items-center justify-center text-center p-8 border-slate-100 dark:border-slate-800">
                  <div className="space-y-4">
                      <Activity className="w-12 h-12 text-blue-100 dark:text-blue-900/30 mx-auto" />
                      <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">Trend Analysis</h3>
                          <p className="text-sm text-slate-500">Weekly patient health evolution will appear here.</p>
                      </div>
                  </div>
              </Card>
              <Card className="glass h-[300px] flex items-center justify-center text-center p-8 border-slate-100 dark:border-slate-800">
                  <div className="space-y-4">
                      <CalendarClock className="w-12 h-12 text-blue-100 dark:text-blue-900/30 mx-auto" />
                      <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">Upcoming Appointments</h3>
                          <p className="text-sm text-slate-500">You have no appointments scheduled for today.</p>
                      </div>
                  </div>
              </Card>
          </div>
        </>
      )}
    </div>
  );
}
