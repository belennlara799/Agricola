/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const DAYS_ES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

export const DAYS_PAY_WEEK_ORDER = [
  "Jueves", "Viernes", "Sábado", "Domingo", "Lunes", "Martes", "Miércoles"
];

/**
 * Returns a string in 'YYYY-MM-DD' format (local time, safe from timezone shifts)
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses 'YYYY-MM-DD' safely in local timezone
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * For any given date, calculates the Wednesday cutoff date of that pay week.
 * The pay week starts on Thursday and ends on Wednesday.
 */
export function getPayWeekEndingDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? parseDateString(dateInput) : new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  
  // Calculate days to add to get to the upcoming Wednesday
  // Sun (0) -> +3 days
  // Mon (1) -> +2 days
  // Tue (2) -> +1 day
  // Wed (3) -> +0 days
  // Thu (4) -> +6 days
  // Fri (5) -> +5 days
  // Sat (6) -> +4 days
  const daysToAdd = (3 - day + 7) % 7;
  
  const targetDate = new Date(date);
  targetDate.setDate(date.getDate() + daysToAdd);
  return formatDateString(targetDate);
}

/**
 * Given a Wednesday ending date string, returns the Thursday start date string (6 days prior)
 */
export function getPayWeekStartDate(endingDateStr: string): string {
  const endDate = parseDateString(endingDateStr);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 6);
  return formatDateString(startDate);
}

/**
 * Returns the 7 days of the pay week in order: Thursday, Friday, Saturday, Sunday, Monday, Tuesday, Wednesday.
 */
export function getDaysOfWeekForPayWeek(endingDateStr: string): { date: string; dayName: string }[] {
  const endDate = parseDateString(endingDateStr);
  const days: { date: string; dayName: string }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const current = new Date(endDate);
    current.setDate(endDate.getDate() - i);
    const dateStr = formatDateString(current);
    
    // Get Spanish day name
    const dayIndex = current.getDay();
    const dayName = DAYS_ES[dayIndex];
    days.push({
      date: dateStr,
      dayName
    });
  }
  
  return days;
}

/**
 * Formats YYYY-MM-DD into a human-readable Spanish string
 */
export function formatToHumanDate(dateStr: string, includeYear = true): string {
  try {
    const date = parseDateString(dateStr);
    const dayName = DAYS_ES[date.getDay()];
    const dayNum = date.getDate();
    const monthName = MONTHS_ES[date.getMonth()];
    const year = date.getFullYear();
    
    if (includeYear) {
      return `${dayName}, ${dayNum} de ${monthName} de ${year}`;
    }
    return `${dayName}, ${dayNum} de ${monthName}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Formats a pay week range, e.g., "Jue 02/Jul al Mié 08/Jul, 2026"
 */
export function formatPayWeekRange(endingDateStr: string): string {
  const startDateStr = getPayWeekStartDate(endingDateStr);
  const start = parseDateString(startDateStr);
  const end = parseDateString(endingDateStr);
  
  const startDay = start.getDate();
  const startMonth = MONTHS_ES[start.getMonth()].substring(0, 3);
  const endDay = end.getDate();
  const endMonth = MONTHS_ES[end.getMonth()].substring(0, 3);
  const year = end.getFullYear();
  
  if (start.getMonth() === end.getMonth()) {
    return `${startDay} al ${endDay} de ${MONTHS_ES[end.getMonth()]}, ${year}`;
  }
  return `${startDay} de ${startMonth} al ${endDay} de ${endMonth}, ${year}`;
}

/**
 * Formats a currency value as CLP ($ 1.234)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace('CLP', '$').trim();
}
