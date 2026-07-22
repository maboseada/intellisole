"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  User,
  FileText,
  Loader2,
  BadgeCheck,
  CalendarX,
} from "lucide-react";
import {
  getAvailableSlots,
  getDoctorScheduleSettings,
  getPatientAppointments,
  cancelAppointment,
  bookAppointment,
} from "@/lib/appointments";
import { createClient } from "@/utils/supabase/client";
import type {
  DoctorScheduleSettings,
  TimeSlot,
  Appointment,
} from "@/types/appointments";
import { DAYS_ARABIC, AVAILABILITY_STATUS_LABELS } from "@/types/appointments";

// ─── Constants ────────────────────────────────────────────
// TODO: Replace with actual doctor_id if dynamic
const MOCK_DOCTOR_ID = "doctor-uuid-here";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "م" : "ص";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Status badge ─────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "قيد الانتظار", bg: "#fef9c3", text: "#ca8a04" },
  confirmed: { label: "مؤكد", bg: "#dcfce7", text: "#16a34a" },
  cancelled: { label: "ملغي", bg: "#fee2e2", text: "#dc2626" },
  completed: { label: "مكتمل", bg: "#e0e7ff", text: "#4f46e5" },
  no_show: { label: "لم يحضر", bg: "#fde8d8", text: "#ea580c" },
};

export default function BookingPage() {
  const today = new Date();

  // ─ State ─
  const [patientId, setPatientId] = useState<string | null>(null);
  const [settings, setSettings] = useState<DoctorScheduleSettings | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  const [step, setStep] = useState<"calendar" | "slots" | "form" | "success">("calendar");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<"book" | "myappointments">("book");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ─ Load doctor settings + patient ─
  useEffect(() => {
    const fetchUserAndSettings = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setPatientId(data.user.id);
        loadMyAppointments(data.user.id);
      }
      getDoctorScheduleSettings(MOCK_DOCTOR_ID).then(setSettings);
    };
    fetchUserAndSettings();
  }, []);

  const loadMyAppointments = async (id: string = patientId!) => {
    if (!id) return;
    const appts = await getPatientAppointments(id);
    setMyAppointments(appts);
  };

  // ─ Load slots when date selected ─
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    getAvailableSlots(MOCK_DOCTOR_ID, formatDate(selectedDate)).then((s) => {
      setSlots(s);
      setLoadingSlots(false);
      setStep("slots");
    });
  }, [selectedDate]);

  // ─ Calendar helpers ─
  const getDaysInMonth = useCallback((year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0=Sun
  }, []);

  const isDateDisabled = (date: Date): boolean => {
    if (!settings) return true;
    const diff = date.getTime() - today.getTime();
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) return true; // past
    if (daysDiff > settings.max_advance_days) return true;
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    return !settings.working_days.includes(dayName);
  };

  const doctorStatus = settings
    ? AVAILABILITY_STATUS_LABELS[settings.availability_status]
    : null;

  const isDoctorOpen = settings?.availability_status === "available";

  // ─ Book appointment ─
  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !patientId) return;
    setLoadingBook(true);
    setError(null);
    const { data, error: err } = await bookAppointment({
      patient_id: patientId,
      doctor_id: MOCK_DOCTOR_ID,
      appointment_date: formatDate(selectedDate),
      start_time: selectedSlot.start_time + ":00",
      end_time: selectedSlot.end_time + ":00",
      chief_complaint: chiefComplaint || undefined,
      notes: notes || undefined,
      appointment_type: settings?.consultation_type === "online" ? "online" : "in_person",
    });
    setLoadingBook(false);
    if (err) {
      setError(err);
      return;
    }
    setBookedAppointment(data);
    setStep("success");
    loadMyAppointments();
  };

  // ─ Cancel appointment ─
  const handleCancel = async (id: string) => {
    if (!patientId) return;
    const { error: err } = await cancelAppointment(id, patientId, cancelReason);
    if (!err) {
      setCancellingId(null);
      setCancelReason("");
      loadMyAppointments();
    }
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="animate-in fade-in duration-500" style={{ direction: "rtl" }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            حجز موعد طبي
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            احجز موعدك الآن مع الطبيب المعالج
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
          {[
            { key: "book", label: "احجز موعد", icon: Calendar },
            { key: "myappointments", label: "مواعيدي", icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as "book" | "myappointments")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: activeTab === key
                  ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                  : "transparent",
                color: activeTab === key ? "#fff" : "#64748b",
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ─── TAB: BOOK ─────────────────────────────────── */}
        {activeTab === "book" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Doctor Info Card */}
            <div
              className="lg:col-span-1 rounded-3xl p-6 border"
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                borderColor: "#334155",
              }}
            >
              {/* Doctor avatar */}
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                >
                  <User className="w-12 h-12" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {settings?.clinic_name || "عيادة الدكتور"}
                </h2>
                <p className="text-slate-400 text-sm mt-1">أخصائي القدم السكرية</p>

                {/* Status badge */}
                {doctorStatus && (
                  <div
                    className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"
                    style={{
                      background: isDoctorOpen ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: doctorStatus.color,
                      border: `1px solid ${doctorStatus.color}30`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: doctorStatus.color }}
                    />
                    {doctorStatus.label}
                  </div>
                )}

                {settings?.unavailability_reason && !isDoctorOpen && (
                  <p className="text-slate-400 text-xs mt-2 bg-slate-800 px-3 py-1.5 rounded-xl">
                    {settings.unavailability_reason}
                  </p>
                )}
              </div>

              {/* Info list */}
              <div className="space-y-3">
                {settings?.clinic_address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{settings.clinic_address}</span>
                  </div>
                )}
                {settings?.clinic_phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-slate-300" dir="ltr">{settings.clinic_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    {settings
                      ? `${parseTime(settings.default_start_time)} – ${parseTime(settings.default_end_time)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    مدة الجلسة: {settings?.slot_duration_minutes ?? 30} دقيقة
                  </span>
                </div>
                {settings?.consultation_type !== "in_person" && (
                  <div className="flex items-center gap-3 text-sm">
                    <Video className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">
                      {settings?.consultation_type === "online"
                        ? "استشارة عن بُعد"
                        : "حضوري أو عن بُعد"}
                    </span>
                  </div>
                )}
              </div>

              {/* Working days */}
              {settings && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    أيام العمل
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(DAYS_ARABIC).map(([en, ar]) => {
                      const isWorking = settings.working_days.includes(en);
                      return (
                        <span
                          key={en}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium"
                          style={{
                            background: isWorking ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
                            color: isWorking ? "#93c5fd" : "#475569",
                          }}
                        >
                          {ar}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Doctor unavailable notice */}
              {settings && !isDoctorOpen && (
                <div
                  className="flex items-center gap-3 p-4 rounded-2xl border"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    borderColor: "rgba(239,68,68,0.3)",
                    color: "#ef4444",
                  }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {AVAILABILITY_STATUS_LABELS[settings.availability_status].label}
                    </p>
                    {settings.unavailability_reason && (
                      <p className="text-sm opacity-80 mt-0.5">{settings.unavailability_reason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP: Calendar */}
              {(step === "calendar" || step === "slots" || step === "form") && isDoctorOpen && (
                <div
                  className="rounded-3xl border p-6"
                  style={{
                    background: "var(--card-bg, #fff)",
                    borderColor: "var(--border-color, #e2e8f0)",
                  }}
                >
                  {/* Calendar header */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() =>
                        setCalendarMonth(
                          new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                        )
                      }
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                      {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                    </h3>
                    <button
                      onClick={() =>
                        setCalendarMonth(
                          new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                        )
                      }
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>

                  {/* Day labels */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAY_NAMES.map((d) => (
                      <div
                        key={d}
                        className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1"
                      >
                        {d.slice(0, 3)}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells before first day */}
                    {Array.from({
                      length: getFirstDayOfMonth(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth()
                      ),
                    }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {Array.from({
                      length: getDaysInMonth(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth()
                      ),
                    }).map((_, i) => {
                      const day = i + 1;
                      const date = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        day
                      );
                      const disabled = isDateDisabled(date);
                      const isSelected =
                        selectedDate && formatDate(date) === formatDate(selectedDate);
                      const isToday = formatDate(date) === formatDate(today);

                      return (
                        <button
                          key={day}
                          disabled={disabled}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                            setStep("slots");
                          }}
                          className="aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 relative"
                          style={{
                            background: isSelected
                              ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                              : isToday && !disabled
                              ? "rgba(59,130,246,0.1)"
                              : "transparent",
                            color: isSelected
                              ? "#fff"
                              : disabled
                              ? "#cbd5e1"
                              : isToday
                              ? "#3b82f6"
                              : "inherit",
                            cursor: disabled ? "not-allowed" : "pointer",
                            border: isToday && !isSelected
                              ? "2px solid rgba(59,130,246,0.4)"
                              : "2px solid transparent",
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP: Time Slots */}
              {(step === "slots" || step === "form") && selectedDate && isDoctorOpen && (
                <div
                  className="rounded-3xl border p-6"
                  style={{
                    background: "var(--card-bg, #fff)",
                    borderColor: "var(--border-color, #e2e8f0)",
                  }}
                >
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
                    المواعيد المتاحة —{" "}
                    {selectedDate.toLocaleDateString("ar-EG", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>جاري تحميل المواعيد...</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">لا توجد مواعيد متاحة في هذا اليوم</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {slots.map((slot) => {
                        const isSelected =
                          selectedSlot?.start_time === slot.start_time;
                        return (
                          <button
                            key={slot.start_time}
                            disabled={!slot.available}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setStep("form");
                            }}
                            className="py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200 text-center"
                            style={{
                              background: isSelected
                                ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                                : slot.available
                                ? "rgba(59,130,246,0.06)"
                                : "rgba(0,0,0,0.04)",
                              color: isSelected
                                ? "#fff"
                                : slot.available
                                ? "#3b82f6"
                                : "#cbd5e1",
                              border: isSelected
                                ? "none"
                                : `1.5px solid ${slot.available ? "rgba(59,130,246,0.2)" : "#e2e8f0"}`,
                              cursor: slot.available ? "pointer" : "not-allowed",
                              textDecoration: !slot.available ? "line-through" : "none",
                            }}
                          >
                            {parseTime(slot.start_time)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP: Booking Form */}
              {step === "form" && selectedSlot && selectedDate && isDoctorOpen && (
                <div
                  className="rounded-3xl border p-6"
                  style={{
                    background: "var(--card-bg, #fff)",
                    borderColor: "var(--border-color, #e2e8f0)",
                  }}
                >
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-5">
                    تأكيد الحجز
                  </h3>

                  {/* Summary */}
                  <div
                    className="flex items-center gap-4 p-4 rounded-2xl mb-5"
                    style={{ background: "rgba(59,130,246,0.06)" }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(59,130,246,0.15)" }}
                    >
                      <Calendar className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {selectedDate.toLocaleDateString("ar-EG", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-blue-500 font-bold">
                        {parseTime(selectedSlot.start_time)} – {parseTime(selectedSlot.end_time)}
                      </p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        سبب الزيارة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="مثال: ألم في القدم، فحص دوري..."
                        className="w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ borderColor: "#e2e8f0" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        ملاحظات إضافية (اختياري)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="أي معلومات إضافية تريد إبلاغ الطبيب بها..."
                        className="w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        style={{ borderColor: "#e2e8f0" }}
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      className="mt-4 flex items-center gap-2 p-3 rounded-xl text-sm"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                    >
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep("slots")}
                      className="flex-1 py-3 rounded-xl border font-semibold text-sm transition-all"
                      style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                    >
                      رجوع
                    </button>
                    <button
                      onClick={handleBook}
                      disabled={loadingBook || !chiefComplaint.trim()}
                      className="flex-2 flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                        flex: 2,
                      }}
                    >
                      {loadingBook ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الحجز...
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="w-4 h-4" />
                          تأكيد الحجز
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: Success */}
              {step === "success" && bookedAppointment && (
                <div
                  className="rounded-3xl border p-8 text-center"
                  style={{
                    background: "var(--card-bg, #fff)",
                    borderColor: "rgba(34,197,94,0.3)",
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: "rgba(34,197,94,0.12)" }}
                  >
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    تم تأكيد الحجز! 🎉
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    تم تسجيل موعدك بنجاح. سنذكّرك قبل الموعد.
                  </p>

                  <div
                    className="inline-flex flex-col items-center gap-1 p-5 rounded-2xl mb-6"
                    style={{ background: "rgba(59,130,246,0.06)" }}
                  >
                    <p className="text-slate-700 dark:text-slate-200 font-semibold">
                      {new Date(bookedAppointment.appointment_date).toLocaleDateString("ar-EG", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-blue-500 text-xl font-bold">
                      {parseTime(bookedAppointment.start_time)} – {parseTime(bookedAppointment.end_time)}
                    </p>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setStep("calendar");
                        setSelectedDate(null);
                        setSelectedSlot(null);
                        setChiefComplaint("");
                        setNotes("");
                        setBookedAppointment(null);
                      }}
                      className="px-6 py-3 rounded-xl font-semibold text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                    >
                      حجز موعد آخر
                    </button>
                    <button
                      onClick={() => setActiveTab("myappointments")}
                      className="px-6 py-3 rounded-xl border font-semibold text-sm"
                      style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                    >
                      عرض مواعيدي
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: MY APPOINTMENTS ───────────────────────── */}
        {activeTab === "myappointments" && (
          <div className="space-y-4">
            {myAppointments.length === 0 ? (
              <div className="text-center py-20">
                <CalendarX className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  لا توجد مواعيد بعد
                </h3>
                <p className="text-slate-400 mb-6">احجز موعدك الأول مع الطبيب</p>
                <button
                  onClick={() => setActiveTab("book")}
                  className="px-6 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                >
                  احجز موعد الآن
                </button>
              </div>
            ) : (
              myAppointments.map((appt) => {
                const statusCfg = STATUS_CONFIG[appt.status];
                const isCancelling = cancellingId === appt.id;
                const canCancel = appt.status === "pending" || appt.status === "confirmed";

                return (
                  <div
                    key={appt.id}
                    className="rounded-2xl border p-5 transition-all hover:shadow-md"
                    style={{
                      background: "var(--card-bg, #fff)",
                      borderColor: "var(--border-color, #e2e8f0)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(59,130,246,0.1)" }}
                        >
                          <Calendar className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {new Date(appt.appointment_date).toLocaleDateString("ar-EG", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-blue-500 font-semibold text-sm">
                            {parseTime(appt.start_time)} – {parseTime(appt.end_time)}
                          </p>
                          {appt.chief_complaint && (
                            <p className="text-slate-500 text-sm mt-1">{appt.chief_complaint}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: statusCfg.bg, color: statusCfg.text }}
                        >
                          {statusCfg.label}
                        </span>
                        {canCancel && !isCancelling && (
                          <button
                            onClick={() => setCancellingId(appt.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cancel form */}
                    {isCancelling && (
                      <div
                        className="mt-4 pt-4 border-t space-y-3"
                        style={{ borderColor: "#fee2e2" }}
                      >
                        <p className="text-red-600 text-sm font-semibold">
                          هل أنت متأكد من إلغاء هذا الموعد؟
                        </p>
                        <input
                          type="text"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="سبب الإلغاء (اختياري)..."
                          className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                          style={{ borderColor: "#fca5a5" }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCancellingId(null);
                              setCancelReason("");
                            }}
                            className="px-4 py-2 rounded-xl border text-sm font-semibold"
                            style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                          >
                            لا، تراجع
                          </button>
                          <button
                            onClick={() => handleCancel(appt.id)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                            style={{ background: "#ef4444" }}
                          >
                            نعم، ألغِ الموعد
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
