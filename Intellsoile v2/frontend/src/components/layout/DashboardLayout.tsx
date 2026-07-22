"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const checkStarted = useRef(false);

  useEffect(() => {
    if (checkStarted.current) return;
    checkStarted.current = true;

    const checkAuth = async () => {
      // Safety timeout to prevent hanging
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3000);

      try {
        // Check for mock user first
        const mockUser = sessionStorage.getItem("mock_user");
        if (mockUser) {
          clearTimeout(timeout);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeout);
        if (error || !session) {
          router.push("/login?error=unauthorized");
        } else {
          setLoading(false);
        }
      } catch (err) {
        clearTimeout(timeout);
        console.error("Auth fetch failed:", err);
        router.push("/login?error=network_error");
      }
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }
  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200 md:hidden dark:bg-slate-900 dark:border-slate-800 transition-colors">
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">IntelliSole</h1>
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
        </div>
      </header>
      
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <Sidebar aria-label="Main Navigation" />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
