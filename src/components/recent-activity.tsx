'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Droplet, Activity, Calendar, FileText, Scale } from 'lucide-react';
import { SugarReading, BPReading, WeightReading, Profile } from '@/types';
import { checkSugarControlled, checkBPControlled } from '@/lib/vitals';

interface RecentActivityProps {
  sugarReadings: SugarReading[];
  bpReadings: BPReading[];
  weightReadings: WeightReading[];
  profile: Profile | null;
}

type ActivityItem = 
  | { itemType: 'sugar'; date: Date; raw: SugarReading }
  | { itemType: 'bp'; date: Date; raw: BPReading }
  | { itemType: 'weight'; date: Date; raw: WeightReading };

export function RecentActivity({ sugarReadings, bpReadings, weightReadings = [], profile }: RecentActivityProps) {
  const [displayUnit, setDisplayUnit] = useState<'kg' | 'lbs'>('kg');

  // Load saved unit preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUnit = localStorage.getItem('sugarcare_weight_unit');
      if (savedUnit === 'kg' || savedUnit === 'lbs') {
        setDisplayUnit(savedUnit);
      }
    }
  }, [weightReadings]);

  // Combine and sort the latest entries
  const activities: ActivityItem[] = [
    ...sugarReadings.map(r => ({ itemType: 'sugar' as const, date: new Date(r.reading_time), raw: r })),
    ...bpReadings.map(r => ({ itemType: 'bp' as const, date: new Date(r.reading_time), raw: r })),
    ...weightReadings.map(r => ({ itemType: 'weight' as const, date: new Date(r.reading_time), raw: r }))
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10); // get latest 10

  const getSugarColor = (val: number) => {
    if (val < 70) return 'text-amber-500';
    if (val >= 140) return 'text-destructive';
    return 'text-emerald-500';
  };

  const getBPColor = (sys: number, dia: number) => {
    if (sys >= 130 || dia >= 80) return 'text-destructive';
    if (sys < 90 || dia < 60) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const formatWeight = (kgValue: number) => {
    if (displayUnit === 'lbs') {
      const lbsValue = Math.round(kgValue * 2.20462 * 10) / 10;
      return `${lbsValue} lbs`;
    }
    return `${kgValue} kg`;
  };

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Recent Health Log (Latest 10)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length > 0 ? (
          <div className="divide-y divide-border">
            {activities.map((item, idx) => {
              const formattedDate = item.date.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              if (item.itemType === 'sugar') {
                const raw = item.raw as SugarReading;
                const isControlled = checkSugarControlled(raw.sugar_value, raw.reading_type, profile);
                return (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                        <Droplet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Blood Sugar: {raw.reading_type}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
                        {raw.notes && (
                          <p className="text-[10px] text-muted-foreground italic mt-0.5 max-w-xs md:max-w-md truncate">
                            "{raw.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className={`text-sm font-bold ${getSugarColor(raw.sugar_value)}`}>
                        {raw.sugar_value} mg/dL
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        isControlled 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {isControlled ? 'Controlled' : 'Not Controlled'}
                      </span>
                    </div>
                  </div>
                );
              } else if (item.itemType === 'bp') {
                const raw = item.raw as BPReading;
                const isControlled = checkBPControlled(raw.systolic, raw.diastolic, profile);
                return (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground flex items-center">
                          Blood Pressure Log
                        </p>
                        <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
                        {raw.notes && (
                          <p className="text-[10px] text-muted-foreground italic mt-0.5 max-w-xs md:max-w-md truncate">
                            "{raw.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-0.5">
                      <p className={`text-sm font-bold ${getBPColor(raw.systolic, raw.diastolic)}`}>
                        {raw.systolic}/{raw.diastolic} mmHg
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold mt-0.5 ${
                        isControlled 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {isControlled ? 'Controlled' : 'Not Controlled'}
                      </span>
                      <p className="text-[9px] text-muted-foreground font-medium mt-0.5">Pulse: {raw.pulse} bpm</p>
                    </div>
                  </div>
                );
              } else {
                const raw = item.raw as WeightReading;
                return (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground flex items-center">
                          Weight Log
                        </p>
                        <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
                        {raw.notes && (
                          <p className="text-[10px] text-muted-foreground italic mt-0.5 max-w-xs md:max-w-md truncate">
                            "{raw.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                        {formatWeight(raw.weight_value)}
                      </p>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground font-medium">No activity logged yet. Use quick action forms to log your readings.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
