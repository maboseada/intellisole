"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Clock,
  Settings,
  MoreVertical,
  ShieldAlert,
  Flame,
  Battery
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const mockAlerts = [
  {
    id: 1,
    type: "critical",
    title: "High Pressure Alert",
    message: "Critical pressure detected in left heel (145 PSI). Decompression pump activated.",
    time: "2 mins ago",
    read: false,
    icon: <ShieldAlert className="w-5 h-5" />
  },
  {
    id: 2,
    type: "warning",
    title: "Temperature Rise",
    message: "Unusual temperature increase detected in forefoot (+1.2°C). Monitor for inflammation.",
    time: "45 mins ago",
    read: false,
    icon: <Flame className="w-5 h-5" />
  },
  {
    id: 3,
    type: "info",
    title: "Battery Level",
    message: "Insole battery is below 20%. Please charge at your earliest convenience.",
    time: "3 hours ago",
    read: true,
    icon: <Battery className="w-5 h-5" />
  },
  {
    id: 4,
    type: "success",
    title: "System Synchronization",
    message: "Cloud sync completed successfully. All health data is up to date.",
    time: "10 hours ago",
    read: true,
    icon: <CheckCircle2 className="w-5 h-5" />
  }
];

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredAlerts = mockAlerts.filter(alert => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Critical") return alert.type === "critical";
    if (activeFilter === "Warnings") return alert.type === "warning";
    if (activeFilter === "Unread") return !alert.read;
    return true;
  });

  useEffect(() => {
    // Artificial loading for smooth entrance
    setTimeout(() => setLoading(false), 500);
  }, []);

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
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <header className="flex items-end justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Security Alerts</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your health and system notifications.</p>
            </div>
            <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-blue-600 transition-all">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>

        {/* Quick Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["All", "Critical", "Warnings", "Unread"].map((filter, i) => (
                <button 
                    key={filter} 
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                        "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                        activeFilter === filter ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800"
                    )}
                >
                    {filter}
                </button>
            ))}
        </div>

        {/* Alerts List */}
        <Card className="glass border-0 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Notification Feed</CardTitle>
                    <button className="text-xs font-bold text-blue-600 hover:underline">Mark all as read</button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAlerts.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No alerts found for this filter.
                        </div>
                    )}
                    {filteredAlerts.map((alert) => (
                        <div 
                            key={alert.id} 
                            className={cn(
                                "group p-6 flex flex-col md:flex-row gap-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40 relative overflow-hidden",
                                !alert.read && "bg-blue-50/20 dark:bg-blue-900/5"
                            )}
                        >
                            {!alert.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                            
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                                alert.type === "critical" ? "bg-red-50 text-red-600 dark:bg-red-900/20" :
                                alert.type === "warning" ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20" :
                                alert.type === "success" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" :
                                "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                            )}>
                                {alert.icon}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className={cn("font-bold text-lg", !alert.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                                        {alert.title}
                                    </h3>
                                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {alert.time}
                                    </span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{alert.message}</p>
                                
                                <div className="pt-2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Explore Detail</button>
                                    <button className="text-xs font-bold text-slate-400 hover:text-slate-600 underline">Dismiss</button>
                                </div>
                            </div>

                            <button className="self-start p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 rounded-lg">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Action Suggestion */}
        <div className="p-8 rounded-[32px] bg-gradient-to-br from-blue-600/90 to-indigo-700/90 text-white shadow-2xl shadow-blue-200 dark:shadow-none flex flex-col items-center text-center space-y-6">
            <Bell className="w-10 h-10 opacity-50" />
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Stay Updated Everywhere</h2>
                <p className="text-blue-100 max-w-sm">Enable push notifications to receive emergency alerts even when your browser is closed.</p>
            </div>
            <button className="px-8 py-3 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-lg">
                Enable Notifications
            </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
