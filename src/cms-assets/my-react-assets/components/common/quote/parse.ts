import type { AgencyQuoteMasterData, QuoteMasterData } from '../types';
import { parseJsonProperty } from '../utils/json';

// deal.quote_master_data -> QuoteMasterData ({} when blank/unreadable)
export function parseQuoteMasterData(raw: unknown): QuoteMasterData {
  return parseJsonProperty<QuoteMasterData>(raw) as QuoteMasterData;
}

// deal.agency_quote_master_data -> AgencyQuoteMasterData ({} when blank/unreadable)
export function parseAgencyQuoteMasterData(raw: unknown): AgencyQuoteMasterData {
  return parseJsonProperty<AgencyQuoteMasterData>(raw) as AgencyQuoteMasterData;
}
