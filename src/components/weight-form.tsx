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
import { WeightReading } from '@/types';
import confetti from 'canvas-confetti';

interface WeightFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  readingToEdit?: WeightReading | null;
}

export function WeightForm({ isOpen, onClose, onSuccess, readingToEdit }: WeightFormProps) {
  const [value, setValue] = useState<string>('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load last used unit preference on open
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUnit = localStorage.getItem('sugarcare_weight_unit');
      if (savedUnit === 'kg' || savedUnit === 'lbs') {
        setUnit(savedUnit);
      }
    }
  }, [isOpen]);

  // Initialize fields on open or edit
  useEffect(() => {
    if (isOpen) {
      if (readingToEdit) {
        const d = new Date(readingToEdit.reading_time);
        
        // Convert display value based on current unit
        const currentUnit = typeof window !== 'undefined' 
          ? (localStorage.getItem('sugarcare_weight_unit') as 'kg' | 'lbs') || 'kg'
          : 'kg';
        
        setUnit(currentUnit);
        
        if (currentUnit === 'lbs') {
          const valInLbs = Math.round(readingToEdit.weight_value * 2.20462 * 10) / 10;
          setValue(valInLbs.toString());
        } else {
          setValue(readingToEdit.weight_value.toString());
        }
        
        setNotes(readingToEdit.notes || '');
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().split(' ')[0].substring(0, 5));
      } else {
        const d = new Date();
        setValue('');
        setNotes('');
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().split(' ')[0].substring(0, 5));
      }
      setError(null);
    }
  }, [isOpen, readingToEdit]);

  const handleUnitChange = (newUnit: 'kg' | 'lbs') => {
    setUnit(newUnit);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sugarcare_weight_unit', newUnit);
    }
    
    // Convert current input value if it exists
    if (value) {
      const numericVal = parseFloat(value);
      if (!isNaN(numericVal)) {
        if (newUnit === 'lbs') {
          // kg to lbs
          const converted = Math.round(numericVal * 2.20462 * 10) / 10;
          setValue(converted.toString());
        } else {
          // lbs to kg
          const converted = Math.round(numericVal / 2.20462 * 10) / 10;
          setValue(converted.toString());
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputVal = parseFloat(value);
    if (isNaN(inputVal)) {
      setError('Weight must be a valid number.');
      return;
    }

    // Convert input to kg for storing in database
    let weightInKg = inputVal;
    if (unit === 'lbs') {
      weightInKg = inputVal / 2.20462;
    }

    // Round to 1 decimal place
    weightInKg = Math.round(weightInKg * 10) / 10;

    if (weightInKg < 10 || weightInKg > 500) {
      setError(`Weight must be between 10 kg and 500 kg (22 lbs and 1100 lbs).`);
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
        await db.updateWeightReading(readingToEdit.id, weightInKg, notes || null, combinedDateTime);
      } else {
        await db.addWeightReading(weightInKg, notes || null, combinedDateTime);

        // Standard confetti reward for logging weight
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#06b6d4', '#3b82f6', '#22c55e']
        });
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      console.error('Error saving weight reading', e);
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
            {readingToEdit ? 'Edit Weight Entry' : 'Log Weight'}
          </DialogTitle>
          <DialogDescription>
            Record your weight to track body weight trends over time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="weight" className="font-semibold text-sm">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder={unit === 'kg' ? 'e.g. 75.5' : 'e.g. 166.4'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="rounded-xl focus-visible:ring-primary"
                required
              />
            </div>
            
            <div className="flex bg-muted p-1 rounded-xl gap-1">
              <Button
                type="button"
                variant={unit === 'kg' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleUnitChange('kg')}
                className="flex-1 rounded-lg text-xs font-semibold h-9"
              >
                kg
              </Button>
              <Button
                type="button"
                variant={unit === 'lbs' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleUnitChange('lbs')}
                className="flex-1 rounded-lg text-xs font-semibold h-9"
              >
                lbs
              </Button>
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
              placeholder="e.g. Empty stomach, morning, post workout, etc."
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
              {isSubmitting ? 'Saving...' : readingToEdit ? 'Save Changes' : 'Log Weight'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
