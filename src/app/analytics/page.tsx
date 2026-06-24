'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Droplet, Activity, LineChart as ChartIcon, Calendar, Info } from 'lucide-react';
import { db } from '@/lib/db';
import { SugarReading, BPReading } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [sugarReadings, setSugarReadings] = useState<SugarReading[]>([]);
  const [bpReadings, setBPReadings] = useState<BPReading[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  // Time range filters
  const [sugarRange, setSugarRange] = useState<7 | 30 | 90>(30);
  const [bpRange, setBpRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    setHasMounted(true);
    async function fetchData() {
      try {
        const sugar = await db.getSugarReadings();
        const bp = await db.getBPReadings();
        setSugarReadings(sugar);
        setBPReadings(bp);
      } catch (e) {
        console.error('Error fetching analytics data', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter & format Sugar chart data
  const sugarChartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - sugarRange);

    const filtered = sugarReadings
      .filter(r => new Date(r.reading_time) >= cutoff)
      // Sort ascending for chart chronological order
      .sort((a, b) => new Date(a.reading_time).getTime() - new Date(b.reading_time).getTime());

    return filtered.map(r => {
      const d = new Date(r.reading_time);
      return {
        id: r.id,
        rawDate: d,
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        displayTime: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        value: r.sugar_value,
        type: r.reading_type
      };
    });
  }, [sugarReadings, sugarRange]);

  // Filter & format BP chart data
  const bpChartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - bpRange);

    const filtered = bpReadings
      .filter(r => new Date(r.reading_time) >= cutoff)
      .sort((a, b) => new Date(a.reading_time).getTime() - new Date(b.reading_time).getTime());

    return filtered.map(r => {
      const d = new Date(r.reading_time);
      return {
        id: r.id,
        rawDate: d,
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        displayTime: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        systolic: r.systolic,
        diastolic: r.diastolic,
        pulse: r.pulse
      };
    });
  }, [bpReadings, bpRange]);

  // Sugar stats summary
  const sugarStats = useMemo(() => {
    if (sugarChartData.length === 0) return null;
    const values = sugarChartData.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      average: Math.round(sum / values.length),
      max: Math.max(...values),
      min: Math.min(...values)
    };
  }, [sugarChartData]);

  // BP stats summary
  const bpStats = useMemo(() => {
    if (bpChartData.length === 0) return null;
    const sys = bpChartData.map(d => d.systolic);
    const dia = bpChartData.map(d => d.diastolic);
    const pulses = bpChartData.map(d => d.pulse);
    
    return {
      avgSys: Math.round(sys.reduce((a, b) => a + b, 0) / sys.length),
      avgDia: Math.round(dia.reduce((a, b) => a + b, 0) / dia.length),
      avgPulse: Math.round(pulses.reduce((a, b) => a + b, 0) / pulses.length)
    };
  }, [bpChartData]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Activity className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Creating charts...</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl text-primary">
              <ChartIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Health Analytics</h2>
              <p className="text-xs text-muted-foreground">Visualize glucose trends and blood pressure curves over time.</p>
            </div>
          </div>
        </div>

        {/* TABS CONTAINER */}
        <Tabs defaultValue="sugar" className="space-y-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 rounded-xl h-11 p-1 bg-muted">
            <TabsTrigger value="sugar" className="rounded-lg font-medium text-xs flex items-center gap-2">
              <Droplet className="h-4 w-4 text-blue-500" /> Glucose Levels
            </TabsTrigger>
            <TabsTrigger value="bp" className="rounded-lg font-medium text-xs flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Blood Pressure
            </TabsTrigger>
          </TabsList>

          {/* SUGAR ANALYTICS TAB */}
          <TabsContent value="sugar" className="space-y-6 outline-none">
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Blood Glucose Trend</CardTitle>
                  <CardDescription className="text-xs">Line representation of sugar value logs.</CardDescription>
                </div>
                <div className="flex items-center bg-muted p-1 rounded-xl gap-1 shrink-0">
                  <Button variant={sugarRange === 7 ? 'secondary' : 'ghost'} size="sm" onClick={() => setSugarRange(7)} className="h-8 text-xs rounded-lg px-3">7 Days</Button>
                  <Button variant={sugarRange === 30 ? 'secondary' : 'ghost'} size="sm" onClick={() => setSugarRange(30)} className="h-8 text-xs rounded-lg px-3">30 Days</Button>
                  <Button variant={sugarRange === 90 ? 'secondary' : 'ghost'} size="sm" onClick={() => setSugarRange(90)} className="h-8 text-xs rounded-lg px-3">90 Days</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {hasMounted && sugarChartData.length > 0 ? (
                  <div className="space-y-6">
                    {/* STATS SECTION */}
                    {sugarStats && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/40 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Average</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">{sugarStats.average} <span className="text-[10px] font-normal text-muted-foreground">mg/dL</span></p>
                        </div>
                        <div className="bg-muted/40 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Highest</p>
                          <p className="text-lg font-bold text-destructive mt-1">{sugarStats.max} <span className="text-[10px] font-normal text-muted-foreground">mg/dL</span></p>
                        </div>
                        <div className="bg-muted/40 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lowest</p>
                          <p className="text-lg font-bold text-amber-500 mt-1">{sugarStats.min} <span className="text-[10px] font-normal text-muted-foreground">mg/dL</span></p>
                        </div>
                      </div>
                    )}

                    {/* CHART */}
                    <div className="h-[350px] w-full pr-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sugarChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                          <YAxis domain={[40, 'auto']} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-card border border-border p-3 rounded-xl shadow-lg text-xs space-y-1">
                                    <p className="font-bold">{data.displayDate} @ {data.displayTime}</p>
                                    <p className="font-medium text-blue-500">Glucose: {data.value} mg/dL</p>
                                    <p className="text-muted-foreground">Type: {data.type}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {/* Ideal normal fasting threshold guides (70 - 100) */}
                          <ReferenceLine y={100} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Elevated Fasting (100)', fill: '#eab308', fontSize: 9, position: 'right' }} />
                          <ReferenceLine y={126} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Diabetic (126)', fill: '#ef4444', fontSize: 9, position: 'right' }} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="Glucose"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 1, fill: '#ffffff' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-primary">Interpreting Glucose Ranges</h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Normal fasting blood sugar levels should be between 70 and 99 mg/dL. Values between 100 and 125 mg/dL suggest pre-diabetes, and values of 126 mg/dL or higher indicate diabetic conditions. Keep entries consistently logged to maintain reliable diagnostics.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-sm">No blood sugar entries logged in this time range.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BP ANALYTICS TAB */}
          <TabsContent value="bp" className="space-y-6 outline-none">
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Blood Pressure Trend</CardTitle>
                  <CardDescription className="text-xs">Compare systolic (upper) and diastolic (lower) curves over time.</CardDescription>
                </div>
                <div className="flex items-center bg-muted p-1 rounded-xl gap-1 shrink-0">
                  <Button variant={bpRange === 7 ? 'secondary' : 'ghost'} size="sm" onClick={() => setBpRange(7)} className="h-8 text-xs rounded-lg px-3">7 Days</Button>
                  <Button variant={bpRange === 30 ? 'secondary' : 'ghost'} size="sm" onClick={() => setBpRange(30)} className="h-8 text-xs rounded-lg px-3">30 Days</Button>
                  <Button variant={bpRange === 90 ? 'secondary' : 'ghost'} size="sm" onClick={() => setBpRange(90)} className="h-8 text-xs rounded-lg px-3">90 Days</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {hasMounted && bpChartData.length > 0 ? (
                  <div className="space-y-6">
                    {/* STATS SECTION */}
                    {bpStats && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/40 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Systolic</p>
                          <p className="text-lg font-bold text-red-500 mt-1">{bpStats.avgSys} <span className="text-[10px] font-normal text-muted-foreground">mmHg</span></p>
                        </div>
                        <div className="bg-muted/40 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Diastolic</p>
                          <p className="text-lg font-bold text-blue-500 mt-1">{bpStats.avgDia} <span className="text-[10px] font-normal text-muted-foreground">mmHg</span></p>
                        </div>
                        <div className="bg-muted/40 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Pulse</p>
                          <p className="text-lg font-bold text-emerald-500 mt-1">{bpStats.avgPulse} <span className="text-[10px] font-normal text-muted-foreground">bpm</span></p>
                        </div>
                      </div>
                    )}

                    {/* CHART */}
                    <div className="h-[350px] w-full pr-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={bpChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                          <YAxis domain={[40, 200]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-card border border-border p-3 rounded-xl shadow-lg text-xs space-y-1">
                                    <p className="font-bold">{data.displayDate} @ {data.displayTime}</p>
                                    <p className="font-semibold text-red-500">Systolic: {data.systolic} mmHg</p>
                                    <p className="font-semibold text-blue-500">Diastolic: {data.diastolic} mmHg</p>
                                    <p className="font-medium text-emerald-500">Pulse: {data.pulse} bpm</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          {/* Ideal normal blood pressure threshold markers */}
                          <ReferenceLine y={120} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Systolic Limit (120)', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                          <ReferenceLine y={80} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Diastolic Limit (80)', fill: '#3b82f6', fontSize: 9, position: 'insideBottomRight' }} />
                          <Line
                            type="monotone"
                            dataKey="systolic"
                            name="Systolic (Upper)"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#ffffff' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="diastolic"
                            name="Diastolic (Lower)"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#ffffff' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-start gap-3">
                      <Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-primary">Interpreting Blood Pressure Ranges</h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          A normal reading is systolic under 120 mmHg and diastolic under 80 mmHg. Elevated pressure falls between 120-129 systolic, and high blood pressure (Stage 1 Hypertension) begins at 130 systolic or 80 diastolic. Regular tracking helps doctors monitor cardiovascular patterns.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-sm">No blood pressure entries logged in this time range.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
