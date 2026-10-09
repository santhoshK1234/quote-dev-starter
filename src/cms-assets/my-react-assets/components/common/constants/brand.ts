import type { ExecutionParty } from '../types';

// ===========================================================================
// Brand — AOSco identity shared by every quote
// ===========================================================================

export const LOGO_SRC =
  'https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/logo.png';
// Cover photo. Swap for the billboard photo once it's uploaded to File Manager.
export const HERO_IMAGE_SRC =
  'https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/Quote%20Cover.png';

export const COMPANY_LEGAL_NAME = 'Australian Outdoor Sign Company Pty Ltd';

// Who signs on AOSco's side by default (quote_master_data.execution.aosco overrides).
export const AOSCO_SIGNATORY: ExecutionParty = {
  representativeName: 'Jesse McIntyre',
  position: 'Sales Director',
  date: '',
};
