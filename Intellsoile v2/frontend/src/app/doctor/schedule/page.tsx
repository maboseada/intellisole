"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Settings,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Phone,
  Building2,
  ListChecks,
  CalendarX,
  ChevronRight,
  Eye,
} from "lucide-react";
import {
  getDoctorScheduleSettings,
  upsertDoctorScheduleSettings,
  getDoctorClosedDays,
  addDoctorClosedDay,
  removeDoctorClosedDay,
  getDoctorAppointments,
  updateAppointmentStatus,
} from "@/lib/appointments";
import type {
  DoctorScheduleSettings,
  DoctorClosedDay,
  Appointment,
  DoctorAvailabilityStatus,
} from "@/types/appointments";
import {
  DAYS_ARABIC,
  AVAILABILITY_STATUS_LABELS,
  DEFAULT_SCHEDULE_SETTINGS,
} from "@/types/appointments";

// TODO: Replace with actual doctor_id from auth session
const MOCK_DOCTOR_ID = "doctor-uuid-here";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: { label: "قيد الانتظار", bg: "#fef9c3", text: "#ca8a04", border: "#fde047" },
  confirmed: { label: "مؤكد", bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
  cancelled: { label: "ملغي", bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  completed: { label: "مكتمل", bg: "#e0e7ff", text: "#4f46e5", border: "#a5b4fc" },
  no_show: { label: "لم يحضر", bg: "#fde8d8", text: "#ea580c", border: "#fdba74" },
};

function parseTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "م" : "ص";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type ActiveTab = "overview" | "settings" | "closed_days";

export default function DoctorSchedulePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [settings, setSettings] = useState<DoctorScheduleSettings | null>(null);
  const [draftSettings, setDraftSettings] = useState<Partial<DoctorScheduleSettings>>({});
  const [closedDays, setClosedDays] = useState<DoctorClosedDay[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newClosedDate, setNewClosedDate] = useState("");
  const [newClosedReason, setNewClosedReason] = useState("");
  const [addingClosedDay, setAddingClosedDay] = useState(false);

  const today = formatDate(new Date());

  // ─ Load data ─
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [s, cd, todayAppts, allAppts] = await Promise.all([
      getDoctorScheduleSettings(MOCK_DOCTOR_ID),
      getDoctorClosedDays(MOCK_DOCTOR_ID),
      getDoctorAppointments(MOCK_DOCTOR_ID, today),
      getDoctorAppointments(MOCK_DOCTOR_ID),
    ]);

    const merged = { ...DEFAULT_SCHEDULE_SETTINGS, ...s };
    setSettings(merged as DoctorScheduleSettings);
    setDraftSettings(merged);
    setClosedDays(cd);
    setTodayAppointments(todayAppts);
    setAllAppointments(allAppts);
    setLoading(false);
  };

  // ─ Quick status change ─
  const handleQuickStatusChange = async (status: DoctorAvailabilityStatus, reason?: string) => {
    setSaving(true);
    await upsertDoctorScheduleSettings(MOCK_DOCTOR_ID, {
      availability_status: status,
      unavailability_reason: reason ?? null,
    });
    await loadAll();
    setSaving(false);
  };

  // ─ Save full settings ─
  const handleSaveSettings = async () => {
    setSaving(true);
    await upsertDoctorScheduleSettings(MOCK_DOCTOR_ID, draftSettings);
    setSaveSuccess(true);
    await loadAll();
    setSaving(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // ─ Toggle working day ─
  const toggleDay = (day: string) => {
    const current = (draftSettings.working_days as string[]) ?? [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setDraftSettings((prev) => ({ ...prev, working_days: updated }));
  };

  // ─ Add closed day ─
  const handleAddClosedDay = async () => {
    if (!newClosedDate) return;
    setAddingClosedDay(true);
    await addDoctorClosedDay(MOCK_DOCTOR_ID, newClosedDate, newClosedReason || undefined);
    setNewClosedDate("");
    setNewClosedReason("");
    const cd = await getDoctorClosedDays(MOCK_DOCTOR_ID);
    setClosedDays(cd);
    setAddingClosedDay(false);
  };

  // ─ Remove closed day ─
  const handleRemoveClosedDay = async (id: string) => {
    await removeDoctorClosedDay(id);
    const cd = await getDoctorClosedDays(MOCK_DOCTOR_ID);
    setClosedDays(cd);
  };

  // ─ Update appointment ─
  const handleUpdateStatus = async (
    id: string,
    status: Appointment["status"]
  ) => {
    await updateAppointmentStatus(id, status);
    await loadAll();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32 gap-3 text-slate-400" dir="rtl">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-lg">جاري التحميل...</span>
        </div>
      </DashboardLayout>
    );
  }

  const doctorStatus = settings
    ? AVAILABILITY_STATUS_LABELS[settings.availability_status]
    : null;

  const pendingCount = allAppointments.filter((a) => a.status === "pending").length;
  const todayCount = todayAppointments.filter((a) => a.status !== "cancelled").length;

  return (
    <DashboardLayout>
      <div className="animate-in fade-in duration-500" style={{ direction: "rtl" }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              إدارة الحجوزات
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              تحكم في جدول مواعيدك وإعدادات الحجز
            </p>
          </div>

          {/* Quick status controls */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { s: "available", label: "متاح", color: "#22c55e" },
                { s: "closed_today", label: "مغلق اليوم", color: "#ef4444" },
                { s: "unavailable", label: "غير متاح", color: "#f97316" },
                { s: "on_leave", label: "إجازة", color: "#8b5cf6" },
              ] as Array<{ s: DoctorAvailabilityStatus; label: string; color: string }>
            ).map(({ s, label, color }) => (
              <button
                key={s}
                onClick={() =>
                  handleQuickStatusChange(
                    s,
                    s !== "available" ? label : undefined
                  )
                }
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background:
                    settings?.availability_status === s
                      ? color
                      : `${color}18`,
                  color:
                    settings?.availability_status === s ? "#fff" : color,
                  border: `1.5px solid ${color}40`,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status banner */}
        {doctorStatus && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl mb-6 border"
            style={{
              background: `${doctorStatus.color}12`,
              borderColor: `${doctorStatus.color}30`,
            }}
          >
            <div
              className="w-3 h-3 rounded-full animate-pulse flex-shrink-0"
              style={{ background: doctorStatus.color }}
            />
            <span className="font-semibold" style={{ color: doctorStatus.color }}>
              الحالة الحالية: {doctorStatus.label}
            </span>
            {settings?.unavailability_reason && (
              <span className="text-slate-500 text-sm">
                — {settings.unavailability_reason}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "مواعيد اليوم", value: todayCount, icon: Calendar, color: "#3b82f6" },
            { label: "في الانتظار", value: pendingCount, icon: Clock, color: "#f59e0b" },
            {
              label: "هذا الشهر",
              value: allAppointments.filter(
                (a) =>
                  a.appointment_date.startsWith(
                    today.substring(0, 7)
                  ) && a.status !== "cancelled"
              ).length,
              icon: ListChecks,
              color: "#8b5cf6",
            },
            {
              label: "مكتملة",
              value: allAppointments.filter((a) => a.status === "completed").length,
              icon: CheckCircle,
              color: "#22c55e",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl p-4 border"
              style={{
                background: `${color}0d`,
                borderColor: `${color}25`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-3xl font-black" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
          {[
            { key: "overview", label: "المواعيد", icon: Calendar },
            { key: "settings", label: "الإعدادات", icon: Settings },
            { key: "closed_days", label: "أيام الإغلاق", icon: CalendarX },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as ActiveTab)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background:
                  activeTab === key
                    ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                    : "transparent",
                color: activeTab === key ? "#fff" : "#64748b",
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === "overview" && pendingCount > 0 && (
                <span
                  className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-black"
                  style={{
                    background: activeTab === key ? "rgba(255,255,255,0.3)" : "#f59e0b",
                    color: activeTab === key ? "#fff" : "#fff",
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB: OVERVIEW (appointments) ────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {allAppointments.length === 0 ? (
              <div className="text-center py-20">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-500">
                  لا توجد حجوزات بعد
                </h3>
              </div>
            ) : (
              allAppointments.map((appt) => {
                const cfg = STATUS_CONFIG[appt.status];
                const isToday = appt.appointment_date === today;

                return (
                  <div
                    key={appt.id}
                    className="rounded-2xl border p-5 transition-all hover:shadow-md"
                    style={{
                      background: "var(--card-bg, #fff)",
                      borderColor: isToday ? "#3b82f640" : "var(--border-color, #e2e8f0)",
                      boxShadow: isToday ? "0 0 0 2px rgba(59,130,246,0.12)" : undefined,
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                          style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                        >
                          {(appt.patient?.full_name ?? "م")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 dark:text-white">
                              {appt.patient?.full_name ?? "مريض"}
                            </p>
                            {isToday && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-bold"
                                style={{
                                  background: "rgba(59,130,246,0.12)",
                                  color: "#3b82f6",
                                }}
                              >
                                اليوم
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-sm">
                            {new Date(appt.appointment_date).toLocaleDateString("ar-EG", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}{" "}
                            — {parseTime(appt.start_time)}
                          </p>
                          {appt.chief_complaint && (
                            <p className="text-blue-600 dark:text-blue-400 text-sm mt-0.5 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {appt.chief_complaint}
                            </p>
                          )}
                          {appt.patient?.phone_number && (
                            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1" dir="ltr">
                              <Phone className="w-3 h-3" />
                              {appt.patient.phone_number}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: cfg.bg, color: cfg.text }}
                        >
                          {cfg.label}
                        </span>

                        {/* Action buttons based on status */}
                        {appt.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "confirmed")}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1"
                              style={{ background: "#22c55e" }}
                            >
                              <CheckCircle className="w-3 h-3" /> تأكيد
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1"
                              style={{ background: "#ef4444" }}
                            >
                              <XCircle className="w-3 h-3" /> رفض
                            </button>
                          </>
                        )}
                        {appt.status === "confirmed" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "completed")}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1"
                              style={{ background: "#6366f1" }}
                            >
                              <CheckCircle className="w-3 h-3" /> مكتمل
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "no_show")}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold"
                              style={{ background: "#fde8d8", color: "#ea580c" }}
                            >
                              لم يحضر
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── TAB: SETTINGS ───────────────────────────────── */}
        {activeTab === "settings" && (
          <div
            className="rounded-3xl border p-6 md:p-8 space-y-8"
            style={{
              background: "var(--card-bg, #fff)",
              borderColor: "var(--border-color, #e2e8f0)",
            }}
          >
            {/* Section: Clinic info */}
            <section>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                معلومات العيادة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="اسم العيادة"
                  value={draftSettings.clinic_name ?? ""}
                  onChange={(v) => setDraftSettings((p) => ({ ...p, clinic_name: v }))}
                  placeholder="مثال: عيادة دكتور أحمد"
                />
                <InputField
                  label="رقم الهاتف"
                  value={draftSettings.clinic_phone ?? ""}
                  onChange={(v) => setDraftSettings((p) => ({ ...p, clinic_phone: v }))}
                  placeholder="+20 1xx xxx xxxx"
                  dir="ltr"
                />
                <div className="md:col-span-2">
                  <InputField
                    label="عنوان العيادة"
                    value={draftSettings.clinic_address ?? ""}
                    onChange={(v) => setDraftSettings((p) => ({ ...p, clinic_address: v }))}
                    placeholder="مثال: شارع التحرير، الدور الثالث، القاهرة"
                  />
                </div>
              </div>
            </section>

            {/* Section: Consultation type */}
            <section>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-500" />
                نوع الاستشارة
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { val: "in_person", label: "حضوري فقط", icon: Building2 },
                    { val: "online", label: "عن بُعد فقط", icon: Video },
                    { val: "both", label: "حضوري أو عن بُعد", icon: Users },
                  ] as const
                ).map(({ val, label, icon: Icon }) => (
                  <button
                    key={val}
                    onClick={() =>
                      setDraftSettings((p) => ({ ...p, consultation_type: val }))
                    }
                    className="py-4 rounded-2xl border font-semibold text-sm flex flex-col items-center gap-2 transition-all"
                    style={{
                      background:
                        draftSettings.consultation_type === val
                          ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                          : "transparent",
                      color:
                        draftSettings.consultation_type === val ? "#fff" : "#64748b",
                      borderColor:
                        draftSettings.consultation_type === val
                          ? "transparent"
                          : "#e2e8f0",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>

              {(draftSettings.consultation_type === "online" ||
                draftSettings.consultation_type === "both") && (
                <div className="mt-3">
                  <InputField
                    label="رابط الاجتماع (Zoom / Google Meet)"
                    value={draftSettings.meeting_link ?? ""}
                    onChange={(v) => setDraftSettings((p) => ({ ...p, meeting_link: v }))}
                    placeholder="https://meet.google.com/xxx"
                    dir="ltr"
                  />
                </div>
              )}
            </section>

            {/* Section: Time settings */}
            <section>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                إعدادات الوقت
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    وقت بداية العمل
                  </label>
                  <input
                    type="time"
                    value={
                      (draftSettings.default_start_time ?? "09:00:00").substring(0, 5)
                    }
                    onChange={(e) =>
                      setDraftSettings((p) => ({
                        ...p,
                        default_start_time: e.target.value + ":00",
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: "#e2e8f0" }}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    وقت انتهاء العمل
                  </label>
                  <input
                    type="time"
                    value={
                      (draftSettings.default_end_time ?? "17:00:00").substring(0, 5)
                    }
                    onChange={(e) =>
                      setDraftSettings((p) => ({
                        ...p,
                        default_end_time: e.target.value + ":00",
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: "#e2e8f0" }}
                    dir="ltr"
                  />
                </div>
                <NumberField
                  label="مدة الجلسة (دقيقة)"
                  value={draftSettings.slot_duration_minutes ?? 30}
                  onChange={(v) =>
                    setDraftSettings((p) => ({ ...p, slot_duration_minutes: v }))
                  }
                  min={10}
                  max={120}
                  step={5}
                />
                <NumberField
                  label="وقت الراحة بين المرضى (دقيقة)"
                  value={draftSettings.buffer_minutes ?? 0}
                  onChange={(v) =>
                    setDraftSettings((p) => ({ ...p, buffer_minutes: v }))
                  }
                  min={0}
                  max={60}
                  step={5}
                />
                <NumberField
                  label="أقصى مواعيد يومياً"
                  value={draftSettings.max_appointments_per_day ?? 20}
                  onChange={(v) =>
                    setDraftSettings((p) => ({
                      ...p,
                      max_appointments_per_day: v,
                    }))
                  }
                  min={1}
                  max={100}
                />
                <NumberField
                  label="أقصى حجز مسبق (يوم)"
                  value={draftSettings.max_advance_days ?? 30}
                  onChange={(v) =>
                    setDraftSettings((p) => ({ ...p, max_advance_days: v }))
                  }
                  min={1}
                  max={90}
                />
              </div>
            </section>

            {/* Section: Working days */}
            <section>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                أيام العمل
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(DAYS_ARABIC).map(([en, ar]) => {
                  const isActive = (
                    (draftSettings.working_days as string[]) ?? []
                  ).includes(en);
                  return (
                    <button
                      key={en}
                      onClick={() => toggleDay(en)}
                      className="px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, #22c55e, #16a34a)"
                          : "rgba(0,0,0,0.04)",
                        color: isActive ? "#fff" : "#94a3b8",
                        border: `2px solid ${isActive ? "transparent" : "#e2e8f0"}`,
                      }}
                    >
                      {ar}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Save button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60"
                style={{
                  background: saveSuccess
                    ? "#22c55e"
                    : "linear-gradient(135deg, #3b82f6, #6366f1)",
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    تم الحفظ بنجاح!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ الإعدادات
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB: CLOSED DAYS ────────────────────────────── */}
        {activeTab === "closed_days" && (
          <div className="space-y-6">
            {/* Add closed day form */}
            <div
              className="rounded-3xl border p-6"
              style={{
                background: "var(--card-bg, #fff)",
                borderColor: "var(--border-color, #e2e8f0)",
              }}
            >
              <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" />
                إضافة يوم إغلاق
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={newClosedDate}
                    min={today}
                    onChange={(e) => setNewClosedDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                    style={{ borderColor: "#e2e8f0" }}
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <InputField
                    label="سبب الإغلاق (اختياري)"
                    value={newClosedReason}
                    onChange={setNewClosedReason}
                    placeholder="مثال: إجازة رسمية، مؤتمر طبي..."
                  />
                </div>
              </div>
              <button
                onClick={handleAddClosedDay}
                disabled={!newClosedDate || addingClosedDay}
                className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {addingClosedDay ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    إضافة يوم الإغلاق
                  </>
                )}
              </button>
            </div>

            {/* Closed days list */}
            <div
              className="rounded-3xl border overflow-hidden"
              style={{
                background: "var(--card-bg, #fff)",
                borderColor: "var(--border-color, #e2e8f0)",
              }}
            >
              <div className="p-5 border-b" style={{ borderColor: "#f1f5f9" }}>
                <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <CalendarX className="w-5 h-5 text-red-500" />
                  أيام الإغلاق المجدولة ({closedDays.length})
                </h2>
              </div>

              {closedDays.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-500">لا توجد أيام إغلاق مجدولة</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                  {closedDays.map((day) => {
                    const d = new Date(day.closed_date + "T00:00:00");
                    const isPast = d < new Date();
                    return (
                      <div
                        key={day.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        style={{ opacity: isPast ? 0.5 : 1 }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(239,68,68,0.1)" }}
                          >
                            <CalendarX className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {d.toLocaleDateString("ar-EG", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            {day.reason && (
                              <p className="text-slate-500 text-sm">{day.reason}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveClosedDay(day.id)}
                          className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Reusable form components ─────────────────────────────
function InputField({
  label,
  value,
  onChange,
  placeholder,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ borderColor: "#e2e8f0" }}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ borderColor: "#e2e8f0" }}
        dir="ltr"
      />
    </div>
  );
}
