'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Calendar, 
  Activity, 
  CheckCircle,
  Scale
} from 'lucide-react';
import { db } from '@/lib/db';
import { SugarReading, BPReading, WeightReading, Profile } from '@/types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Profile | null>(null);
  const [sugarReadings, setSugarReadings] = useState<SugarReading[]>([]);
  const [bpReadings, setBPReadings] = useState<BPReading[]>([]);
  const [weightReadings, setWeightReadings] = useState<WeightReading[]>([]);

  // Filter ranges
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Export progress states
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const u = await db.getCurrentUser();
        const sugar = await db.getSugarReadings();
        const bp = await db.getBPReadings();
        const weight = await db.getWeightReadings();
        
        setUser(u);
        setSugarReadings(sugar);
        setBPReadings(bp);
        setWeightReadings(weight);

        // Default range: last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
      } catch (e) {
        console.error('Error fetching reports data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered readings based on date range
  const filteredData = React.useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filteredSugar = sugarReadings.filter(r => {
      const time = new Date(r.reading_time);
      if (start && time < start) return false;
      if (end && time > end) return false;
      return true;
    });

    const filteredBP = bpReadings.filter(r => {
      const time = new Date(r.reading_time);
      if (start && time < start) return false;
      if (end && time > end) return false;
      return true;
    });

    const filteredWeight = weightReadings.filter(r => {
      const time = new Date(r.reading_time);
      if (start && time < start) return false;
      if (end && time > end) return false;
      return true;
    });

    return { sugar: filteredSugar, bp: filteredBP, weight: filteredWeight };
  }, [sugarReadings, bpReadings, weightReadings, startDate, endDate]);

  // PDF EXPORT LOGIC
  const handleExportPDF = (type: 'sugar' | 'bp' | 'weight' | 'complete') => {
    setIsExportingPDF(true);
    try {
      const { sugar, bp, weight } = filteredData;
      const doc = new jsPDF();
      const patientName = user?.full_name || user?.email || 'Valued Patient';
      const patientEmail = user?.email || '';

      const savedUnit = typeof window !== 'undefined'
        ? localStorage.getItem('sugarcare_weight_unit') || 'kg'
        : 'kg';

      // Set Font and Header
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // medical blue primary
      
      let title = 'SugarCare Complete Health Report';
      if (type === 'sugar') title = 'SugarCare Blood Glucose Report';
      if (type === 'bp') title = 'SugarCare Blood Pressure Report';
      if (type === 'weight') title = 'SugarCare Body Weight Report';
      
      doc.text(title, 14, 20);

      // Report Subtitle Info
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 27);
      doc.text(`Filtered Range: ${startDate || 'Beginning'} to ${endDate || 'Today'}`, 14, 32);

      // Patient details box
      doc.setFillColor(248, 250, 252); // light slate background
      doc.rect(14, 38, 182, 22, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Patient Name: ${patientName}`, 18, 45);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Email: ${patientEmail}`, 18, 50);
      
      let countText = '';
      if (type === 'sugar') countText = `Total Entries: ${sugar.length} glucose logs`;
      else if (type === 'bp') countText = `Total Entries: ${bp.length} blood pressure logs`;
      else if (type === 'weight') countText = `Total Entries: ${weight.length} weight logs`;
      else countText = `Total Entries: ${sugar.length} glucose, ${bp.length} BP, ${weight.length} weight logs`;
      
      doc.text(countText, 18, 55);

      // Calculate Averages for the PDF summary
      const avgSugar = sugar.length > 0 
        ? Math.round(sugar.reduce((a, b) => a + b.sugar_value, 0) / sugar.length) 
        : 'N/A';
      
      const avgSys = bp.length > 0 
        ? Math.round(bp.reduce((a, b) => a + b.systolic, 0) / bp.length) 
        : null;
      const avgDia = bp.length > 0 
        ? Math.round(bp.reduce((a, b) => a + b.diastolic, 0) / bp.length) 
        : null;
      const avgPulse = bp.length > 0 
        ? Math.round(bp.reduce((a, b) => a + b.pulse, 0) / bp.length) 
        : null;

      const avgWeightRaw = weight.length > 0
        ? weight.reduce((a, b) => a + Number(b.weight_value), 0) / weight.length
        : null;
      const avgWeight = avgWeightRaw
        ? Math.round((savedUnit === 'lbs' ? avgWeightRaw * 2.20462 : avgWeightRaw) * 10) / 10
        : 'N/A';

      // Render summary indicators
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.text('Vitals Summary Statistics', 14, 72);

      const summaryRows = [];
      if (type === 'sugar' || type === 'complete') {
        summaryRows.push([
          'Blood Glucose Levels', 
          avgSugar !== 'N/A' ? `${avgSugar} mg/dL` : 'No data',
          avgSugar !== 'N/A' ? (avgSugar < 100 ? 'Normal Fasting Range' : avgSugar < 140 ? 'Normal Post-meal Range' : 'Elevated') : 'Log glucose readings regularly'
        ]);
      }
      if (type === 'bp' || type === 'complete') {
        summaryRows.push([
          'Blood Pressure', 
          avgSys && avgDia ? `${avgSys}/${avgDia} mmHg` : 'No data',
          avgSys && avgDia ? (avgSys < 120 && avgDia < 80 ? 'Normal Blood Pressure' : 'Elevated / High') : 'Log blood pressure entries regularly'
        ]);
        summaryRows.push([
          'Heart Rate (Pulse)', 
          avgPulse ? `${avgPulse} bpm` : 'No data',
          avgPulse ? (avgPulse >= 60 && avgPulse <= 100 ? 'Normal resting heart rate' : 'Outside typical range') : 'Log pulse records regularly'
        ]);
      }
      if (type === 'weight' || type === 'complete') {
        summaryRows.push([
          'Body Weight',
          avgWeight !== 'N/A' ? `${avgWeight} ${savedUnit}` : 'No data',
          avgWeight !== 'N/A' ? 'Weight logging active' : 'Log weight entries regularly'
        ]);
      }

      autoTable(doc, {
        startY: 76,
        head: [['Measurement Indicator', 'Average Value', 'Clinical Status Details']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 12;

      // Sugar Records Section
      if (type === 'sugar' || type === 'complete') {
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.text('Detailed Blood Glucose Log', 14, currentY);

        const sugarRows = sugar.map(r => {
          const d = new Date(r.reading_time);
          return [
            `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            `${r.sugar_value} mg/dL`,
            r.reading_type,
            r.notes || '-'
          ];
        });

        autoTable(doc, {
          startY: currentY + 4,
          head: [['Date & Time', 'Glucose Value', 'Reading Type', 'Patient Notes']],
          body: sugarRows.length > 0 ? sugarRows : [['No data', 'No data', 'No data', 'No data']],
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 12;
      }

      // BP Records Section
      if (type === 'bp' || type === 'complete') {
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.text('Detailed Blood Pressure Log', 14, currentY);

        const bpRows = bp.map(r => {
          const d = new Date(r.reading_time);
          return [
            `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            `${r.systolic}/${r.diastolic} mmHg`,
            `${r.pulse} bpm`,
            r.notes || '-'
          ];
        });

        autoTable(doc, {
          startY: currentY + 4,
          head: [['Date & Time', 'BP Measurement', 'Pulse Rate', 'Patient Notes']],
          body: bpRows.length > 0 ? bpRows : [['No data', 'No data', 'No data', 'No data']],
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] } // emerald green
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;
      }

      // Weight Records Section
      if (type === 'weight' || type === 'complete') {
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.text('Detailed Body Weight Log', 14, currentY);

        const weightRows = weight.map(r => {
          const d = new Date(r.reading_time);
          const wValRaw = Number(r.weight_value);
          const wVal = savedUnit === 'lbs'
            ? Math.round(wValRaw * 2.20462 * 10) / 10
            : wValRaw;
          return [
            `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            `${wVal} ${savedUnit}`,
            r.notes || '-'
          ];
        });

        autoTable(doc, {
          startY: currentY + 4,
          head: [['Date & Time', 'Weight', 'Patient Notes']],
          body: weightRows.length > 0 ? weightRows : [['No data', 'No data', 'No data']],
          theme: 'striped',
          headStyles: { fillColor: [6, 182, 212] } // cyan
        });
      }

      // Save PDF
      doc.save(`sugarcare_${type}_report_${startDate || 'all'}_to_${endDate || 'all'}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Activity className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Creating reporting module...</p>
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
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Health Reports</h2>
              <p className="text-xs text-muted-foreground">Export medical logs as formatted, printable PDF reports.</p>
            </div>
          </div>
        </div>

        {/* CONTROLS & SELECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FILTER CRITERIA */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Filter Date Range
              </CardTitle>
              <CardDescription className="text-xs">
                Select start and end dates to filter metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="start">Start Date</Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="end">End Date</Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-xl text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  The compiled PDF documents are fully formatted and ready to be printed or forwarded to your GP, endocrinologist, or family doctor.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* EXPORT OPTIONS */}
          <div className="lg:col-span-2 space-y-6">
            {/* SEGMENTED REPORTS CARD */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" /> Segmented Health PDFs
                </CardTitle>
                <CardDescription className="text-xs">
                  Download separate PDF documents focusing on individual vital signs.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  onClick={() => handleExportPDF('sugar')} 
                  variant="outline" 
                  className="rounded-xl border border-border hover:bg-muted py-5 text-xs font-semibold"
                  disabled={isExportingPDF}
                >
                  <FileText className="mr-2 h-4 w-4 text-blue-500" /> Glucose Report (PDF)
                </Button>
                
                <Button 
                  onClick={() => handleExportPDF('bp')} 
                  variant="outline" 
                  className="rounded-xl border border-border hover:bg-muted py-5 text-xs font-semibold"
                  disabled={isExportingPDF}
                >
                  <FileText className="mr-2 h-4 w-4 text-emerald-500" /> BP & Pulse (PDF)
                </Button>

                <Button 
                  onClick={() => handleExportPDF('weight')} 
                  variant="outline" 
                  className="rounded-xl border border-border hover:bg-muted py-5 text-xs font-semibold"
                  disabled={isExportingPDF}
                >
                  <Scale className="mr-2 h-4 w-4 text-cyan-500" /> Weight Report (PDF)
                </Button>
              </CardContent>
            </Card>

            {/* FULL REPORT CARD */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" /> Complete Vitals Health Record (PDF)
                </CardTitle>
                <CardDescription className="text-xs">
                  Generate a structured, unified PDF health report suitable for printing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This document merges blood sugar, blood pressure, and weight records in clear tables. It includes patient details, average summary stats, and clinical notes.
                </p>

                <Button 
                  onClick={() => handleExportPDF('complete')} 
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-5 px-6 shadow-md shadow-blue-500/10 flex items-center gap-2 transition-transform hover:scale-[1.01]"
                  disabled={isExportingPDF}
                >
                  <FileText className="h-4 w-4 text-white" /> {isExportingPDF ? 'Generating...' : 'Download Complete Health PDF'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
