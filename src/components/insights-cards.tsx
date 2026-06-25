'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Droplet, Activity, ListOrdered, Calendar, Scale } from 'lucide-react';
import { SugarReading, BPReading, WeightReading } from '@/types';

interface InsightsCardsProps {
  sugarReadings: SugarReading[];
  bpReadings: BPReading[];
  weightReadings: WeightReading[];
}

export function InsightsCards({ sugarReadings, bpReadings, weightReadings = [] }: InsightsCardsProps) {
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

  const latestSugar = sugarReadings[0] || null;
  const latestBP = bpReadings[0] || null;
  const latestWeight = weightReadings[0] || null;

  const totalLogs = sugarReadings.length + bpReadings.length + weightReadings.length;

  // Helpers to filter readings by date range
  const filterByDays = (readings: any[], days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return readings.filter(r => new Date(r.reading_time) >= cutoff);
  };

  // Average sugar calculations
  const sugar7Days = filterByDays(sugarReadings, 7);
  const sugar30Days = filterByDays(sugarReadings, 30);
  
  const avgSugar7 = sugar7Days.length > 0
    ? Math.round(sugar7Days.reduce((acc, curr) => acc + curr.sugar_value, 0) / sugar7Days.length)
    : null;
  const avgSugar30 = sugar30Days.length > 0
    ? Math.round(sugar30Days.reduce((acc, curr) => acc + curr.sugar_value, 0) / sugar30Days.length)
    : null;

  // Average BP calculations
  const bp7Days = filterByDays(bpReadings, 7);
  const bp30Days = filterByDays(bpReadings, 30);

  const avgBP7 = bp7Days.length > 0
    ? {
        systolic: Math.round(bp7Days.reduce((acc, curr) => acc + curr.systolic, 0) / bp7Days.length),
        diastolic: Math.round(bp7Days.reduce((acc, curr) => acc + curr.diastolic, 0) / bp7Days.length),
        pulse: Math.round(bp7Days.reduce((acc, curr) => acc + curr.pulse, 0) / bp7Days.length)
      }
    : null;

  const avgBP30 = bp30Days.length > 0
    ? {
        systolic: Math.round(bp30Days.reduce((acc, curr) => acc + curr.systolic, 0) / bp30Days.length),
        diastolic: Math.round(bp30Days.reduce((acc, curr) => acc + curr.diastolic, 0) / bp30Days.length),
        pulse: Math.round(bp30Days.reduce((acc, curr) => acc + curr.pulse, 0) / bp30Days.length)
      }
    : null;

  // Average weight calculations
  const weight7Days = filterByDays(weightReadings, 7);
  const weight30Days = filterByDays(weightReadings, 30);

  const avgWeight7 = weight7Days.length > 0
    ? Math.round((weight7Days.reduce((acc, curr) => acc + Number(curr.weight_value), 0) / weight7Days.length) * 10) / 10
    : null;
  const avgWeight30 = weight30Days.length > 0
    ? Math.round((weight30Days.reduce((acc, curr) => acc + Number(curr.weight_value), 0) / weight30Days.length) * 10) / 10
    : null;

  const formatWeight = (kgValue: number) => {
    if (displayUnit === 'lbs') {
      const lbsValue = Math.round(kgValue * 2.20462 * 10) / 10;
      return `${lbsValue} lbs`;
    }
    return `${kgValue} kg`;
  };

  // Medical status check functions
  const getSugarStatus = (val: number, type: string) => {
    if (val < 70) return { label: 'Low', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
    
    if (type === 'Fasting') {
      if (val < 100) return { label: 'Normal', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
      if (val <= 125) return { label: 'Elevated', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' };
      return { label: 'High', color: 'bg-destructive/10 text-destructive' };
    } else {
      if (val < 140) return { label: 'Normal', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
      if (val < 200) return { label: 'Elevated', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' };
      return { label: 'High', color: 'bg-destructive/10 text-destructive' };
    }
  };

  const getBPStatus = (sys: number, dia: number) => {
    if (sys < 90 || dia < 60) return { label: 'Low', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
    if (sys <= 129 && dia < 80) return { label: 'Elevated', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' };
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return { label: 'High (Stage 1)', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' };
    }
    return { label: 'High (Stage 2)', color: 'bg-destructive/10 text-destructive' };
  };

  const formattedSugarTime = latestSugar 
    ? new Date(latestSugar.reading_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const formattedBPTime = latestBP
    ? new Date(latestBP.reading_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  const formattedWeightTime = latestWeight
    ? new Date(latestWeight.reading_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="space-y-6">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latest Sugar Reading */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest Sugar</CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Droplet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {latestSugar ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight">{latestSugar.sugar_value}</span>
                  <span className="text-xs text-muted-foreground">mg/dL</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getSugarStatus(latestSugar.sugar_value, latestSugar.reading_type).color}`}>
                    {getSugarStatus(latestSugar.sugar_value, latestSugar.reading_type).label} ({latestSugar.reading_type})
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formattedSugarTime}</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">No records yet</span>
            )}
          </CardContent>
        </Card>

        {/* Latest BP Reading */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest BP</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {latestBP ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight">{latestBP.systolic}/{latestBP.diastolic}</span>
                  <span className="text-xs text-muted-foreground">mmHg</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getBPStatus(latestBP.systolic, latestBP.diastolic).color}`}>
                    {getBPStatus(latestBP.systolic, latestBP.diastolic).label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formattedBPTime}</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">No records yet</span>
            )}
          </CardContent>
        </Card>

        {/* Latest Weight Reading */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest Weight</CardTitle>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Scale className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {latestWeight ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight">{formatWeight(latestWeight.weight_value)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    Tracked
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formattedWeightTime}</span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">No records yet</span>
            )}
          </CardContent>
        </Card>

        {/* Total Logs */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Health Logs</CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <ListOrdered className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight">{totalLogs}</span>
              <span className="text-xs text-muted-foreground">entries</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Total health logs tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* HEALTH INSIGHTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sugar Averages */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-4 border-b border-border flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-500" />
            <h3 className="font-bold text-sm text-primary">Blood Sugar Insights</h3>
          </div>
          <CardContent className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 7-Day Average
              </span>
              {avgSugar7 ? (
                <div>
                  <span className="text-xl font-bold">{avgSugar7}</span>
                  <span className="text-xs text-muted-foreground ml-1">mg/dL</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">Insufficient data</span>
              )}
            </div>
            <div className="bg-muted/50 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 30-Day Average
              </span>
              {avgSugar30 ? (
                <div>
                  <span className="text-xl font-bold">{avgSugar30}</span>
                  <span className="text-xs text-muted-foreground ml-1">mg/dL</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">Insufficient data</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BP Averages */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-4 border-b border-border flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-primary">Blood Pressure Insights</h3>
          </div>
          <CardContent className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 7-Day Average
              </span>
              {avgBP7 ? (
                <div>
                  <span className="text-base font-bold">{avgBP7.systolic}/{avgBP7.diastolic}</span>
                  <span className="text-[10px] text-muted-foreground block">{avgBP7.pulse} bpm</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">Insufficient data</span>
              )}
            </div>
            <div className="bg-muted/50 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 30-Day Average
              </span>
              {avgBP30 ? (
                <div>
                  <span className="text-base font-bold">{avgBP30.systolic}/{avgBP30.diastolic}</span>
                  <span className="text-[10px] text-muted-foreground block">{avgBP30.pulse} bpm</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">Insufficient data</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weight Averages */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500/10 to-transparent p-4 border-b border-border flex items-center gap-2">
            <Scale className="h-5 w-5 text-cyan-500" />
            <h3 className="font-bold text-sm text-primary">Weight Insights</h3>
          </div>
          <CardContent className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 7-Day Average
              </span>
              {avgWeight7 ? (
                <div>
                  <span className="text-lg font-bold">{formatWeight(avgWeight7)}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">Insufficient data</span>
              )}
            </div>
            <div className="bg-muted/50 p-4 rounded-xl flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 30-Day Average
              </span>
              {avgWeight30 ? (
                <div>
                  <span className="text-lg font-bold">{formatWeight(avgWeight30)}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">Insufficient data</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
