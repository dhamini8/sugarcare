'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Droplet, Activity, Calendar, FileText } from 'lucide-react';
import { SugarReading, BPReading } from '@/types';

interface RecentActivityProps {
  sugarReadings: SugarReading[];
  bpReadings: BPReading[];
}

type ActivityItem = 
  | { itemType: 'sugar'; date: Date; raw: SugarReading }
  | { itemType: 'bp'; date: Date; raw: BPReading };

export function RecentActivity({ sugarReadings, bpReadings }: RecentActivityProps) {
  // Combine and sort the latest entries
  const activities: ActivityItem[] = [
    ...sugarReadings.map(r => ({ itemType: 'sugar' as const, date: new Date(r.reading_time), raw: r })),
    ...bpReadings.map(r => ({ itemType: 'bp' as const, date: new Date(r.reading_time), raw: r }))
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
              const isSugar = item.itemType === 'sugar';
              const formattedDate = item.date.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isSugar ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {isSugar ? <Droplet className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {isSugar 
                          ? `Blood Sugar: ${item.raw.reading_type}` 
                          : 'Blood Pressure Log'
                        }
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
                      {item.raw.notes && (
                        <p className="text-[10px] text-muted-foreground italic mt-0.5 max-w-xs md:max-w-md truncate">
                          "{item.raw.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      isSugar 
                        ? getSugarColor((item.raw as SugarReading).sugar_value) 
                        : getBPColor((item.raw as BPReading).systolic, (item.raw as BPReading).diastolic)
                    }`}>
                      {isSugar 
                        ? `${(item.raw as SugarReading).sugar_value} mg/dL` 
                        : `${(item.raw as BPReading).systolic}/${(item.raw as BPReading).diastolic} mmHg`
                      }
                    </p>
                    {!isSugar && (
                      <p className="text-[9px] text-muted-foreground font-medium">Pulse: {(item.raw as BPReading).pulse} bpm</p>
                    )}
                  </div>
                </div>
              );
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
