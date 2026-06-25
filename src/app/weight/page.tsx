'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { WeightHistory } from '@/components/weight-history';
import { WeightForm } from '@/components/weight-form';
import { Button } from '@/components/ui/button';
import { Scale, Plus, Activity } from 'lucide-react';
import { db } from '@/lib/db';
import { WeightReading } from '@/types';

export default function WeightPage() {
  const [readings, setReadings] = useState<WeightReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<WeightReading | null>(null);

  const fetchReadings = async () => {
    try {
      const data = await db.getWeightReadings();
      setReadings(data);
    } catch (e) {
      console.error('Error fetching weight readings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleEditClick = (reading: WeightReading) => {
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
          <p className="text-xs text-muted-foreground font-semibold">Loading weight records...</p>
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
            <div className="bg-cyan-500/10 p-3 rounded-xl text-cyan-500">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Weight Logs</h2>
              <p className="text-xs text-muted-foreground">Manage and filter your daily body weight entries.</p>
            </div>
          </div>
          <Button onClick={handleCreateClick} className="rounded-xl flex items-center gap-1.5 h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-md shadow-cyan-500/10 transition-transform hover:scale-[1.02]">
            <Plus className="h-4 w-4" /> Log Weight
          </Button>
        </div>

        {/* HISTORY LOGS */}
        <WeightHistory 
          readings={readings} 
          onRefresh={fetchReadings} 
          onEdit={handleEditClick} 
        />
      </div>

      {/* CREATE / EDIT FORM MODAL */}
      <WeightForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSuccess={fetchReadings}
        readingToEdit={editingReading}
      />
    </DashboardShell>
  );
}
