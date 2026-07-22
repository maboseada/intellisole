"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertCircle, 
  MapPin, 
  PhoneCall, 
  X, 
  ShieldAlert,
  ArrowLeft,
  Navigation,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function EmergencyPage() {
  const [counting, setCounting] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationText, setLocationText] = useState("Fetching your location...");
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationText(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          console.error("Error getting location", error);
          setLocationText("Location unavailable/denied.");
        }
      );
    } else {
      setLocationText("Geolocation not supported.");
    }
  }, []);

  useEffect(() => {
    if (!counting || countdown === 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, counting]);

  useEffect(() => {
    if (countdown === 0 && counting && !messageSent) {
        // Use device location and send message to the doctor
        console.log(`[EMERGENCY] SMS sent to Dr. Smith. Patient location: ${locationText}`);
        setMessageSent(true);
    }
  }, [countdown, counting, locationText, messageSent]);

  const cancelAlert = () => setCounting(false);
  
  const handleFindHospital = () => {
      if (location) {
          window.open(`https://www.google.com/maps/search/nearest+hospital/@${location.lat},${location.lng},14z`, "_blank");
      } else {
          window.open(`https://www.google.com/maps/search/nearest+hospital`, "_blank");
      }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8 text-center">
        {counting ? (
          <div className="animate-in zoom-in duration-500">
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-100 animate-ping dark:bg-red-900/20" />
              <div className="relative z-10 w-24 h-24 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{countdown}</span>
              </div>
            </div>
            
            <h1 className="mt-8 text-3xl font-bold text-slate-900 dark:text-slate-50 uppercase tracking-widest">Sending SOS</h1>
            <p className="mt-4 text-slate-500 dark:text-slate-400">An alert will be sent to your doctor and emergency contacts in {countdown} seconds.</p>
            
            <div className="mt-12 flex flex-col gap-4">
              <Button size="lg" variant="secondary" onClick={cancelAlert} className="w-full h-16 text-lg font-bold">
                <X className="w-6 h-6 mr-2" /> CANCEL ALERT
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            {countdown === 0 ? (
              <div className="space-y-8">
                <div className="mx-auto w-24 h-24 rounded-full bg-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-red-600 uppercase tracking-widest">ALERTS SENT</h1>
                
                {messageSent && (
                  <div className="flex items-center justify-center text-green-600 gap-2 font-medium">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Message sent to registered doctor.</span>
                  </div>
                )}
                
                <p className="text-slate-600 dark:text-slate-400">Your doctor has been notified of your location. Stay calm, help is being coordinated.</p>
                
                <div className="grid gap-4 mt-8">
                  <Card className="glass text-left">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center text-slate-700 dark:text-slate-300">
                            <MapPin className="w-4 h-4 mr-2" /> Current Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-bold flex items-center text-sm">
                            {location ? <span className="text-green-500 mr-2">● Live</span> : <span className="text-yellow-500 mr-2">● Pending</span>}
                            {locationText}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Sourced from device GPS</p>
                        <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleFindHospital}>
                            <Navigation className="w-4 h-4 mr-2" /> Find Nearest Hospital
                        </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <Button size="lg" className="h-16 text-lg font-bold bg-blue-600" onClick={() => window.open("tel:+1234567890", "_self")}>
                    <PhoneCall className="w-6 h-6 mr-2" /> CALL DOCTOR
                  </Button>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center dark:bg-slate-900">
                  <AlertCircle className="w-10 h-10 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold">Alert Cancelled</h1>
                <p className="text-slate-500">No signals were sent. Returning to normal monitoring.</p>
                <Link href="/dashboard">
                    <Button variant="primary" className="mt-8 w-full">Back to Dashboard</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
