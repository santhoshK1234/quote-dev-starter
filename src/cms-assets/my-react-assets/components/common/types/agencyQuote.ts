// ===========================================================================
// agency_quote_master_data — built by the NestJS line-item sync.
// Short keys keep the JSON small.
// ===========================================================================

export interface AgencyQuoteMonth {
  k: string; // month "YYYY-MM"
  w: number; // weeks booked (all schedules)
  r: number; // client total  -> "Total (less agency comm)"
  a: number; // agency commission
}

export interface AgencyQuoteSchedule {
  n: string | null; // name
  r: number; // client_rate_per_week
  a: number; // agency_discount_amount per week
  w: Record<string, number>; // weeks per month
  d?: string[]; // week-start dates "YYYY-MM-DD"
}

export interface AgencyQuoteMasterData {
  v?: number;
  m?: AgencyQuoteMonth[];
  s?: AgencyQuoteSchedule[];
}
