"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  User, 
  Bell, 
  Shield, 
  Lock, 
  Eye, 
  Moon, 
  Globe,
  Database,
  Cloud,
  ChevronRight,
  Save,
  Trash2
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Personal Profile");
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: ""
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFormData({
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone_number || ""
        });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    // In a real app, update Supabase user metadata
    console.log("Saving changes:", formData);
    // toast.success("Settings saved!");
  };

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
        <header>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your profile, security, and notification preferences.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Navigation Sidebar */}
            <div className="space-y-2">
                {[
                    { icon: <User />, label: "Personal Profile" },
                    { icon: <Bell />, label: "Notifications" },
                    { icon: <Shield />, label: "Security & Privacy" },
                    { icon: <Cloud />, label: "Data Syncing" },
                    { icon: <Database />, label: "Subscription" },
                ].map((item) => (
                    <SettingsNavButton 
                        key={item.label}
                        active={activeTab === item.label} 
                        icon={item.icon} 
                        label={item.label}
                        onClick={() => setActiveTab(item.label)}
                    />
                ))}
            </div>

            {/* Content Area */}
            <div className="md:col-span-2 space-y-6">
                {activeTab === "Personal Profile" && (
                    <Card className="glass border-0 shadow-xl">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg">Personal Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        readOnly
                                        className="w-full px-4 py-3 bg-slate-100/20 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                    <input 
                                        type="text" 
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                                        placeholder="+20 123 456 7890"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === "Notifications" && (
                    <Card className="glass border-0 shadow-xl">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg">Notification Preferences</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">Email Alerts</p>
                                    <p className="text-xs text-slate-500">Receive weekly health reports via email.</p>
                                </div>
                                <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">Push Notifications</p>
                                    <p className="text-xs text-slate-500">Instant alerts for pressure warnings.</p>
                                </div>
                                <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(activeTab === "Security & Privacy" || activeTab === "Data Syncing" || activeTab === "Subscription") && (
                    <Card className="glass border-0 shadow-xl">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg">{activeTab}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                    <Lock className="w-8 h-8 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Feature coming soon</h3>
                                    <p className="text-sm text-slate-500 max-w-xs">{activeTab} management is being finalized for the next update.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Appearance - Shared */}
                <Card className="glass border-0 shadow-xl">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-lg">Appearance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p>
                                <p className="text-xs text-slate-500">Switch between light and dark themes.</p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between pt-4">
                    <button className="flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all hover:scale-105"
                    >
                        <Save className="w-4 h-4" /> Save Changes
                    </button>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SettingsNavButton({ icon, label, active = false, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                active 
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-lg border border-slate-100 dark:border-slate-800" 
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/50"
            )}
        >
            <div className="flex items-center gap-3">
                <span className={active ? "text-blue-600" : "text-slate-400"}>{React.cloneElement(icon, { size: 18 })}</span>
                {label}
            </div>
            <ChevronRight className={cn("w-4 h-4", active ? "text-blue-200" : "text-slate-200 dark:text-slate-800")} />
        </button>
    );
}

import { cn } from "@/lib/utils";
