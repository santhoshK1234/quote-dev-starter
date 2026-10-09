// ===========================================================================
// quote_master_data — the JSON deal property shared by every quote module
// ===========================================================================

export interface AdvertiserDetails {
  greetingName: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  address?: string;
}

export interface AccountDetails {
  accountsName: string;
  accountsProcess: string;
  accountsEmail: string;
}

export interface AgencyDetails {
  agencyName: string;
  shortName?: string; // e.g. "OAC" -> "OAC commission 30%"
  addressLine1: string;
  addressLine2: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface CampaignBooking {
  campaignName: string;
  referenceId: string;
  siteSizeType: string;
  type: string;
  weeksRequired: number | string;
  startDate: string;
  endDate: string;
}

// One row of quote_master_data.ad_schedules (sync script's short keys)
export interface ScheduleRow {
  n?: string | null; // site name
  bonus?: boolean | string | null;
  sot?: string | number | null;
  mpw?: string | number | null;
  ot?: string | null;
  ct?: string | null;
  iph?: string | number | null;
  dwell?: string | null;
  dim?: string | null; // "4x6", "12.0x3.3 m"
  siteId?: string | null;
  fid?: string | null; // face ID -> site code
  st?: string | null; // state (optional)
  nif?: string | number | null;
  r7?: string | number | null;
  r28?: string | number | null;
  ws?: string[]; // week-start dates "dd/mm/yyyy"
  totalWeeks?: number;
}

export interface ScheduleMeta {
  locality: string; // cover subtitle, e.g. "Brisbane Digital"
  state: string; // default state for the placements table
  bonusNote: string;
}

export interface ExecutionParty {
  representativeName: string;
  position: string;
  date: string;
  onBehalfOf?: string; // e.g. "Toyota / OA Collective (820MJL8IF)"
}

export interface Execution {
  advertiser: ExecutionParty;
  aosco: ExecutionParty;
}

// The parsed shape of the quote_master_data JSON property.
export interface QuoteMasterData {
  logoSrc?: string;
  coverImageSrc?: string;
  documentTitle?: string;
  companyLegalName?: string;
  advertiser?: Partial<AdvertiserDetails>;
  account?: Partial<AccountDetails>;
  agency?: Partial<AgencyDetails>;
  campaign?: Partial<CampaignBooking>;
  ad_schedules?: ScheduleRow[];
  scheduleMeta?: Partial<ScheduleMeta>;
  specialConditions?: string[];
  execution?: {
    advertiser?: Partial<ExecutionParty>;
    aosco?: Partial<ExecutionParty>;
  };
}
