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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { db } from '@/lib/db';
import { SugarReading, SugarReadingType } from '@/types';
import confetti from 'canvas-confetti';

interface SugarFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readingToEdit?: SugarReading | null;
}

export function SugarForm({ isOpen, onClose, onSuccess, readingToEdit }: SugarFormProps) {
  const [value, setValue] = useState<string>('');
  const [type, setType] = useState<SugarReadingType>('Fasting');
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
        setValue(readingToEdit.sugar_value.toString());
        setType(readingToEdit.reading_type);
        setNotes(readingToEdit.notes || '');
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().split(' ')[0].substring(0, 5));
      } else {
        const d = new Date();
        setValue('');
        setType('Fasting');
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

    const sugarVal = parseInt(value, 10);
    if (isNaN(sugarVal) || sugarVal < 20 || sugarVal > 600) {
      setError('Blood sugar value must be a number between 20 and 600 mg/dL.');
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
        await db.updateSugarReading(readingToEdit.id, sugarVal, type, notes || null, combinedDateTime);
      } else {
        await db.addSugarReading(sugarVal, type, notes || null, combinedDateTime);

        // Check if value is in a healthy range for confetti reward
        // Healthy thresholds:
        // Fasting: 70-100 mg/dL
        // Before Meal: 70-130 mg/dL
        // After Meal: < 140 mg/dL
        // Random: 70-140 mg/dL
        let isHealthy = false;
        if (type === 'Fasting' && sugarVal >= 70 && sugarVal <= 100) isHealthy = true;
        else if (type === 'Before Meal' && sugarVal >= 70 && sugarVal <= 130) isHealthy = true;
        else if (type === 'After Meal' && sugarVal < 140 && sugarVal >= 70) isHealthy = true;
        else if (type === 'Random' && sugarVal >= 70 && sugarVal <= 140) isHealthy = true;

        if (isHealthy) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#3b82f6', '#10b981', '#60a5fa']
          });
        }
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      console.error('Error saving reading', e);
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
            {readingToEdit ? 'Edit Blood Sugar Reading' : 'Log Blood Sugar'}
          </DialogTitle>
          <DialogDescription>
            Enter details of your blood glucose level. Normal ranges depend on meal status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="value" className="font-semibold text-sm">Value (mg/dL)</Label>
              <Input
                id="value"
                type="number"
                placeholder="e.g. 95"
                min="20"
                max="600"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="rounded-xl focus-visible:ring-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type" className="font-semibold text-sm">Reading Type</Label>
              <Select value={type} onValueChange={(val) => setType(val as SugarReadingType)}>
                <SelectTrigger id="type" className="rounded-xl focus:ring-primary">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Fasting">Fasting</SelectItem>
                  <SelectItem value="Before Meal">Before Meal</SelectItem>
                  <SelectItem value="After Meal">After Meal</SelectItem>
                  <SelectItem value="Random">Random</SelectItem>
                </SelectContent>
              </Select>
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
              placeholder="e.g. Felt a bit dizzy, after breakfast, sleep quality etc."
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
