import type { AccountDetails, AdvertiserDetails, Execution } from '../types';
import { AOSCO_SIGNATORY } from './brand';

// ===========================================================================
// Default copy — direct (non-agency) quotes: AoscoQuoteModule
// ===========================================================================

export const DIRECT_DOCUMENT_TITLE = 'ADVERTISING AGREEMENT';

export const DEFAULT_ADVERTISER: AdvertiserDetails = { greetingName: 'Nic', companyName: '', contactName: '', phone: '', email: '' };
export const DEFAULT_ACCOUNT: AccountDetails = { accountsName: '', accountsProcess: 'Please send to Nic for distribution and payment', accountsEmail: '' };
export const DEFAULT_REFERENCE_ID = 'AOS-';
export const DIRECT_DEFAULT_EXECUTION: Execution = {
  advertiser: { representativeName: '', position: 'Owner', date: '' },
  aosco: { ...AOSCO_SIGNATORY },
};

// Transcribed verbatim, including the source document's own numbering
// (items 7-9 are one continuous sentence split across three numbers in
// both the .docx and the .pdf export — that's the original, not a
// conversion artifact, so it's reproduced as-is).
export const DEFAULT_SPECIAL_CONDITIONS: string[] = [
  'Unlimited Material Changes / Uploads Included.',
  'Advertising to commence 30th August 2026',
  'AOSCO will upload earlier than start date once contract is signed and artwork is sized suitable',
  'AOSCO will re size artwork to suit at no Charge.',
  'Invoiced over 1 equal amount in August',
  'CANCELLATION (COVID Consideration) - AOSco agrees to honour a 7-day cancellation deadline, effective up until Monday before campaign launch in writing.',
  'Execution - I acknowledge that I have received and read this Agreement, confirm that the details contained',
  'within (including regarding payments due) are correct and hereby agree to be bound to this Agreement and',
  'the Terms and Conditions as attached.',
  'AOSco will offer Bonus STA Sites to the same spec if we have the avails.',
  'Bonus offered in this campaign is placed as 100% Guaranteed Bonus',
];
