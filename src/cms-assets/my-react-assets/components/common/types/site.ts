// ===========================================================================
// Sites — one row per schedule line, ready to render
// ===========================================================================

export interface SiteRow {
  key: string;
  code: string; // face ID
  name: string; // display name
  locality: string; // "Caboolture" from "Caboolture – 66 Morayfield Rd"
  bonus: boolean;
  size: string; // "12 x 3.3"
  state: string;
  weeks: number[]; // sorted, unique week-start dates (UTC ms)
}

// Agency sites also carry per-week pricing from agency_quote_master_data.
export interface AgencySiteRow extends SiteRow {
  netPerWeek: number; // client rate (after agency commission)
  commissionPerWeek: number;
}

export interface SiteAmounts {
  market: number;
  discount: number;
  commission: number;
  investment: number; // after discount and agency commission
}
