"use client";

import React, { useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { generatePDF } from "@/lib/pdf-utils";
import { 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Activity,
  Heart,
  AlertTriangle
} from "lucide-react";

export default function ReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    await generatePDF("medical-report", "IntelliSole_Medical_Report.pdf");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Patient Reports</h1>
            <p className="text-slate-500 dark:text-slate-400">Generate and download historical health summaries.</p>
          </div>
          <Button onClick={handleDownload} className="shadow-lg shadow-blue-500/20">
            <Download className="w-4 h-4 mr-2" /> Download Latest Report
          </Button>
        </header>

        {/* Printable Report Area */}
        <div id="medical-report" className="bg-white p-12 rounded-3xl border border-slate-100 shadow-2xl space-y-12 dark:bg-slate-950 dark:border-slate-800">
          <header className="flex items-center justify-between border-b pb-8 border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-blue-600 tracking-tight">INTELLISOLE MEDICAL REPORT</h1>
              <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Confidential Health Summary
              </p>
            </div>
            <div className="text-right space-y-1 text-sm text-slate-500 dark:text-slate-400">
              <p className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Report ID: IS-98421</p>
              <p className="flex items-center justify-end gap-2"><Calendar className="w-4 h-4" /> Date: Oct 24, 2023</p>
            </div>
          </header>

          <section className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4" /> Patient Information
                </h3>
                <div className="space-y-2 text-slate-900 dark:text-slate-50">
                    <p className="text-lg font-bold">John Doe</p>
                    <p className="text-sm">DOB: May 12, 1958 (Age 65)</p>
                    <p className="text-sm">Assigned Doctor: Dr. Sarah Smith</p>
                </div>
            </div>
            <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Monitoring Period
                </h3>
                <div className="space-y-2 text-slate-900 dark:text-slate-50">
                    <p className="text-lg font-bold">Oct 17, 2023 – Oct 24, 2023</p>
                    <p className="text-sm text-slate-500">Duration: 7 Days (24/7 Active Monitoring)</p>
                </div>
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b pb-4 border-slate-100 dark:border-slate-800">
                <Heart className="w-4 h-4" /> Vital Health Metrics
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Avg Pressure (6 FSR)</p>
                    <p className="text-3xl font-bold">1,842</p>
                    <Badge variant="success" className="mt-2">STABLE</Badge>
                </div>
                <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30">
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-2">Avg Temperature</p>
                    <p className="text-3xl font-bold">32.4°C</p>
                    <Badge variant="success" className="mt-2 text-orange-600">HEALTHY</Badge>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-900/40 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Device Activity</p>
                    <p className="text-3xl font-bold">98.2%</p>
                    <p className="text-xs text-slate-400 mt-2">164 hours uptime</p>
                </div>
            </div>

            {/* 6-FSR Sensor Breakdown Table */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Pressure Sensor Breakdown — 6 FSR Sensors
              </p>
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Sensor</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Location</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Avg Reading</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Peak</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[
                      { id: "S1 (FSR1)", loc: "Heel",          avg: "2,140", peak: "3,820", status: "High",   color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
                      { id: "S2 (FSR2)", loc: "Medial Arch",   avg: "980",   peak: "1,640", status: "Normal", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
                      { id: "S3 (FSR3)", loc: "Lateral Arch",  avg: "860",   peak: "1,400", status: "Normal", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
                      { id: "S4 (FSR4)", loc: "Medial Ball",   avg: "1,480", peak: "2,200", status: "Moderate", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
                      { id: "S5 (FSR5)", loc: "Lateral Ball",  avg: "1,320", peak: "2,010", status: "Moderate", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
                      { id: "S6 (FSR6)", loc: "Toe",           avg: "640",   peak: "1,080", status: "Normal", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
                    ].map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200">{row.id}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.loc}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{row.avg}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.peak}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${row.color}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Clinical Summary
            </h3>
            <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/20 leading-relaxed text-slate-700 dark:text-slate-300 dark:border-slate-800">
                <p className="mb-4 font-bold">The patient has maintained high adherence to the monitoring protocol.</p>
                <p>Pressure distribution shows a slight increase in Medial-Heel intensity during the evening hours, which may indicate late-day fatigue. Temperature readings remained within physiological norms (28.5–34.2°C). No high-priority alerts were triggered during this period.</p>
            </div>
          </section>

          <footer className="pt-12 text-center text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-slate-800">
            Powered by IntelliSole AI Core • HIPAA Compliant • {new Date().getFullYear()}
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
}
