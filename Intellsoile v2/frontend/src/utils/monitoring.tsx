"use client";

import React, { useEffect } from "react";

export const logError = (error: Error, info?: any) => {
  // In a real app, you would send this to Sentry, LogRocket, or a custom Supabase 'logs' table.
  console.error("--- IntelliSole Critical Error ---", {
    message: error.message,
    stack: error.stack,
    componentStack: info?.componentStack,
    timestamp: new Date().toISOString(),
  });
};

export function ErrorMonitor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(event.error);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return <>{children}</>;
}
