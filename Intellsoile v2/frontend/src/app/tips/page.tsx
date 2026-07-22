"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Search, 
  Lightbulb, 
  Bookmark,
  Share2,
  Clock,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Apple,
  Footprints
} from "lucide-react";

// Mock tips data
const tips = [
  { 
    id: "1", 
    title: "Daily Foot Inspection Guide", 
    category: "Prevention", 
    author: "Dr. Smith", 
    readTime: "5 min", 
    icon: Stethoscope,
    content: "Checking your feet every day is the most important thing you can do to prevent complications. Look for any redness, swelling, blisters, or cuts. Use a mirror to see the bottom of your feet if needed. If you find anything unusual, contact your healthcare provider immediately. Remember that nerve damage might mean you don't feel pain even if there's an injury."
  },
  { 
    id: "2", 
    title: "Best Footwear for Neuropathy", 
    category: "Foot Care", 
    author: "Dr. Johnson", 
    readTime: "8 min", 
    icon: Footprints,
    content: "Proper footwear provides a protective barrier for your feet. Avoid walking barefoot, even at home. Choose shoes that have a wide toe box, good arch support, and soft interiors with no prominent seams. Always wear socks with your shoes to prevent friction. Shake out your shoes before putting them on to ensure no small objects are inside."
  },
  { 
    id: "3", 
    title: "Dietary Habits for Blood Flow", 
    category: "Nutrition", 
    author: "Dr. Lee", 
    readTime: "12 min", 
    icon: Apple,
    content: "What you eat directly affects your circulation. Focus on foods rich in omega-3 fatty acids, like salmon and walnuts, which help reduce inflammation. Garlic and leafy greens are excellent for improving vascular health. Staying hydrated is also crucial for maintaining blood volume and flow. Limit highly processed sugars which can damage small blood vessels over time."
  },
  { 
    id: "4", 
    title: "Safe Exercises for Patients", 
    category: "Exercise", 
    author: "Dr. Garcia", 
    readTime: "10 min", 
    icon: TrendingUp,
    content: "Staying active helps maintain healthy circulation and nerve function. Low-impact exercises like swimming, cycling, or seated yoga are ideal as they don't put excessive pressure on your feet. Always check your feet before and after any physical activity. Wear moisture-wicking socks to keep your feet dry and reduce the risk of fungal infections."
  },
];

export default function MedicalTipsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedTip, setSelectedTip] = useState<any>(null);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Medical Insights & Tips</h1>
            <p className="text-slate-500 dark:text-slate-400">Curated advice from professional doctors to keep your feet healthy.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Search health tips..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </header>

        <section className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {["All", "Prevention", "Foot Care", "Nutrition", "Exercise"].map((cat) => (
                <Button 
                    key={cat} 
                    variant={activeCategory === cat ? "primary" : "outline"} 
                    className="rounded-full"
                    onClick={() => setActiveCategory(cat)}
                >
                    {cat}
                </Button>
            ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
            {tips.map((tip) => {
                const Icon = tip.icon;
                return (
                    <Card key={tip.id} className="glass group hover:-translate-y-1 transition-all">
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/20">
                                <Icon className="w-6 h-6" />
                            </div>
                            <Badge variant="secondary">{tip.category}</Badge>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="text-xl mb-2">{tip.title}</CardTitle>
                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {tip.readTime}</span>
                                <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> By {tip.author}</span>
                            </div>
                            <div className="mt-8 flex items-center justify-between">
                                <Button 
                                    variant="ghost" 
                                    className="p-0 hover:bg-transparent text-blue-600 font-bold"
                                    onClick={() => setSelectedTip(tip)}
                                >
                                    Read Insight <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="w-8 h-8 p-0 rounded-full">
                                        <Bookmark className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-8 h-8 p-0 rounded-full">
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </section>

        <Card className="gradient-primary text-white border-0 overflow-hidden relative">
            <CardHeader className="relative z-10">
                <CardTitle className="text-2xl text-white">Daily Tip for You</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <p className="text-xl font-medium max-w-lg mb-8">
                    "Consistent walking patterns reduce localized pressure by over 30%. Remember to take short breaks every 45 minutes."
                </p>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40">TODAY'S ADVICE</Badge>
            </CardContent>
            <Lightbulb className="absolute right-[-20px] top-[-20px] w-64 h-64 text-white/10 rotate-12" />
        </Card>
        {/* Shared Insight Modal */}
        {selectedTip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
                    <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-slate-950 z-10 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/20">
                                <selectedTip.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{selectedTip.title}</CardTitle>
                                <p className="text-xs text-slate-500">By {selectedTip.author}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTip(null)}>Close</Button>
                    </CardHeader>
                    <CardContent className="p-8">
                        <Badge className="mb-4">{selectedTip.category}</Badge>
                        <div className="prose dark:prose-invert">
                            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                                {selectedTip.content}
                            </p>
                        </div>
                        <div className="mt-8 pt-8 border-t flex justify-end">
                            <Button onClick={() => setSelectedTip(null)}>I've read this</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}
