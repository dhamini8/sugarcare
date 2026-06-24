'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { db } from '@/lib/db';
import { BPReading } from '@/types';
import confetti from 'canvas-confetti';

interface BPFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readingToEdit?: BPReading | null;
}

export function BPForm({ isOpen, onClose, onSuccess, readingToEdit }: BPFormProps) {
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize fields on open or edit
  useEffect(() => {
    if (isOpen) {
      if (readingToEdit) {
        const d = new Date(readingToEdit.reading_time);
        setSystolic(readingToEdit.systolic.toString());
        setDiastolic(readingToEdit.diastolic.toString());
        setPulse(readingToEdit.pulse.toString());
        setNotes(readingToEdit.notes || '');
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().split(' ')[0].substring(0, 5));
      } else {
        const d = new Date();
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setNotes('');
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().split(' ')[0].substring(0, 5));
      }
      setError(null);
    }
  }, [isOpen, readingToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sysVal = parseInt(systolic, 10);
    const diaVal = parseInt(diastolic, 10);
    const pulseVal = parseInt(pulse, 10);

    if (isNaN(sysVal) || sysVal < 50 || sysVal > 250) {
      setError('Systolic BP must be a number between 50 and 250 mmHg.');
      return;
    }

    if (isNaN(diaVal) || diaVal < 30 || diaVal > 150) {
      setError('Diastolic BP must be a number between 30 and 150 mmHg.');
      return;
    }

    if (isNaN(pulseVal) || pulseVal <= 0 || pulseVal > 250) {
      setError('Pulse rate must be a positive number (bpm).');
      return;
    }

    if (!date || !time) {
      setError('Date and time are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedDateTime = new Date(`${date}T${time}`).toISOString();

      if (readingToEdit) {
        await db.updateBPReading(readingToEdit.id, sysVal, diaVal, pulseVal, notes || null, combinedDateTime);
      } else {
        await db.addBPReading(sysVal, diaVal, pulseVal, notes || null, combinedDateTime);

        // Check if value is in a normal range (< 120 / < 80)
        if (sysVal < 120 && diaVal < 80) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#10b981', '#3b82f6', '#34d399']
          });
        }
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      console.error('Error saving BP reading', e);
      setError(e.message || 'An error occurred while saving the reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            {readingToEdit ? 'Edit Blood Pressure Reading' : 'Log Blood Pressure'}
          </DialogTitle>
          <DialogDescription>
            Enter your systolic and diastolic measurements. Normal blood pressure is under 120/80 mmHg.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="systolic" className="font-semibold text-sm">Systolic</Label>
              <Input
                id="systolic"
                type="number"
                placeholder="120"
                min="50"
                max="250"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="rounded-xl focus-visible:ring-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="diastolic" className="font-semibold text-sm">Diastolic</Label>
              <Input
                id="diastolic"
                type="number"
                placeholder="80"
                min="30"
                max="150"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="rounded-xl focus-visible:ring-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pulse" className="font-semibold text-sm">Pulse (bpm)</Label>
              <Input
                id="pulse"
                type="number"
                placeholder="72"
                min="1"
                max="250"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="rounded-xl focus-visible:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date" className="font-semibold text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="time" className="font-semibold text-sm">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes" className="font-semibold text-sm">Notes (Optional)</Label>
            <textarea
              id="notes"
              placeholder="e.g. Left arm, sitting down, stressed, had caffeine etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl shadow-sm shadow-primary/10">
              {isSubmitting ? 'Saving...' : readingToEdit ? 'Save Changes' : 'Log Reading'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
