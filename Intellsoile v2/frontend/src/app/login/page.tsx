"use client";

import React, { useState, useEffect, Suspense } from "react";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Stethoscope,
  Footprints,
  UserCheck
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/utils/supabase/client";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const msgParam = searchParams.get("message");
    if (errorParam) setError(errorParam === "unauthorized" ? "Please sign in to access this page." : errorParam);
    if (msgParam) setMessage(msgParam);
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !fullName)) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const supabase = createClient();
      
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            }
          }
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          setMessage("Account created! Please check your email for confirmation.");
          setLoading(false);
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          router.push(role === "doctor" ? "/doctor" : "/dashboard");
          router.refresh();
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setLoading(true);
    // Set mock data in sessionStorage to bypass auth checks in DashboardLayout
    const mockUser = {
      id: "mock-user-id",
      email: "guest@intellisole.test",
      user_metadata: {
        full_name: "Guest User",
        role: role
      }
    };
    sessionStorage.setItem("mock_user", JSON.stringify(mockUser));
    
    setTimeout(() => {
      router.push(role === "doctor" ? "/doctor" : "/dashboard");
      router.refresh();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 dark:bg-slate-950 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl mb-6">
                <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight dark:text-slate-50">Welcome Back</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-lg">Secure access to your IntelliSole metrics.</p>
        </div>

        <div className="flex p-1 bg-slate-200/50 rounded-2xl dark:bg-slate-900/40">
            <button 
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                    role === "patient" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800" : "text-slate-500"
                )}
                onClick={() => setRole("patient")}
            >
                <Footprints className="w-4 h-4" /> Patient Access
            </button>
            <button 
                className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                    role === "doctor" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800" : "text-slate-500"
                )}
                onClick={() => setRole("doctor")}
            >
                <Stethoscope className="w-4 h-4" /> Physician Portal
            </button>
        </div>

        <Card className="glass border-0 shadow-2xl p-4">
            <CardHeader>
                <CardTitle className="text-xl">{isSignUp ? "Create Account" : "Authentication"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAuth} className="space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                           <AlertCircle className="w-5 h-5 flex-shrink-0" />
                           {error}
                        </div>
                    )}

                    {message && (
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                           <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                           {message}
                        </div>
                    )}
                    
                    {isSignUp && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                            <div className="relative group">
                                <Footprints className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    required={isSignUp}
                                    disabled={loading}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                disabled={loading}
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                            <button type="button" className="text-xs text-blue-600 font-bold hover:underline">Forgot password?</button>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                            />
                            <button 
                                type="button"
                                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 space-y-4">
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 text-lg font-bold"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    {isSignUp ? "Creating Account..." : "Signing in..."}
                                </>
                            ) : (
                                isSignUp ? "Get Started Now" : "Login to Account"
                            )}
                        </Button>

                        {!isSignUp && (
                          <Button 
                              type="button"
                              variant="outline"
                              onClick={handleGuestLogin}
                              disabled={loading}
                              className="w-full h-14 text-lg font-bold border-2 border-blue-100 hover:bg-blue-50 dark:border-blue-900/30 dark:hover:bg-blue-900/10 transition-all text-blue-600"
                          >
                              <UserCheck className="w-5 h-5 mr-2" />
                              Try as Guest (Mock Mode)
                          </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"} {" "}
            <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-bold text-blue-600 hover:underline"
            >
                {isSignUp ? "Login here" : "Create an account"}
            </button>
        </p>

        <div className="pt-12 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em]">
            Military-grade encryption enabled per HIPAA guidelines
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
