'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { InsightsCards } from '@/components/insights-cards';
import { RecentActivity } from '@/components/recent-activity';
import { SugarForm } from '@/components/sugar-form';
import { BPForm } from '@/components/bp-form';
import { WeightForm } from '@/components/weight-form';
import { Button } from '@/components/ui/button';
import { Droplet, Activity, Scale } from 'lucide-react';
import { db } from '@/lib/db';
import { SugarReading, BPReading, WeightReading, Profile } from '@/types';
import { PWAInstaller } from '@/components/pwa-installer';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sugarReadings, setSugarReadings] = useState<SugarReading[]>([]);
  const [bpReadings, setBPReadings] = useState<BPReading[]>([]);
  const [weightReadings, setWeightReadings] = useState<WeightReading[]>([]);

  // Modals state
  const [isSugarOpen, setIsSugarOpen] = useState(false);
  const [isBPOpen, setIsBPOpen] = useState(false);
  const [isWeightOpen, setIsWeightOpen] = useState(false);

  const loadData = async () => {
    try {
      const user = await db.getCurrentUser();
      if (user) {
        setUserName(user.full_name || user.email.split('@')[0]);
        setProfile(user);
      }
      
      const sugar = await db.getSugarReadings();
      const bp = await db.getBPReadings();
      const weight = await db.getWeightReadings();
      
      setSugarReadings(sugar);
      setBPReadings(bp);
      setWeightReadings(weight);
    } catch (e) {
      console.error('Error fetching dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Activity className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Gathering health logs...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{getGreeting()}, {userName}!</h2>
            <p className="text-xs text-muted-foreground">Here is a summary of your blood sugar, blood pressure, and weight vitals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setIsSugarOpen(true)} className="rounded-xl flex items-center gap-1.5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 transition-transform hover:scale-[1.02]">
              <Droplet className="h-4 w-4" /> Log Sugar
            </Button>
            <Button onClick={() => setIsBPOpen(true)} className="rounded-xl flex items-center gap-1.5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/10 transition-transform hover:scale-[1.02]">
              <Activity className="h-4 w-4" /> Log BP
            </Button>
            <Button onClick={() => setIsWeightOpen(true)} className="rounded-xl flex items-center gap-1.5 h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-md shadow-cyan-500/10 transition-transform hover:scale-[1.02]">
              <Scale className="h-4 w-4" /> Log Weight
            </Button>
          </div>
        </div>

        {/* INSIGHTS CARDS */}
        <InsightsCards sugarReadings={sugarReadings} bpReadings={bpReadings} weightReadings={weightReadings} />

        {/* RECENT ACTIVITY */}
        <div className="grid grid-cols-1 gap-6">
          <RecentActivity sugarReadings={sugarReadings} bpReadings={bpReadings} weightReadings={weightReadings} profile={profile} />
        </div>
      </div>

      {/* LOG MODALS */}
      <SugarForm 
        isOpen={isSugarOpen} 
        onClose={() => setIsSugarOpen(false)} 
        onSuccess={loadData} 
        readingToEdit={null}
      />
      <BPForm 
        isOpen={isBPOpen} 
        onClose={() => setIsBPOpen(false)} 
        onSuccess={loadData} 
        readingToEdit={null}
      />
      <WeightForm 
        isOpen={isWeightOpen} 
        onClose={() => setIsWeightOpen(false)} 
        onSuccess={loadData} 
        readingToEdit={null}
      />

      {/* PWA FLOATING PROMPT */}
      <PWAInstaller />
    </DashboardShell>
  );
}
