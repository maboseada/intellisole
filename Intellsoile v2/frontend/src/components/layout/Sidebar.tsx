"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Activity, 
  Bell, 
  Users, 
  BookOpen, 
  Settings, 
  FileText,
  LogOut,
  Stethoscope,
  ClipboardList,
  CalendarDays,
  CalendarClock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const patientLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Health Metrics", href: "/metrics", icon: Activity },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "حجز موعد", href: "/booking", icon: CalendarDays },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Community", href: "/community", icon: Users },
  { name: "Medical Tips", href: "/tips", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

const doctorLinks = [
  { name: "Overview", href: "/doctor", icon: Stethoscope },
  { name: "جدول المواعيد", href: "/doctor/schedule", icon: CalendarClock },
  { name: "Patients", href: "/doctor/patients", icon: Users },
  { name: "Alerts Queue", href: "/alerts", icon: Bell },
  { name: "Clinical Reports", href: "/reports", icon: ClipboardList },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  useEffect(() => {
    const fetchUser = async () => {
        const mockUser = sessionStorage.getItem("mock_user");
        if (mockUser) {
            setRole(JSON.parse(mockUser).user_metadata.role || "patient");
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setRole(user.user_metadata.role || "patient");
        }
    };
    fetchUser();
  }, []);

  const links = role === "doctor" ? doctorLinks : patientLinks;

  const handleLogout = async () => {
    sessionStorage.removeItem("mock_user");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login?message=Signed out successfully");
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 dark:bg-slate-950 dark:border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight">IntelliSole</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {role === "doctor" ? "Physician Portal" : "Patient Portal"}
        </p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                isActive 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between px-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Theme</span>
            <ThemeToggle />
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
