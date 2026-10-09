import type { DateParts } from './date';

// ===========================================================================
// Billing — one row per flighting month
// ===========================================================================

export interface BillingRowCalc {
  key: string;
  flighting: string; // "MAR-2027"
  billing: DateParts | null;
  investment: number; // before agency commission
  commission: number;
  net: number; // "Total (less agency comm)"
  gst: number;
  total: number; // net + GST
}

export interface MoneyTotals {
  investment: number;
  commission: number;
  net: number;
  gst: number;
  total: number;
}
