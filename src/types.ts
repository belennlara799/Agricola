/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface WorkEntry {
  id: string;
  productId: string;
  quantity: number;
  date: string; // format: YYYY-MM-DD
  rate: number; // rate of the product at the time of entry
  total: number; // quantity * rate
}

export interface WorkDay {
  date: string; // format: YYYY-MM-DD
  dayName: string; // "Jueves", "Viernes", etc.
  entries: WorkEntry[];
  totalGross: number;
}

export interface WorkWeek {
  id: string; // format: YYYY-MM-DD (representing the Wednesday end date)
  startDate: string; // format: YYYY-MM-DD (Thursday)
  endDate: string; // format: YYYY-MM-DD (Wednesday)
  totalGross: number;
  deduction: number; // 19% of totalGross
  totalNet: number; // totalGross - deduction
}

export interface FilterState {
  year: string;  // "all" or specific year e.g. "2026"
  month: string; // "all" or specific month (0-11 as string)
  week: string;  // "all" or specific weekId YYYY-MM-DD
}
