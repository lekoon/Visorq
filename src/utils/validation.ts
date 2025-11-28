/**
 * Validation utilities for forms and data
 */

import { isValidDateString } from './dateUtils';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = 'Field'): ValidationResult {
    if (value === null || value === undefined || value === '') {
        return {
            isValid: false,
            error: `${fieldName} is required`,
        };
    }
    return { isValid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
}

/**
 * Validate string length
 */
export function validateLength(
    value: string,
    min: number,
    max: number,
    fieldName: string = 'Field'
): ValidationResult {
    if (!value) {
        return { isValid: false, error: `${fieldName} is required` };
    }

    if (value.length < min) {
        return {
            isValid: false,
            error: `${fieldName} must be at least ${min} characters`,
        };
    }

    if (value.length > max) {
        return {
            isValid: false,
            error: `${fieldName} must not exceed ${max} characters`,
        };
    }

    return { isValid: true };
}

/**
 * Validate number range
 */
export function validateNumberRange(
    value: number,
    min: number,
    max: number,
    fieldName: string = 'Value'
): ValidationResult {
    if (typeof value !== 'number' || isNaN(value)) {
        return { isValid: false, error: `${fieldName} must be a number` };
    }

    if (value < min || value > max) {
        return {
            isValid: false,
            error: `${fieldName} must be between ${min} and ${max}`,
        };
    }

    return { isValid: true };
}

/**
 * Validate date format and range
 */
export function validateDate(
    dateStr: string,
    minDate?: string,
    maxDate?: string
): ValidationResult {
    if (!dateStr) {
        return { isValid: false, error: 'Date is required' };
    }

    if (!isValidDateString(dateStr)) {
        return { isValid: false, error: 'Invalid date format' };
    }

    if (minDate && dateStr < minDate) {
        return {
            isValid: false,
            error: `Date must be after ${minDate}`,
        };
    }

    if (maxDate && dateStr > maxDate) {
        return {
            isValid: false,
            error: `Date must be before ${maxDate}`,
        };
    }

    return { isValid: true };
}

/**
 * Validate date range (start before end)
 */
export function validateDateRange(
    startDate: string,
    endDate: string
): ValidationResult {
    const startValidation = validateDate(startDate);
    if (!startValidation.isValid) {
        return { isValid: false, error: `Start date: ${startValidation.error}` };
    }

    const endValidation = validateDate(endDate);
    if (!endValidation.isValid) {
        return { isValid: false, error: `End date: ${endValidation.error}` };
    }

    if (startDate > endDate) {
        return {
            isValid: false,
            error: 'Start date must be before end date',
        };
    }

    return { isValid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): ValidationResult {
    if (!url) {
        return { isValid: false, error: 'URL is required' };
    }

    try {
        new URL(url);
        return { isValid: true };
    } catch {
        return { isValid: false, error: 'Invalid URL format' };
    }
}

/**
 * Validate phone number (basic)
 */
export function validatePhone(phone: string): ValidationResult {
    if (!phone) {
        return { isValid: false, error: 'Phone number is required' };
    }

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
        return { isValid: false, error: 'Invalid phone number format' };
    }

    return { isValid: true };
}

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(value: number): ValidationResult {
    return validateNumberRange(value, 0, 100, 'Percentage');
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): ValidationResult {
    const requiredCheck = validateRequired(name, 'Project name');
    if (!requiredCheck.isValid) return requiredCheck;

    return validateLength(name, 3, 100, 'Project name');
}

/**
 * Validate resource quantity
 */
export function validateResourceQuantity(quantity: number): ValidationResult {
    if (typeof quantity !== 'number' || isNaN(quantity)) {
        return { isValid: false, error: 'Quantity must be a number' };
    }

    if (quantity <= 0) {
        return { isValid: false, error: 'Quantity must be greater than 0' };
    }

    if (!Number.isInteger(quantity)) {
        return { isValid: false, error: 'Quantity must be a whole number' };
    }

    return { isValid: true };
}

/**
 * Validate budget/cost
 */
export function validateCost(cost: number): ValidationResult {
    if (typeof cost !== 'number' || isNaN(cost)) {
        return { isValid: false, error: 'Cost must be a number' };
    }

    if (cost < 0) {
        return { isValid: false, error: 'Cost cannot be negative' };
    }

    return { isValid: true };
}

/**
 * Validate factor score (0-10)
 */
export function validateFactorScore(score: number): ValidationResult {
    return validateNumberRange(score, 0, 10, 'Factor score');
}

/**
 * Validate weight (0-100)
 */
export function validateWeight(weight: number): ValidationResult {
    return validateNumberRange(weight, 0, 100, 'Weight');
}

/**
 * Batch validation helper
 */
export function validateAll(
    validations: ValidationResult[]
): { isValid: boolean; errors: string[] } {
    const errors = validations
        .filter((v) => !v.isValid)
        .map((v) => v.error || 'Validation error');

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .trim();
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize(
    input: string,
    minLength: number = 1,
    maxLength: number = 1000
): { value: string; validation: ValidationResult } {
    const sanitized = sanitizeString(input);
    const validation = validateLength(sanitized, minLength, maxLength);

    return {
        value: sanitized,
        validation,
    };
}
