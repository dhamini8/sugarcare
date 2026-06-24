'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { BPHistory } from '@/components/bp-history';
import { BPForm } from '@/components/bp-form';
import { Button } from '@/components/ui/button';
import { Activity, Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { BPReading } from '@/types';

export default function BPPage() {
  const [readings, setReadings] = useState<BPReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<BPReading | null>(null);

  const fetchReadings = async () => {
    try {
      const data = await db.getBPReadings();
      setReadings(data);
    } catch (e) {
      console.error('Error fetching BP readings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleEditClick = (reading: BPReading) => {
    setEditingReading(reading);
    setIsFormOpen(true);
  };

  const handleCreateClick = () => {
    setEditingReading(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReading(null);
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Activity className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading blood pressure records...</p>
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
            <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Blood Pressure Logs</h2>
              <p className="text-xs text-muted-foreground">Manage and filter your daily blood pressure and pulse entries.</p>
            </div>
          </div>
          <Button onClick={handleCreateClick} className="rounded-xl flex items-center gap-1.5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/10 transition-transform hover:scale-[1.02]">
            <Plus className="h-4 w-4" /> Log Pressure
          </Button>
        </div>

        {/* HISTORY LOGS */}
        <BPHistory 
          readings={readings} 
          onRefresh={fetchReadings} 
          onEdit={handleEditClick} 
        />
      </div>

      {/* CREATE / EDIT FORM MODAL */}
      <BPForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSuccess={fetchReadings}
        readingToEdit={editingReading}
      />
    </DashboardShell>
  );
}
