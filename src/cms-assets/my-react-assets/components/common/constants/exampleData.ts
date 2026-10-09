import type { ScheduleRow } from '../types';

// Example schedule data, in the sync script's short-key format — for
// reference/testing only, NOT used as a default value.
export const AOSCO_EXAMPLE_SCHEDULE: ScheduleRow[] = [
  { n: '636 Moggill Rd Indooroopilly INBOUND (Portrait)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 803, dwell: '8 Sec (1 in 10)', dim: '4x6', siteId: '96062', nif: 2.2, r7: 2.1, r28: 3.6, ws: ['13/09/2026', '27/09/2026', '11/10/2026', '25/10/2026'] },
  { n: 'BONUS CHAPEL HILL INBOUND', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 803, dwell: '8 Sec (1 in 10)', dim: '4x6', siteId: '96062', nif: 2.2, r7: 2.1, r28: 3.6, ws: ['20/09/2026', '04/10/2026', '18/10/2026', '01/11/2026'] },
  { n: 'Enoggera Rd Newmarket (Landscape)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 4700, dwell: '8 Sec (1 in 10)', dim: '9x3', siteId: '96060', nif: 3.2, r7: 6.3, r28: 9.8, ws: ['13/09/2026', '20/09/2026', '27/09/2026', '11/10/2026', '18/10/2026', '25/10/2026'] },
  { n: 'BONUS NEWMARKET LANDSCAPE', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 4700, dwell: '8 Sec (1 in 10)', dim: '9x3', siteId: '96060', nif: 3.2, r7: 6.3, r28: 9.8, ws: ['04/10/2026', '01/11/2026'] },
  { n: 'Kingsford Smith Drive, Hamilton (Landscape)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 1728, dwell: '8 Sec (1 in 10)', dim: '12x3.3', siteId: '96061', nif: 2.7, r7: 2.8, r28: 4.8, ws: ['13/09/2026', '27/09/2026', '11/10/2026', '25/10/2026'] },
  { n: 'BONUS HAMILTON LANDSCAPE', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 1728, dwell: '8 Sec (1 in 10)', dim: '12x3.3', siteId: '96061', nif: 2.7, r7: 2.8, r28: 4.8, ws: ['20/09/2026', '04/10/2026', '18/10/2026', '01/11/2026'] },
  { n: '100 Lutwyche Rd Windsor (Landscape)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 5706, dwell: '8 Sec (1 in 10)', dim: '12x3.3', siteId: '96104', nif: 3.2, r7: 10, r28: 16.6, ws: ['13/09/2026', '20/09/2026', '27/09/2026', '11/10/2026', '18/10/2026', '25/10/2026'] },
  { n: 'BONUS WINDSOR LANDSCAPE', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 5706, dwell: '8 Sec (1 in 10)', dim: '12x3.3', siteId: '96104', nif: 3.2, r7: 10, r28: 16.6, ws: ['04/10/2026', '01/11/2026'] },
  { n: '100 Ipswich Road Woolloongabba (Landscape)', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 2631, dwell: '10 Sec (1 in 10)', dim: '12x3.3', siteId: '96099', nif: 3.3, r7: 4.7, r28: 7.3, ws: ['20/09/2026', '18/10/2026'] },
  { n: 'BONUS GABBA LANDSCAPE', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 2631, dwell: '10 Sec (1 in 10)', dim: '12x3.3', siteId: '96099', nif: 3.3, r7: 4.7, r28: 7.3, ws: ['04/10/2026', '01/11/2026'] },
  { n: 'CENTENARY Highway DFO Jindalee NEW SITE', bonus: false, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 1610, dwell: '60 Sec (1 in 10)', dim: '15.8x5.4', siteId: '449694', nif: 2.5, r7: 4.5, r28: 7.6, ws: ['27/09/2026', '25/10/2026'] },
  { n: 'CENTENARY Highway DFO Jindalee', bonus: true, sot: '10%', mpw: 630, ot: '6:00', ct: '21:00', iph: 1610, dwell: '60 Sec (1 in 10)', dim: '15.8x5.4', siteId: '449694', nif: 2.5, r7: 4.5, r28: 7.6, ws: ['13/09/2026', '11/10/2026'] },
];
