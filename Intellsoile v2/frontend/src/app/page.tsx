"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Activity, 
  Heart, 
  ChevronRight,
  TrendingUp,
  Microscope,
  Play,
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 italic selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-100 dark:bg-slate-950/70 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-50">IntelliSole</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors font-sans">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors font-sans">Technology</Link>
            <ThemeToggle />
            <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/login">
                <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 animate-in fade-in slide-in-from-left duration-1000">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold uppercase tracking-widest dark:bg-blue-900/20 dark:border-blue-900/30 font-sans">
                    <TrendingUp className="w-4 h-4" /> Revolutionizing Diabetic Care
                </div>
                <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight dark:text-slate-50">
                    Medical Intelligence at <br/> <span className="text-blue-600">Your Feet.</span>
                </h1>
                <p className="text-xl text-slate-500 leading-relaxed max-w-lg dark:text-slate-400 font-medium font-sans">
                    IntelliSole uses real-time pressure and temperature sensors to prevent foot complications before they even start.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/login">
                        <Button size="lg" className="h-16 px-10 text-lg shadow-2xl shadow-blue-500/20">
                            Launch Dashboard <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-16 px-10 text-lg"
                        onClick={() => setShowDemo(true)}
                    >
                        <Play className="w-5 h-5 mr-2 fill-blue-600 text-blue-600" /> Watch Demo
                    </Button>
                </div>
                <div className="flex items-center gap-8 pt-8 font-sans">
                    <div className="flex -space-x-4">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 dark:bg-slate-800 dark:border-slate-950" />
                        ))}
                    </div>
                    <p className="text-sm font-medium text-slate-600">Trusted by over <span className="text-slate-900 font-bold dark:text-slate-50 font-sans">1,200+</span> medical professionals.</p>
                </div>
            </div>

            <div className="relative animate-in fade-in slide-in-from-right duration-1000">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-blue-400 translate-z-0 rounded-full blur-[120px] opacity-20 pointer-events-none" />
                <div className="relative z-10 glass p-8 rounded-[40px] shadow-2xl border-white/40 dark:border-slate-800">
                    <div className="aspect-[4/3] bg-slate-100 rounded-[32px] overflow-hidden dark:bg-slate-900">
                        {/* Placeholder for an Image of the Dashboard */}
                        <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <Activity className="w-16 h-16 text-blue-500 animate-pulse" />
                            <div className="space-y-2">
                                <p className="font-bold text-2xl text-slate-800 dark:text-slate-100 font-sans">Live Health Analytics</p>
                                <p className="text-slate-400 max-w-xs font-sans">AI-driven anomaly detection for every step you take.</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Floating Card */}
                <div className="absolute -bottom-10 -left-10 z-20 glass p-6 rounded-3xl shadow-2xl animate-bounce-slow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest font-sans">Normal Rhythm</p>
                            <p className="text-xl font-bold dark:text-white font-sans">Active Protection</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl">
                <button 
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                    onClick={() => setShowDemo(false)}
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                        <Play className="w-10 h-10 text-white fill-white" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-white font-sans">System Overview</h2>
                        <p className="text-slate-400 font-sans">Video demonstration of the IntelliSole hardware & software ecosystem.</p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Stats Section */}
      <section id="features" className="py-32 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/20">
                    <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-sans">Real-time Analysis</h3>
                <p className="text-slate-500 font-sans">Every step and temperature change is monitored at a sub-millisecond level.</p>
            </div>
            <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 dark:bg-orange-900/20">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-sans">Risk Prediction</h3>
                <p className="text-slate-500 font-sans">Advanced AI algorithms predict potential diabetic foot ulcers before they surface.</p>
            </div>
            <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 dark:bg-purple-900/20">
                    <Microscope className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-sans">Clinical Integration</h3>
                <p className="text-slate-500 font-sans">Reports are generated instantly to be shared with your surgical or podiatry team.</p>
            </div>
        </div>
      </section>
    </div>
  );
}
