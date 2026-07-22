"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SensorPointProps {
  x: number;
  y: number;
  value: number; // 0 to 4095 (ESP32 ADC range)
  label: string;
  index: number;
  isLegacy?: boolean; // sensor was not present in old data
}

const SensorPoint = ({ x, y, value, label, index, isLegacy }: SensorPointProps) => {
  // Normalize value to percentage
  const intensity = Math.min(100, (value / 4095) * 100);

  // Calculate color based on intensity (Green → Amber → Red)
  const getColor = (p: number) => {
    if (isLegacy && value === 0) return "fill-slate-300/40 dark:fill-slate-700/40";
    if (p < 30) return "fill-emerald-400/70";
    if (p < 70) return "fill-amber-400/80";
    return "fill-rose-500 animate-pulse";
  };

  const glowColor = isLegacy && value === 0
    ? "fill-slate-200/20 dark:fill-slate-700/20"
    : intensity < 30
      ? "fill-emerald-400/30"
      : intensity < 70
        ? "fill-amber-400/30"
        : "fill-rose-500/40";

  const sensorLabels = ["S1", "S2", "S3", "S4", "S5", "S6"];

  return (
    <g className="sensor-group">
      {/* Glow halo */}
      <circle
        cx={x}
        cy={y}
        r={20 + intensity / 8}
        className={cn("transition-all duration-500 ease-out blur-[6px] opacity-50", glowColor)}
      />
      {/* Main dot */}
      <circle
        cx={x}
        cy={y}
        r={13}
        className={cn(
          "transition-all duration-300 stroke-white/60 stroke-[1.5]",
          getColor(intensity)
        )}
      />
      {/* Sensor number badge */}
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className="text-[9px] font-black fill-white/90 select-none"
      >
        {sensorLabels[index]}
      </text>
      {/* Label below */}
      <text
        x={x}
        y={y + 28}
        textAnchor="middle"
        className="text-[9px] font-bold fill-slate-500 dark:fill-slate-400 uppercase tracking-wider select-none"
      >
        {label}
      </text>
      {/* Value */}
      <text
        x={x}
        y={y + 40}
        textAnchor="middle"
        className="text-[8px] fill-slate-400 dark:fill-slate-500 select-none"
      >
        {isLegacy && value === 0 ? "N/A" : value}
      </text>
    </g>
  );
};

interface HeatmapProps {
  /** Array of 6 FSR values [heel, medArch, latArch, medBall, latBall, toe].
   *  Old 4-sensor data (fsr5/fsr6 missing) is handled gracefully — slots 4 & 5 show "N/A". */
  sensors: number[];
  className?: string;
}

// Config: label, x, y position inside the 200×400 SVG viewBox
const SENSOR_CONFIG = [
  { label: "Heel",     x: 100, y: 340 },
  { label: "Med Arch", x:  72, y: 250 },
  { label: "Lat Arch", x: 128, y: 250 },
  { label: "Med Ball", x:  82, y: 155 },
  { label: "Lat Ball", x: 122, y: 148 },
  { label: "Toe",      x: 100, y:  65 },
];

export function FootHeatmap({ sensors, className }: HeatmapProps) {
  // Pad to 6 if old data only has 4
  const padded = [...sensors];
  while (padded.length < 6) padded.push(0);

  // Detect legacy (4-sensor) data — fsr5 & fsr6 were explicitly 0 and missing
  const isLegacy = sensors.length <= 4;

  return (
    <div className={cn("relative w-full max-w-[280px] aspect-[1/2] mx-auto", className)}>
      <svg
        viewBox="0 0 200 400"
        className="w-full h-full drop-shadow-2xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Foot Outline */}
        <path
          d="M100 20C70 20 40 40 40 100C40 140 55 170 60 200C65 230 50 300 50 350C50 380 70 390 100 390C130 390 150 380 150 350C150 300 135 230 140 200C145 170 160 140 160 100C160 40 130 20 100 20Z"
          className="stroke-slate-200 fill-white/10 dark:stroke-slate-700 dark:fill-slate-800/40"
          strokeWidth="2.5"
        />

        {SENSOR_CONFIG.map((cfg, i) => (
          <SensorPoint
            key={i}
            index={i}
            x={cfg.x}
            y={cfg.y}
            value={padded[i] ?? 0}
            label={cfg.label}
            isLegacy={isLegacy && i >= 4}
          />
        ))}
      </svg>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none rounded-3xl" />

      {/* Legacy badge */}
      {isLegacy && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Legacy 4-sensor data
          </span>
        </div>
      )}
    </div>
  );
}
