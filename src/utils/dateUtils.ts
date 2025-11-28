/**
 * Centralized date utilities using date-fns
 * Provides consistent date handling across the application
 */

import {
    format,
    parse,
    parseISO,
    isValid,
    differenceInDays,
    differenceInMonths,
    addDays,
    addMonths,
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    isAfter,
    isBefore,
    isSameDay,
    isWithinInterval,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * Standard date format used across the application
 */
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
export const DISPLAY_DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';

/**
 * Safely parse a date string
 */
export function safeParseDateString(dateStr: string | undefined | null): Date | null {
    if (!dateStr) return null;

    try {
        const date = parseISO(dateStr);
        return isValid(date) ? date : null;
    } catch {
        return null;
    }
}

/**
 * Format date to standard string format
 */
export function formatDateString(date: Date | string | null | undefined, formatStr: string = DATE_FORMAT): string {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return isValid(dateObj) ? format(dateObj, formatStr) : '';
    } catch {
        return '';
    }
}

/**
 * Format date for display (localized)
 */
export function formatDisplayDate(date: Date | string | null | undefined, useLocale: boolean = false): string {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return isValid(dateObj)
            ? format(dateObj, DISPLAY_DATE_FORMAT, useLocale ? { locale: zhCN } : undefined)
            : '';
    } catch {
        return '';
    }
}

/**
 * Get today's date as string
 */
export function getTodayString(): string {
    return format(new Date(), DATE_FORMAT);
}

/**
 * Calculate days between two dates
 */
export function getDaysBetween(startDate: string | Date, endDate: string | Date): number {
    const start = typeof startDate === 'string' ? safeParseDateString(startDate) : startDate;
    const end = typeof endDate === 'string' ? safeParseDateString(endDate) : endDate;

    if (!start || !end) return 0;

    return differenceInDays(end, start);
}

/**
 * Calculate months between two dates
 */
export function getMonthsBetween(startDate: string | Date, endDate: string | Date): number {
    const start = typeof startDate === 'string' ? safeParseDateString(startDate) : startDate;
    const end = typeof endDate === 'string' ? safeParseDateString(endDate) : endDate;

    if (!start || !end) return 0;

    return differenceInMonths(end, start);
}

/**
 * Add days to a date
 */
export function addDaysToDate(date: string | Date, days: number): string {
    const dateObj = typeof date === 'string' ? safeParseDateString(date) : date;
    if (!dateObj) return getTodayString();

    return format(addDays(dateObj, days), DATE_FORMAT);
}

/**
 * Add months to a date
 */
export function addMonthsToDate(date: string | Date, months: number): string {
    const dateObj = typeof date === 'string' ? safeParseDateString(date) : date;
    if (!dateObj) return getTodayString();

    return format(addMonths(dateObj, months), DATE_FORMAT);
}

/**
 * Check if date is in the past
 */
export function isDatePast(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? safeParseDateString(date) : date;
    if (!dateObj) return false;

    return isBefore(dateObj, startOfDay(new Date()));
}

/**
 * Check if date is in the future
 */
export function isDateFuture(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? safeParseDateString(date) : date;
    if (!dateObj) return false;

    return isAfter(dateObj, endOfDay(new Date()));
}

/**
 * Check if date is today
 */
export function isDateToday(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? safeParseDateString(date) : date;
    if (!dateObj) return false;

    return isSameDay(dateObj, new Date());
}

/**
 * Check if date is within a range
 */
export function isDateInRange(
    date: string | Date,
    startDate: string | Date,
    endDate: string | Date
): boolean {
    const dateObj = typeof date === 'string' ? safeParseDateString(date) : date;
    const start = typeof startDate === 'string' ? safeParseDateString(startDate) : startDate;
    const end = typeof endDate === 'string' ? safeParseDateString(endDate) : endDate;

    if (!dateObj || !start || !end) return false;

    return isWithinInterval(dateObj, { start, end });
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 months")
 */
export function getRelativeTimeString(date: string | Date): string {
    const dateObj = typeof date === 'string' ? safeParseDateString(date) : date;
    if (!dateObj) return '';

    const now = new Date();
    const days = differenceInDays(dateObj, now);

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0 && days < 7) return `In ${days} days`;
    if (days < 0 && days > -7) return `${Math.abs(days)} days ago`;
    if (days > 0 && days < 30) return `In ${Math.ceil(days / 7)} weeks`;
    if (days < 0 && days > -30) return `${Math.ceil(Math.abs(days) / 7)} weeks ago`;
    if (days > 0) return `In ${Math.ceil(days / 30)} months`;
    return `${Math.ceil(Math.abs(days) / 30)} months ago`;
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: string; end: string } {
    const now = new Date();
    return {
        start: format(startOfMonth(now), DATE_FORMAT),
        end: format(endOfMonth(now), DATE_FORMAT),
    };
}

/**
 * Validate date string format
 */
export function isValidDateString(dateStr: string): boolean {
    if (!dateStr) return false;

    const date = safeParseDateString(dateStr);
    return date !== null && isValid(date);
}

/**
 * Compare two dates
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1: string | Date, date2: string | Date): number {
    const d1 = typeof date1 === 'string' ? safeParseDateString(date1) : date1;
    const d2 = typeof date2 === 'string' ? safeParseDateString(date2) : date2;

    if (!d1 || !d2) return 0;

    if (isBefore(d1, d2)) return -1;
    if (isAfter(d1, d2)) return 1;
    return 0;
}

/**
 * Get business days between two dates (excluding weekends)
 */
export function getBusinessDays(startDate: string | Date, endDate: string | Date): number {
    const start = typeof startDate === 'string' ? safeParseDateString(startDate) : startDate;
    const end = typeof endDate === 'string' ? safeParseDateString(endDate) : endDate;

    if (!start || !end) return 0;

    let count = 0;
    let current = new Date(start);

    while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
            count++;
        }
        current = addDays(current, 1);
    }

    return count;
}
