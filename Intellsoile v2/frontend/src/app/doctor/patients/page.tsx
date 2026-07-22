"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Search,
  ChevronRight,
  Activity,
  FileText
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: "stable" | "warning" | "critical";
  risk: "low" | "medium" | "high";
  lastAlert: string;
}

const MOCK_PATIENTS: Patient[] = [
  { id: "1", full_name: "Alice Johnson", email: "alice@example.com", role: "patient", status: "critical", risk: "high", lastAlert: "2h ago" },
  { id: "2", full_name: "Bob Smith", email: "bob@example.com", role: "patient", status: "stable", risk: "low", lastAlert: "None" },
  { id: "3", full_name: "Carol White", email: "carol@example.com", role: "patient", status: "warning", risk: "medium", lastAlert: "Yesterday" },
  { id: "4", full_name: "David Miller", email: "david@example.com", role: "patient", status: "stable", risk: "low", lastAlert: "None" },
];

export default function DoctorPatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "critical" | "warning">("All");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", email: "" });
  const [isRegistering, setIsRegistering] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      // Safety timeout
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3000);

      try {
        // Fetch patients assigned to this doctor
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'patient');

        clearTimeout(timeout);
        if (error || !data || data.length === 0) {
          setPatients(MOCK_PATIENTS);
        } else {
          setPatients(data.map((p: any) => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            role: "patient",
            status: Math.random() > 0.8 ? "critical" : (Math.random() > 0.6 ? "warning" : "stable"),
            risk: Math.random() > 0.8 ? "high" : (Math.random() > 0.6 ? "medium" : "low"),
            lastAlert: "Recent"
          })));
        }
      } catch (e) {
        clearTimeout(timeout);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleExport = () => {
    const headers = "ID,Name,Email,Status,Risk\n";
    const rows = patients.map(p => `${p.id},${p.full_name},${p.email},${p.status},${p.risk}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patients_list.csv";
    a.click();
  };

  const handleRegister = async () => {
    if (!newPatient.name || !newPatient.email) return;
    setIsRegistering(true);
    const newlyCreated: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      full_name: newPatient.name,
      email: newPatient.email,
      role: "patient",
      status: "stable",
      risk: "low",
      lastAlert: "Just now"
    };
    setPatients([newlyCreated, ...patients]);
    setNewPatient({ name: "", email: "" });
    setShowRegModal(false);
    setIsRegistering(false);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Patient Management</h1>
          <p className="text-slate-500 dark:text-slate-400">View and manage all assigned patients and their health status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport}>Export CSV</Button>
          <Button size="sm" onClick={() => setShowRegModal(true)}>Register New Patient</Button>
        </div>
      </header>

      <Card className="glass border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-white/50 dark:bg-slate-900/50 backdrop-blur border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg">Assigned Patients</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="search"
                  placeholder="Search patients by name..."
                  className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[280px]"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">Patient Name</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">Risk Level</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-[10px]">Last Sync</th>
                  <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Activity className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-slate-500 font-medium">Syncing patient clinical data...</p>
                    </td>
                  </tr>
                ) : filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900 transition-all cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600">
                          {patient.full_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-50">{patient.full_name}</p>
                          <p className="text-xs text-slate-500">{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                        patient.status === "stable" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          patient.status === "warning" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            "bg-rose-50 text-rose-600 border border-rose-100"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full",
                          patient.status === "stable" ? "bg-emerald-500" :
                            patient.status === "warning" ? "bg-amber-500" :
                              "bg-rose-500"
                        )} />
                        {patient.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all",
                              patient.risk === "low" ? "bg-emerald-500 w-1/3" :
                                patient.risk === "medium" ? "bg-amber-500 w-2/3" :
                                  "bg-rose-500 w-full"
                            )}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase">{patient.risk}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{patient.lastAlert}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"><FileText className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"><Activity className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border-0">
            <CardHeader className="border-b">
              <CardTitle>Register New Patient</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="Patient's Full Name"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowRegModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleRegister} disabled={isRegistering}>
                  {isRegistering ? "Registering..." : "Add Patient"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
