import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStrOrObj: string | Date, formatStr: string = 'dd MMM yyyy'): string {
  try {
    const d = typeof dateStrOrObj === 'string' ? parseISO(dateStrOrObj) : dateStrOrObj;
    return format(d, formatStr);
  } catch {
    return String(dateStrOrObj);
  }
}

export function formatTime(dateStrOrObj: string | Date, is24h: boolean = false): string {
  try {
    const d = typeof dateStrOrObj === 'string' ? parseISO(dateStrOrObj) : dateStrOrObj;
    return format(d, is24h ? 'HH:mm' : 'hh:mm a');
  } catch {
    return String(dateStrOrObj);
  }
}

export function formatDateTime(dateStrOrObj: string | Date): string {
  try {
    const d = typeof dateStrOrObj === 'string' ? parseISO(dateStrOrObj) : dateStrOrObj;
    return format(d, 'dd MMM yyyy, hh:mm a');
  } catch {
    return String(dateStrOrObj);
  }
}

export function calculateTimeRemaining(scheduledExitTime: string): {
  remainingSeconds: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  overtimeSeconds: number;
} {
  const now = new Date();
  const exit = typeof scheduledExitTime === 'string' ? parseISO(scheduledExitTime) : new Date(scheduledExitTime);
  const diffSec = differenceInSeconds(exit, now);

  if (diffSec <= 0) {
    return {
      remainingSeconds: 0,
      isExpired: true,
      isExpiringSoon: false,
      overtimeSeconds: Math.abs(diffSec),
    };
  }

  return {
    remainingSeconds: diffSec,
    isExpired: false,
    isExpiringSoon: diffSec <= 300, // <= 5 minutes
    overtimeSeconds: 0,
  };
}

export function calculateOvertimePenalty(
  overtimeMinutes: number,
  intervalMinutes: number,
  penaltyAmount: number
): { intervals: number; charge: number } {
  const validOvertime = Math.max(0, Math.floor(overtimeMinutes));
  const validInterval = Math.max(1, Math.floor(intervalMinutes));
  const validAmount = Math.max(0, Number(penaltyAmount) || 0);
  const intervals = Math.floor(validOvertime / validInterval);

  return {
    intervals,
    charge: intervals * validAmount,
  };
}

export function formatSecondsToHHMMSS(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Web Audio API synthesized sound generator
 * No external network MP3/WAV files needed, works reliably 100% offline
 */
export function playAlertSound(type: 'warning' | 'expired' | 'success' | 'click' = 'warning', volume: number = 70): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const gainNode = ctx.createGain();
    const vol = Math.max(0, Math.min(1, volume / 100));
    gainNode.gain.setValueAtTime(vol * 0.35, ctx.currentTime);
    gainNode.connect(ctx.destination);

    if (type === 'warning') {
      // Gentle dual chime (5-min warning)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } else if (type === 'expired') {
      // Urgent triple alert beep
      [0, 0.2, 0.4].forEach((delay) => {
        const osc = ctx.createOscillator();
        const localGain = ctx.createGain();
        localGain.gain.setValueAtTime(vol * 0.4, ctx.currentTime + delay);
        localGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, ctx.currentTime + delay);
        osc.connect(localGain);
        localGain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      });
    } else if (type === 'success') {
      // Positive uplift tone
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      osc.connect(gainNode);
      osc.start(ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.stop(ctx.currentTime + 0.45);
    } else {
      // Subtle click
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.connect(gainNode);
      osc.start(ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

/**
 * Clean CSV export utility
 */
export function exportToCsv(filename: string, rows: Record<string, unknown>[]): boolean {
  if (!rows || rows.length === 0) return false;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          cell = cell.replace(/"/g, '""');
          return `"${cell}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([`\ufeff${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return true;
}

/**
 * Excel (.xlsx) export utility using xlsx
 */
export function exportToExcel(
  filename: string,
  sheets: { sheetName: string; data: Record<string, unknown>[] }[]
): void {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ sheetName, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  });
  XLSX.writeFile(wb, `${filename.replace(/\.xlsx$/, '')}.xlsx`);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID
 */
export function isValidUuid(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}
