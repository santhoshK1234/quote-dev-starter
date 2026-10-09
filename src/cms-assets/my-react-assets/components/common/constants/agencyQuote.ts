import type { Execution } from '../types';
import { AOSCO_SIGNATORY } from './brand';

// ===========================================================================
// Default copy — agency quotes: AoscoQuoteModuleAgency, AoscoQuoteModuleAgency45
// ===========================================================================

export const AGENCY_DOCUMENT_TITLE = 'ADVERTISING ORDER';

// Days after end of the flighting month that an invoice is due.
export const AGENCY_BILLING_DAYS_EOM = 0; // billed monthly at EOM
export const AGENCY45_BILLING_DAYS_EOM = 47; // invoice due = end of flighting month + 47 days

export const AGENCY_DEFAULT_EXECUTION: Execution = {
  advertiser: { representativeName: '', position: 'Director', date: '' },
  aosco: { ...AOSCO_SIGNATORY },
};

// "Billing cycle monthly (EOM)" / "Billing cycle 47 days EOM"
export function billingCycleHeader(billingDaysEom: number): string {
  return billingDaysEom > 0 ? `Billing cycle ${billingDaysEom} days EOM` : 'Billing cycle monthly (EOM)';
}

export function defaultAgencySpecialConditions(agencyName: string, billingDaysEom = 0): string[] {
  const list = [
    'Unlimited material changes / uploads included.',
    billingDaysEom > 0
      ? `Billed ${billingDaysEom} days EOM.`
      : 'Billed monthly, at the end of each flighting month (EOM).',
    'Cancellation (COVID consideration): AOSco agrees to honour a 7-day cancellation deadline, effective up until the Monday before campaign launch, in writing.',
    'AOSco will offer bonus STA sites to the same spec if we have the avails.',
    'Bonus offered in this campaign is placed STA.',
  ];
  if (agencyName) {
    list.push(
      `Monies owed to AOSco can be resolved outside of ${agencyName} if ${agencyName} are trading insolvent – settled with media agency directly, monies due as per the above term dates.`,
    );
  }
  return list;
}
