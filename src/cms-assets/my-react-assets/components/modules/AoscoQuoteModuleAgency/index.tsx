// import React from "react";

// import { fields } from "./fields";

// export { fields };

// export interface AdvertiserDetails {
//   greetingName: string;
//   companyName: string;
//   contactName: string;
//   phone: string;
//   email: string;
//   address: string;
// }

// export interface AccountDetails {
//   accountsName: string;
//   accountsProcess: string;
//   accountsEmail: string;
// }

// export interface AgencyDetails {
//   agencyName: string;
//   addressLine1: string;
//   addressLine2: string;
//   contactName: string;
//   phone: string;
//   email: string;
// }

// export interface CampaignBooking {
//   campaignName: string;
//   referenceId: string;
//   siteSizeType: string;
//   type: string;
//   weeksRequired: number;
//   startDate: string;
//   endDate: string;
// }

// export interface ScheduleMeta {
//   locality: string;
//   cashContraLabel: string;
//   weekCommencingLabel: string;
//   bonusPlacementLabel: string;
//   reachInfoLabel: string;
//   broadcastInfoLabel: string;
//   bonusNote: string;
// }

// export interface BillingRow {
//   flighting: string;
//   billingDate: string;
//   investment: number;
//   gst: number;
//   total: number;
// }

// export interface Billing {
//   attAccounts: string;
//   invoice1: string;
//   invoice2: string;
//   rows: BillingRow[];
// }

// export interface ExecutionParty {
//   representativeName: string;
//   position: string;
//   date: string;
// }

// export interface Execution {
//   advertiser: ExecutionParty;
//   aosco: ExecutionParty;
// }

// // The parsed shape of the quote_master_data JSON property.
// export interface QuoteMasterData {
//   logoSrc?: string;
//   coverImageSrc?: string;
//   documentTitle?: string;
//   companyLegalName?: string;
//   advertiser?: Partial<AdvertiserDetails>;
//   account?: Partial<AccountDetails>;
//   agency?: Partial<AgencyDetails>;
//   campaign?: Partial<CampaignBooking>;
//   weekDates?: string[];
//   scheduleMeta?: Partial<ScheduleMeta>;
//   billing?: Partial<Billing>;
//   specialConditions?: string[];
//   execution?: {
//     advertiser?: Partial<ExecutionParty>;
//     aosco?: Partial<ExecutionParty>;
//   };
// }

// // ---------------------------------------------------------------------------
// // HubSpot module types
// // ---------------------------------------------------------------------------

// type CrmValue = string | number | null | undefined;

// // Must match the keys built in hublDataTemplate at the bottom of this file.
// // Everything comes from the DEAL record only (single source of truth) —
// // the billing contact / billing company on the quote are not read.
// interface HublData {
//   isQuoteBlueprint: boolean;

//   // Deal
//   dealId?: CrmValue;
//   dealName?: CrmValue;
//   campaignStartDate?: CrmValue; // HubSpot date property (epoch ms or YYYY-MM-DD)
//   campaignEndDate?: CrmValue;
//   scheduleSummaryJson?: unknown; // quote_master_data — usually a JSON string, parsed client-side below

//   // Deal — billing amounts
//   investment?: CrmValue; // total_commercial_rate (ex GST)
//   gstAmount?: CrmValue; // gst_amount
//   totalInvestment?: CrmValue; // total_investment (incl GST)

//   // Deal — advertiser (also used for Account Details: same person)
//   advertiserCompany?: CrmValue; // advertiser_company
//   advertiserFirstName?: CrmValue; // advertiser_contact_first_name
//   advertiserLastName?: CrmValue; // advertiser_contact_last_name
//   advertiserPhone?: CrmValue; // advertiser_person_phone_number
//   advertiserEmail?: CrmValue; // advertiser_person_email_address

//   // Deal — agency (a different person)
//   agencyCompanyName?: CrmValue; // agency_company_name
//   agencyFirstName?: CrmValue; // agency_person_first_name
//   agencyLastName?: CrmValue; // agency_person_last_name
//   agencyEmail?: CrmValue; // agency_person_email
//   agencyPhone?: CrmValue; // agency_person_email
//   agencyAddress?: CrmValue; // agency_company_address
//   agencyAddressLine2?: CrmValue; // agency_address_line_2
// }

// interface Props {
//   fieldValues: FieldValues;
//   hublData: HublData;
// }

// interface FieldValues {}

// // ---------------------------------------------------------------------------
// // Helpers
// // ---------------------------------------------------------------------------

// function pad2(n: number): string {
//   return String(n).padStart(2, "0");
// }

// // Formats a HubSpot deal date property (campaign_start_date etc.) as
// // dd/mm/yyyy. HubSpot sends these as Australian day-first dates with a
// // two- or four-digit year: "1/9/26", "01/09/26", "01/09/2026" -> "01/09/2026".
// // Two-digit years are read as 20xx. Also accepts epoch timestamps and
// // ISO "2026-09-01" in case the property format ever changes.
// function formatHubspotDate(value: CrmValue): string {
//   if (value === null || value === undefined) return "";
//   const raw = String(value).trim();
//   if (!raw) return "";

//   // d/m/yy, dd/mm/yy, d/m/yyyy, dd/mm/yyyy (optionally followed by a time)
//   const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})(?!\d)/);
//   if (dmy) {
//     const day = Number(dmy[1]);
//     const month = Number(dmy[2]);
//     const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
//     if (month < 1 || month > 12 || day < 1 || day > 31) return "";
//     return `${pad2(day)}/${pad2(month)}/${year}`;
//   }

//   // ISO "2026-09-01"
//   const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
//   if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;

//   // Epoch ms / seconds, including "1788220800000.0" and "1.7882208E12"
//   if (/^\d+(\.\d+)?(e\+?\d+)?$/i.test(raw)) {
//     const n = Number(raw);
//     let date: Date | null = null;
//     if (n > 1e11) date = new Date(n);
//     else if (n > 1e8) date = new Date(n * 1000);
//     if (!date || Number.isNaN(date.getTime())) return "";
//     return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
//   }

//   return ""; // unknown format: show nothing rather than a wrong date
// }

// // Returns the first value that isn't null/undefined/blank, as a string.
// function firstFilled(...values: CrmValue[]): string {
//   for (const v of values) {
//     if (v === null || v === undefined) continue;
//     const s = String(v).trim();
//     if (s !== "") return s;
//   }
//   return "";
// }

// // "Jane", "Smith" -> "Jane Smith"; skips blanks.
// function fullName(first: CrmValue, last: CrmValue): string {
//   return [first, last]
//     .map((v) => firstFilled(v))
//     .filter(Boolean)
//     .join(" ");
// }

// function formatCurrency(value: number | string | null | undefined): string {
//   const n = Number(value);
//   if (!Number.isFinite(n)) return "$0.00";
//   return n.toLocaleString("en-AU", {
//     style: "currency",
//     currency: "AUD",
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// // quote_master_data can reach us in a few shapes depending on how HubL
// // serialises it: a JSON string (normal), an already-parsed object, an
// // HTML-escaped string (&quot;…), or a double-encoded JSON string.
// function parseQuoteMasterData(raw: unknown): QuoteMasterData {
//   if (!raw) return {};
//   if (typeof raw === "object") return raw as QuoteMasterData;

//   const tryParse = (text: string): unknown => {
//     try {
//       let parsed: unknown = JSON.parse(text);
//       if (typeof parsed === "string") parsed = JSON.parse(parsed); // double-encoded
//       return parsed;
//     } catch {
//       return null;
//     }
//   };

//   const text = String(raw).trim();
//   let parsed = tryParse(text);
//   if (!parsed) {
//     const decoded = text
//       .replace(/&quot;|&#34;|&#x22;/g, '"')
//       .replace(/&#39;|&#x27;|&apos;/g, "'")
//       .replace(/&lt;/g, "<")
//       .replace(/&gt;/g, ">")
//       .replace(/&amp;/g, "&");
//     parsed = tryParse(decoded);
//   }
//   return typeof parsed === "object" && parsed !== null
//     ? (parsed as QuoteMasterData)
//     : {};
// }

// function cx(...classes: Array<string | false | null | undefined>): string {
//   return classes.filter(Boolean).join(" ");
// }

// // ---------------------------------------------------------------------------
// // Billing helpers
// // ---------------------------------------------------------------------------

// // Month labels in the style used on the printed agreement ("SEPT – NOV").
// const FLIGHT_MONTHS = [
//   "JAN",
//   "FEB",
//   "MAR",
//   "APR",
//   "MAY",
//   "JUNE",
//   "JULY",
//   "AUG",
//   "SEPT",
//   "OCT",
//   "NOV",
//   "DEC",
// ];
// const FULL_MONTHS = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

// function ordinalSuffix(day: number): string {
//   const mod100 = day % 100;
//   if (mod100 >= 11 && mod100 <= 13) return "th";
//   switch (day % 10) {
//     case 1:
//       return "st";
//     case 2:
//       return "nd";
//     case 3:
//       return "rd";
//     default:
//       return "th";
//   }
// }

// // Today's date in Queensland time, so a quote generated on a UTC server
// // late in the Australian evening still shows the Australian date.
// function todayInBrisbane(): { day: number; month: number; year: number } {
//   try {
//     const parts = new Intl.DateTimeFormat("en-AU", {
//       timeZone: "Australia/Brisbane",
//       day: "numeric",
//       month: "numeric",
//       year: "numeric",
//     }).formatToParts(new Date());
//     const get = (type: string) =>
//       Number(parts.find((p) => p.type === type)?.value);
//     const day = get("day");
//     const month = get("month");
//     const year = get("year");
//     if (day && month && year) return { day, month, year };
//   } catch {
//     // Intl timeZone not supported — fall through to local time.
//   }
//   const now = new Date();
//   return {
//     day: now.getDate(),
//     month: now.getMonth() + 1,
//     year: now.getFullYear(),
//   };
// }

// // "4000", "4,000.00", "$4,000.00", 4000 -> 4000; blank/unreadable -> null.
// function toAmount(value: CrmValue): number | null {
//   if (value === null || value === undefined) return null;
//   const s = String(value).replace(/[^0-9.-]/g, "");
//   if (s === "" || s === "-" || s === ".") return null;
//   const n = Number(s);
//   return Number.isFinite(n) ? n : null;
// }

// // ---------------------------------------------------------------------------
// // Default data
// // ---------------------------------------------------------------------------

// const DEFAULT_ADVERTISER: AdvertiserDetails = {
//   greetingName: "Nic",
//   companyName: "",
//   contactName: "",
//   phone: "",
//   email: "",
//   address: "",
// };
// const DEFAULT_ACCOUNT: AccountDetails = {
//   accountsName: "",
//   accountsProcess: "Please send to Nic for distribution and payment",
//   accountsEmail: "",
// };
// const DEFAULT_CAMPAIGN: CampaignBooking = {
//   campaignName: "",
//   referenceId: "AOS-",
//   siteSizeType: "NETWORK",
//   type: "",
//   weeksRequired: 0,
//   startDate: "",
//   endDate: "",
// };
// const DEFAULT_EXECUTION: Execution = {
//   advertiser: { representativeName: "", position: "Owner", date: "" },
//   aosco: {
//     representativeName: "Jesse McIntyre",
//     position: "Sales Director",
//     date: "",
//   },
// };

// // Transcribed verbatim, including the source document's own numbering.
// const DEFAULT_SPECIAL_CONDITIONS: string[] = [
//   "Unlimited Material Changes / Uploads Included.",
//   "CANCELLATION (COVID Consideration) - AOSco agrees to honour a 7-day cancellation deadline, effective up until Monday before campaign launch in writing.",
//   "Execution - I acknowledge that I have received and read this Agreement, confirm that the details contained within (including regarding payments due) are correct and hereby agree to be bound to this Agreement and the Terms and Conditions as attached.",
//   "AOSco will offer Bonus STA Sites to the same spec if we have the avails.",
//   "Bonus offered in this campaign is placed as 100% Guaranteed Bonus",
//   "AOSCO will allocate Photographer resources to capture Creative for Client Socials. Drone, Static, Video",
//   "Discount applied of 10% on Total for up for payment.",
// ];

// // ---------------------------------------------------------------------------
// // CSS — injected via <style>, since Tailwind isn't available in this runtime
// // ---------------------------------------------------------------------------

// const MODULE_CSS = `
// .aosco-root { max-width: 64rem; margin: 0 auto; background: #ffffff; color: #111827; font-family: Arial, sans-serif; }

// /* Cover page */
// .aosco-cover { position: relative; display: flex; min-height: 900px; flex-direction: column; justify-content: space-between; overflow: hidden; background: linear-gradient(to bottom, #171717, #171717, #000000); color: #ffffff; }
// .aosco-cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.5; }
// .aosco-cover-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.4), rgba(0,0,0,0.85)); }
// .aosco-cover-center { position: relative; z-index: 10; display: flex; flex: 1 1 auto; flex-direction: column; align-items: center; justify-content: center; padding: 0 2rem; text-align: center; }
// .aosco-cover-logo-img { height: 100%; width:100%; }
// .aosco-text-logo { font-size: 3.75rem; font-weight: 900; line-height: 1; letter-spacing: -0.02em; }
// .aosco-text-logo-sup { vertical-align: super; font-size: 1.5rem; }
// .aosco-tagline { margin-top: 0.75rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.35em; color: rgba(255,255,255,0.8); }
// .aosco-cover-footer { position: relative; z-index: 10; border-top: 1px solid rgba(255,255,255,0.25); padding: 2rem 2.5rem 4rem; text-align: center; }
// .aosco-cover-company { font-size: 1.125rem; font-weight: 600; margin: 0; }
// .aosco-divider { margin: 1.25rem auto; height: 1px; width: 10rem; background: rgba(255,255,255,0.4); }
// .aosco-cover-title { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.025em; margin: 0; }

// /* Header bar */
// .aosco-header-bar { display: flex; align-items: center; justify-content: space-between; background: #e5e7eb; padding: 1.25rem 2.5rem; }
// .aosco-header-title { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; color: #111827; margin: 0; }
// .aosco-header-logo-img { height: 2.5rem; }
// .aosco-header-text-logo { font-size: 1.125rem; font-weight: 900; color: #111827; }
// .aosco-header-text-logo-sup { vertical-align: super; font-size: 0.75rem; }

// /* Body */
// .aosco-body { padding: 2rem 2.5rem; font-size: 0.875rem; line-height: 1.5; }
// .aosco-greeting { margin: 0 0 1rem; }
// .aosco-intro { margin: 0 0 0.25rem; }
// .aosco-intro-last { margin: 0 0 2rem; }

// .aosco-section { margin-bottom: 2rem; }
// .aosco-section--exec { margin-bottom: 2.5rem; }
// .aosco-section-heading { font-weight: 700; margin: 0 0 0.5rem; }
// .aosco-section-heading--mt { margin-top: 1.5rem; }
// .aosco-section-heading--underline { text-decoration: underline; margin-bottom: 0.75rem; text-transform: uppercase; }

// /* Field rows (label + underlined fill-in value) */
// .aosco-field-row { display: flex; align-items: baseline; gap: 1.5rem; margin-bottom: 0.625rem; }
// .aosco-field-label { width: 16rem; flex-shrink: 0; color: #1f2937; }
// .aosco-field-value { flex: 1 1 auto; padding-bottom: 0.125rem; }
// .aosco-field-value--underline { border-bottom: 1px solid #9ca3af; }

// /* Special conditions */
// .aosco-sc-list { margin: 0; padding-left: 1.5rem; color: #111827; }
// .aosco-sc-list li { margin-bottom: 0.375rem; }

// /* Execution */
// .aosco-exec-intro { margin: 0 0 1.5rem; color: #1f2937; }
// .aosco-exec-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
// @media (min-width: 640px) {
//   .aosco-exec-grid { grid-template-columns: 1fr 1fr; }
// }
// .aosco-exec-col-title { margin: 0 0 0.75rem; }

// /* Schedule table */
// .aosco-table-scroll { width: 100%; overflow: hidden; }
// .aosco-schedule-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 6px; line-height: 1.15; }
// .aosco-cell { border: 1px solid #d1d5db; padding: 1px 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
// .aosco-cell--p1 { padding: 1px; }
// .aosco-cell--wrap { white-space: normal; word-break: break-word; overflow-wrap: break-word; }

// /* Billing table — single row, matching the printed agreement */
// .aosco-billing { margin-top: 1.5rem; }
// .aosco-billing-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 0.875rem; color: #000000; }
// .aosco-billing-cell { border: 1px solid #000000; padding: 1rem 0.75rem; text-align: center; vertical-align: middle; }
// .aosco-billing-head { padding-top: 1.5rem; padding-bottom: 1.5rem; font-weight: 400; }
// .aosco-billing-cell sup { font-size: 0.65em; line-height: 0; }

// /* Shared atomic utilities */
// .text-white { color: #ffffff; }
// .text-gray-900 { color: #111827; }
// .text-gray-800 { color: #1f2937; }
// .text-red-600 { color: #dc2626; }
// .font-semibold { font-weight: 600; }
// .font-bold { font-weight: 700; }
// .font-normal { font-weight: 400; }
// .italic { font-style: italic; }
// .text-center { text-align: center; }
// .text-left { text-align: left; }
// .text-right { text-align: right; }
// .bg-gray-100 { background: #f3f4f6; }
// .bg-gray-200 { background: #e5e7eb; }
// .bg-gray-300 { background: #d1d5db; }
// .bg-gray-500 { background: #6b7280; }
// .bg-blue-500 { background: #3b82f6; }
// .bg-blue-700 { background: #1d4ed8; }
// .bg-blue-900 { background: #1e3a8a; }
// .bg-sky-200 { background: #bae6fd; }
// .bg-sky-400 { background: #38bdf8; }
// .bg-green-300 { background: #86efac; }
// .bg-green-700 { background: #15803d; }
// .bg-yellow-300 { background: #fde047; }

// @media print {
//   @page {
//     size: A4 landscape;
//     margin: 6mm;
//   }
//   .aosco-schedule-table, .aosco-billing-table {
//     width: 100% !important;
//   }
// }
// `;

// // ---------------------------------------------------------------------------
// // Small presentational pieces
// // ---------------------------------------------------------------------------

// interface FieldLineProps {
//   label: string;
//   value?: string | number | null;
//   underline?: boolean;
// }

// function FieldLine({ label, value, underline = true }: FieldLineProps) {
//   return (
//     <div className="aosco-field-row">
//       <span className="aosco-field-label">{label}</span>
//       <span
//         className={cx(
//           "aosco-field-value",
//           underline && "aosco-field-value--underline",
//         )}
//       >
//         {value || "\u00A0"}
//       </span>
//     </div>
//   );
// }

// // ---------------------------------------------------------------------------
// // Billing table
// // ---------------------------------------------------------------------------

// interface BillingTableProps {
//   campaignStartDate?: CrmValue;
//   campaignEndDate?: CrmValue;
//   investment?: CrmValue; // ex GST, before commission
//   agencyCommission?: CrmValue; // optional — if empty, 10% of investment is used
//   gstAmount?: CrmValue;
//   totalInvestment?: CrmValue; // incl GST
// }

// function BillingTable({
//   campaignStartDate,
//   campaignEndDate,
//   investment,
//   agencyCommission,
//   gstAmount,
//   totalInvestment,
// }: BillingTableProps) {
//   // "AUG – OCT 2026", or "NOV 2026 – JAN 2027" when the campaign crosses a year.
//   const flightingWithYear = (() => {
//     const read = (v: CrmValue) => {
//       const m = formatHubspotDate(v).match(/^\d{2}\/(\d{2})\/(\d{4})$/);
//       return m ? { month: FLIGHT_MONTHS[Number(m[1]) - 1], year: m[2] } : null;
//     };
//     const s = read(campaignStartDate);
//     const e = read(campaignEndDate);
//     if (s && e) {
//       if (s.year !== e.year)
//         return `${s.month} ${s.year} \u2013 ${e.month} ${e.year}`;
//       if (s.month !== e.month) return `${s.month} \u2013 ${e.month} ${e.year}`;
//       return `${s.month} ${s.year}`;
//     }
//     const one = s || e;
//     return one ? `${one.month} ${one.year}` : "";
//   })();

//   const today = todayInBrisbane();

//   const investmentAmount = toAmount(investment);
//   const commission =
//     toAmount(agencyCommission) ??
//     (investmentAmount !== null
//       ? Math.round(investmentAmount * 0.1 * 100) / 100
//       : null);
//   const net =
//     investmentAmount !== null ? investmentAmount - (commission ?? 0) : null;
//   const gst = toAmount(gstAmount);
//   const total =
//     toAmount(totalInvestment) ??
//     (net !== null || gst !== null ? (net ?? 0) + (gst ?? 0) : null);

//   const money = (n: number | null) =>
//     n !== null ? formatCurrency(n) : "\u00A0";

//   return (
//     <div className="aosco-billing">
//       <table className="aosco-billing-table">
//         <colgroup>
//           <col style={{ width: "15%" }} />
//           <col style={{ width: "16%" }} />
//           <col style={{ width: "13%" }} />
//           <col style={{ width: "14%" }} />
//           <col style={{ width: "13%" }} />
//           <col style={{ width: "12%" }} />
//           <col style={{ width: "17%" }} />
//         </colgroup>
//         <thead>
//           <tr>
//             <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//               Flighting Dates
//             </th>
//             <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//               Billing Cycle 45
//               <br />
//               days EOM
//             </th>
//             <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//               Advertising
//               <br />
//               Investment
//             </th>
//             <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//               Agency
//               <br />
//               Commission
//               <br />
//               (10%)
//             </th>
//             <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//               Total
//               <br />
//               <span className="italic">
//                 (less
//                 <br />
//                 Agency
//                 <br />
//                 Comm
//               </span>
//               )
//             </th>
//             <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//               plus
//               <br />
//               GST 10%
//             </th>
//             <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//               Total Due to
//               <br />
//               AOSco
//               <br />
//               <span className="italic">incl</span> GST
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           <tr>
//             <td className="aosco-billing-cell">
//               {flightingWithYear || "\u00A0"}
//             </td>
//             <td className="aosco-billing-cell">
//               {today.day}
//               <sup>{ordinalSuffix(today.day)}</sup>{" "}
//               {FULL_MONTHS[today.month - 1].toUpperCase()} {today.year}
//             </td>
//             <td className="aosco-billing-cell">{money(investmentAmount)}</td>
//             <td className="aosco-billing-cell">{money(commission)}</td>
//             <td className="aosco-billing-cell">{money(net)}</td>
//             <td className="aosco-billing-cell">{money(gst)}</td>
//             <td className="aosco-billing-cell">{money(total)}</td>
//           </tr>
//           <tr>
//             <td colSpan={6} className={cx("aosco-billing-cell", "text-right")}>
//               Campaign Total
//             </td>
//             <td className="aosco-billing-cell" style={{ fontSize: "1.05rem" }}>
//               {money(total)}
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // ---------------------------------------------------------------------------
// // Component — HubSpot quote module entry point
// // ---------------------------------------------------------------------------

// export function Component({ hublData }: Props) {
//   const h: HublData = hublData || ({} as HublData);

//   const data = parseQuoteMasterData(h.scheduleSummaryJson);

//   const documentTitle = data.documentTitle || "ADVERTISING AGREEMENT";
//   const companyLegalName =
//     data.companyLegalName || "Australian Outdoor Sign Company Pty Ltd";
//   const coverSrc =
//     "https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/Quote%20Cover.png";
//   const logoSrc =
//     "https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/logo.png";
//   const coverImageSrc = data.coverImageSrc;

//   // -------------------------------------------------------------------------
//   // DEAL → form field mapping
//   // Priority everywhere: deal property → quote_master_data JSON → default.
//   // Advertiser and Accounts are the same person; Agency is a different one.
//   // -------------------------------------------------------------------------
//   const advertiserFullName = fullName(
//     h.advertiserFirstName,
//     h.advertiserLastName,
//   );
//   const agencyFullName = fullName(h.agencyFirstName, h.agencyLastName);

//   // Advertiser Details
//   const adv: AdvertiserDetails = {
//     greetingName: firstFilled(
//       h.advertiserFirstName,
//       data.advertiser?.greetingName,
//       DEFAULT_ADVERTISER.greetingName,
//     ),
//     companyName: firstFilled(h.advertiserCompany, data.advertiser?.companyName),
//     contactName: firstFilled(advertiserFullName, data.advertiser?.contactName),
//     phone: firstFilled(h.advertiserPhone, data.advertiser?.phone),
//     email: firstFilled(h.advertiserEmail, data.advertiser?.email),
//     address: firstFilled(data.advertiser?.address),
//   };

//   // Account Details — same person as the advertiser
//   const acc: AccountDetails = {
//     accountsName: firstFilled(adv.contactName, data.account?.accountsName),
//     accountsProcess: firstFilled(
//       data.account?.accountsProcess,
//       adv.greetingName
//         ? `Please send to ${adv.greetingName} for distribution and payment`
//         : "",
//       DEFAULT_ACCOUNT.accountsProcess,
//     ),
//     accountsEmail: firstFilled(adv.email, data.account?.accountsEmail),
//   };

//   // Agency Details — separate person
//   const agency: AgencyDetails = {
//     agencyName: firstFilled(h.agencyCompanyName, data.agency?.agencyName),
//     addressLine1: firstFilled(h.agencyAddress, data.agency?.addressLine1),
//     addressLine2: firstFilled(h.agencyAddressLine2, data.agency?.addressLine2),
//     contactName: firstFilled(agencyFullName, data.agency?.contactName),
//     phone: firstFilled(h.agencyPhone), // no agency phone property on the deal yet
//     email: firstFilled(h.agencyEmail, data.agency?.email),
//   };

//   // Campaign Booking
//   const camp: CampaignBooking = {
//     campaignName: firstFilled(h.dealName, data.campaign?.campaignName),
//     referenceId: firstFilled(
//       data.campaign?.referenceId,
//       h.dealId ? `AOS-${firstFilled(h.dealId)}` : "",
//       DEFAULT_CAMPAIGN.referenceId,
//     ),
//     siteSizeType: firstFilled(
//       data.campaign?.siteSizeType,
//       DEFAULT_CAMPAIGN.siteSizeType,
//     ),
//     type: firstFilled(data.campaign?.type),
//     weeksRequired: 0,
//     startDate: formatHubspotDate(h.campaignStartDate),
//     endDate: formatHubspotDate(h.campaignEndDate),
//   };

//   const exec: Execution = {
//     advertiser: {
//       ...DEFAULT_EXECUTION.advertiser,
//       ...(data.execution?.advertiser || {}),
//       representativeName: firstFilled(
//         data.execution?.advertiser?.representativeName,
//         adv.contactName,
//       ),
//     },
//     aosco: { ...DEFAULT_EXECUTION.aosco, ...(data.execution?.aosco || {}) },
//   };

//   const specialConditions =
//     data.specialConditions ?? DEFAULT_SPECIAL_CONDITIONS;

//   return (
//     <div className="aosco-root">
//       <style>{MODULE_CSS}</style>

//       {/* Cover page */}
//       <section className="aosco-cover">
//         {coverImageSrc && (
//           <img src={coverImageSrc} alt="" className="aosco-cover-img" />
//         )}
//         <div className="aosco-cover-overlay" />

//         <div className="aosco-cover-center">
//           {coverSrc ? (
//             <img
//               src={coverSrc}
//               alt={companyLegalName}
//               className="aosco-cover-logo-img"
//             />
//           ) : (
//             <div>
//               <div className="aosco-text-logo">
//                 AOS<span className="aosco-text-logo-sup">Co.</span>
//               </div>
//               <p className="aosco-tagline">Australian Outdoor Sign Company</p>
//             </div>
//           )}
//         </div>
//       </section>

//       {/* Content page header bar */}
//       <div className="aosco-header-bar">
//         <h1 className="aosco-header-title">{documentTitle}</h1>
//         {logoSrc ? (
//           <img
//             src={logoSrc}
//             alt={companyLegalName}
//             className="aosco-header-logo-img"
//           />
//         ) : (
//           <span className="aosco-header-text-logo">
//             AOS<span className="aosco-header-text-logo-sup">Co.</span>
//           </span>
//         )}
//       </div>

//       <div className="aosco-body">
//         <p className="aosco-greeting">Dear {adv.greetingName || "\u00A0"},</p>
//         <p className="aosco-intro">
//           Thank you for the opportunity to provide our services to you.
//         </p>
//         <p className="aosco-intro-last">
//           This document and the <strong>attached</strong> Terms and Conditions
//           set out the basis on which AOSCO provide our services.
//         </p>

//         {/* Advertiser + Account + Agency Details */}
//         <section className="aosco-section">
//           <p className="aosco-section-heading">Advertiser Details</p>
//           <FieldLine label="COMPANY NAME:" value={adv.companyName} />
//           <FieldLine label="Contact Name:" value={adv.contactName} />
//           <FieldLine label="Phone Number:" value={adv.phone} />
//           <FieldLine label="Email Address:" value={adv.email} />

//           <p
//             className={cx("aosco-section-heading", "aosco-section-heading--mt")}
//           >
//             Account Details
//           </p>
//           <FieldLine label="Accounts Name:" value={acc.accountsName} />
//           <FieldLine
//             label="Accounts Process:"
//             value={acc.accountsProcess}
//             underline={false}
//           />
//           <FieldLine label="Accounts Email 1:" value={acc.accountsEmail} />

//           <p
//             className={cx("aosco-section-heading", "aosco-section-heading--mt")}
//           >
//             Agency Details
//           </p>
//           <FieldLine label="Agency Name:" value={agency.agencyName} />
//           <FieldLine label="Address:" value={agency.addressLine1} />
//           <FieldLine label={"\u00A0"} value={agency.addressLine2} />
//           <FieldLine label="Contact Name:" value={agency.contactName} />
//           <FieldLine label="Phone Number:" value={agency.phone} />
//           <FieldLine label="Email Address:" value={agency.email} />
//         </section>

//         {/* Campaign Booking */}
//         <section className="aosco-section">
//           <p className="aosco-section-heading">Campaign Booking</p>
//           <FieldLine label="Campaign Name:" value={camp.campaignName} />
//           <FieldLine label="Reference ID:" value={camp.referenceId} />
//           <FieldLine
//             label="Site, Size & Type of Selected Billboards:"
//             value={camp.siteSizeType}
//           />
//           <FieldLine label="Type:" value={camp.type} />
//           <FieldLine label="Weeks Required:" value={camp.weeksRequired} />
//           <FieldLine label="Start Date:" value={camp.startDate} />
//           <FieldLine label="End Date:" value={camp.endDate} />
//         </section>

//         {/* Schedule + Billing */}
//         <section className="aosco-section">
//           <p className="aosco-section-heading aosco-section-heading--underline">
//             Schedule:
//           </p>

//           <p>
//             Schedule Below runs for 6 weeks as planned below across the AOSCO
//             Network{" "}
//           </p>

//           <br />
//           <p className="aosco-section-heading aosco-section-heading--underline">
//             Billing:
//           </p>
//           <p className="aosco-section-heading">
//             AOSCO is offering a 10% Discount for Upfront Billing from $10,000
//             Investment
//           </p>

//           <BillingTable
//             campaignStartDate={h.campaignStartDate}
//             campaignEndDate={h.campaignEndDate}
//             investment={h.investment}
//             gstAmount={h.gstAmount}
//             totalInvestment={h.totalInvestment}
//           />
//         </section>

//         {/* Special Conditions */}
//         <section className="aosco-section">
//           <p className="aosco-section-heading aosco-section-heading--underline">
//             Special conditions:
//           </p>
//           <ol className="aosco-sc-list" style={{ listStyleType: "decimal" }}>
//             {specialConditions.map((c, i) => (
//               <li key={i}>{c}</li>
//             ))}
//           </ol>
//         </section>

//         {/* Execution / signatures */}
//         <section className="aosco-section aosco-section--exec">
//           <p className="aosco-section-heading">Execution</p>
//           <p className="aosco-exec-intro">
//             I acknowledge that I have received and read this Agreement, confirm
//             that the details contained within (including regarding payments due)
//             are correct and hereby agree to be bound to this Agreement and the
//             Terms and Conditions as <strong>attached.</strong>
//           </p>
//           <div className="aosco-exec-grid">
//             <div>
//               <p className="aosco-exec-col-title">
//                 Executed on behalf of {adv.companyName || "\u00A0"} by
//               </p>
//               <FieldLine
//                 label="Representative Name:"
//                 value={exec.advertiser.representativeName}
//               />
//               <FieldLine label="Position:" value={exec.advertiser.position} />
//               <FieldLine label="Date:" value={exec.advertiser.date} />
//             </div>
//             <div>
//               <p className="aosco-exec-col-title">
//                 Executed on behalf of {companyLegalName}
//               </p>
//               <FieldLine
//                 label="Representative Name:"
//                 value={exec.aosco.representativeName}
//               />
//               <FieldLine label="Position:" value={exec.aosco.position} />
//               <FieldLine label="Date:" value={exec.aosco.date} />
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }

// export const meta = {
//   label: "AOSco Quote Agency",
//   content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
// };

// // Single source of truth: every value is read from the DEAL record.
// // The billing contact / billing company attached to the quote are ignored.
// // The deal lookup is guarded because a quote blueprint preview may not
// // have a deal attached.
// export const hublDataTemplate = `
//   {% set dealData = {} %}
//   {% if quoteTemplateContext.deal and quoteTemplateContext.deal.hs_object_id %}
//     {% set dealData = crm_object("deal", quoteTemplateContext.deal.hs_object_id, "hs_object_id,dealname,quote_master_data,campaign_start_date,campaign_end_date,total_commercial_rate,gst_amount,total_investment,advertiser_company,advertiser_contact_first_name,advertiser_contact_last_name,advertiser_person_phone_number,advertiser_person_email_address,agency_company_name,agency_person_first_name,agency_person_last_name,agency_person_email,agency_company_address,agency_address_line_2,agency_person_phone") %}
//   {% endif %}

//   {% set hublData = {
//     "isQuoteBlueprint": isQuoteBlueprint,
//     "dealId": dealData.hs_object_id,
//     "dealName": dealData.dealname,
//     "campaignStartDate": dealData.campaign_start_date,
//     "campaignEndDate": dealData.campaign_end_date,
//     "totalInvestment": dealData.total_investment,
//     "investment": dealData.total_commercial_rate,
//     "gstAmount": dealData.gst_amount,
//     "scheduleSummaryJson": dealData.quote_master_data,

//     "advertiserCompany": dealData.advertiser_company,
//     "advertiserFirstName": dealData.advertiser_contact_first_name,
//     "advertiserLastName": dealData.advertiser_contact_last_name,
//     "advertiserPhone": dealData.advertiser_person_phone_number,
//     "advertiserEmail": dealData.advertiser_person_email_address,

//     "agencyCompanyName": dealData.agency_company_name,
//     "agencyFirstName": dealData.agency_person_first_name,
//     "agencyLastName": dealData.agency_person_last_name,
//     "agencyEmail": dealData.agency_person_email,
//     "agencyPhone": dealData.agency_person_phone,
//     "agencyAddress": dealData.agency_company_address,
//     "agencyAddressLine2": dealData.agency_address_line_2
//   } %}
// `;

// import React from "react";

// import { fields } from "./fields";

// export { fields };

// export interface AdvertiserDetails {
//   greetingName: string;
//   companyName: string;
//   contactName: string;
//   phone: string;
//   email: string;
//   address: string;
// }

// export interface AccountDetails {
//   accountsName: string;
//   accountsProcess: string;
//   accountsEmail: string;
// }

// export interface AgencyDetails {
//   agencyName: string;
//   addressLine1: string;
//   addressLine2: string;
//   contactName: string;
//   phone: string;
//   email: string;
// }

// export interface CampaignBooking {
//   campaignName: string;
//   referenceId: string;
//   siteSizeType: string;
//   type: string;
//   weeksRequired: number;
//   startDate: string;
//   endDate: string;
// }

// export interface ScheduleMeta {
//   locality: string;
//   cashContraLabel: string;
//   weekCommencingLabel: string;
//   bonusPlacementLabel: string;
//   reachInfoLabel: string;
//   broadcastInfoLabel: string;
//   bonusNote: string;
// }

// export interface BillingRow {
//   flighting: string;
//   billingDate: string;
//   investment: number;
//   gst: number;
//   total: number;
// }

// export interface Billing {
//   attAccounts: string;
//   invoice1: string;
//   invoice2: string;
//   rows: BillingRow[];
// }

// export interface ExecutionParty {
//   representativeName: string;
//   position: string;
//   date: string;
// }

// export interface Execution {
//   advertiser: ExecutionParty;
//   aosco: ExecutionParty;
// }

// // The parsed shape of the quote_master_data JSON property.
// export interface QuoteMasterData {
//   logoSrc?: string;
//   coverImageSrc?: string;
//   documentTitle?: string;
//   companyLegalName?: string;
//   advertiser?: Partial<AdvertiserDetails>;
//   account?: Partial<AccountDetails>;
//   agency?: Partial<AgencyDetails>;
//   campaign?: Partial<CampaignBooking>;
//   weekDates?: string[];
//   scheduleMeta?: Partial<ScheduleMeta>;
//   billing?: Partial<Billing>;
//   specialConditions?: string[];
//   execution?: {
//     advertiser?: Partial<ExecutionParty>;
//     aosco?: Partial<ExecutionParty>;
//   };
// }

// // The parsed shape of the agency_quote_master_data JSON property
// // (built by the NestJS line-item sync). Short keys keep the JSON small.
// export interface AgencyQuoteMonth {
//   k: string; // month "YYYY-MM"
//   w: number; // weeks booked (all schedules)
//   r: number; // client total  -> "Total (less Agency Comm)"
//   a: number; // agency commission
// }

// export interface AgencyQuoteSchedule {
//   n: string | null; // name
//   r: number; // client_rate_per_week
//   a: number; // agency_discount_amount per week
//   w: Record<string, number>; // weeks per month
//   d?: string[]; // week-start dates "YYYY-MM-DD"
// }

// export interface AgencyQuoteMasterData {
//   v?: number;
//   m?: AgencyQuoteMonth[];
//   s?: AgencyQuoteSchedule[];
// }

// // ---------------------------------------------------------------------------
// // HubSpot module types
// // ---------------------------------------------------------------------------

// type CrmValue = string | number | null | undefined;

// // Must match the keys built in hublDataTemplate at the bottom of this file.
// // Everything comes from the DEAL record only (single source of truth) —
// // the billing contact / billing company on the quote are not read.
// interface HublData {
//   isQuoteBlueprint: boolean;

//   // Deal
//   dealId?: CrmValue;
//   dealName?: CrmValue;
//   campaignStartDate?: CrmValue; // HubSpot date property (epoch ms or YYYY-MM-DD)
//   campaignEndDate?: CrmValue;
//   scheduleSummaryJson?: unknown; // quote_master_data — usually a JSON string, parsed client-side below
//   agencyQuoteJson?: unknown; // agency_quote_master_data — month-wise billing, parsed client-side below

//   // Deal — agency commission rate shown in the billing table header
//   agencyDiscount?: CrmValue; // agency_discount (0.1 or 10 both mean 10%)

//   // Deal — billing amounts (fallback when agency_quote_master_data is empty)
//   investment?: CrmValue; // total_commercial_rate (ex GST)
//   gstAmount?: CrmValue; // gst_amount
//   totalInvestment?: CrmValue; // total_investment (incl GST)

//   // Deal — advertiser (also used for Account Details: same person)
//   advertiserCompany?: CrmValue; // advertiser_company
//   advertiserFirstName?: CrmValue; // advertiser_contact_first_name
//   advertiserLastName?: CrmValue; // advertiser_contact_last_name
//   advertiserPhone?: CrmValue; // advertiser_person_phone_number
//   advertiserEmail?: CrmValue; // advertiser_person_email_address

//   // Deal — agency (a different person)
//   agencyCompanyName?: CrmValue; // agency_company_name
//   agencyFirstName?: CrmValue; // agency_person_first_name
//   agencyLastName?: CrmValue; // agency_person_last_name
//   agencyEmail?: CrmValue; // agency_person_email
//   agencyPhone?: CrmValue; // agency_person_phone
//   agencyAddress?: CrmValue; // agency_company_address
//   agencyAddressLine2?: CrmValue; // agency_address_line_2
// }

// interface Props {
//   fieldValues: FieldValues;
//   hublData: HublData;
// }

// interface FieldValues {}

// // ---------------------------------------------------------------------------
// // Helpers
// // ---------------------------------------------------------------------------

// function pad2(n: number): string {
//   return String(n).padStart(2, "0");
// }

// // Formats a HubSpot deal date property (campaign_start_date etc.) as
// // dd/mm/yyyy. HubSpot sends these as Australian day-first dates with a
// // two- or four-digit year: "1/9/26", "01/09/26", "01/09/2026" -> "01/09/2026".
// // Two-digit years are read as 20xx. Also accepts epoch timestamps and
// // ISO "2026-09-01" in case the property format ever changes.
// function formatHubspotDate(value: CrmValue): string {
//   if (value === null || value === undefined) return "";
//   const raw = String(value).trim();
//   if (!raw) return "";

//   // d/m/yy, dd/mm/yy, d/m/yyyy, dd/mm/yyyy (optionally followed by a time)
//   const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})(?!\d)/);
//   if (dmy) {
//     const day = Number(dmy[1]);
//     const month = Number(dmy[2]);
//     const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
//     if (month < 1 || month > 12 || day < 1 || day > 31) return "";
//     return `${pad2(day)}/${pad2(month)}/${year}`;
//   }

//   // ISO "2026-09-01"
//   const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
//   if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;

//   // Epoch ms / seconds, including "1788220800000.0" and "1.7882208E12"
//   if (/^\d+(\.\d+)?(e\+?\d+)?$/i.test(raw)) {
//     const n = Number(raw);
//     let date: Date | null = null;
//     if (n > 1e11) date = new Date(n);
//     else if (n > 1e8) date = new Date(n * 1000);
//     if (!date || Number.isNaN(date.getTime())) return "";
//     return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
//   }

//   return ""; // unknown format: show nothing rather than a wrong date
// }

// // Returns the first value that isn't null/undefined/blank, as a string.
// function firstFilled(...values: CrmValue[]): string {
//   for (const v of values) {
//     if (v === null || v === undefined) continue;
//     const s = String(v).trim();
//     if (s !== "") return s;
//   }
//   return "";
// }

// // "Jane", "Smith" -> "Jane Smith"; skips blanks.
// function fullName(first: CrmValue, last: CrmValue): string {
//   return [first, last]
//     .map((v) => firstFilled(v))
//     .filter(Boolean)
//     .join(" ");
// }

// function formatCurrency(value: number | string | null | undefined): string {
//   const n = Number(value);
//   if (!Number.isFinite(n)) return "$0.00";
//   return n.toLocaleString("en-AU", {
//     style: "currency",
//     currency: "AUD",
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// }

// // JSON deal properties can reach us in a few shapes depending on how HubL
// // serialises them: a JSON string (normal), an already-parsed object, an
// // HTML-escaped string (&quot;…), or a double-encoded JSON string.
// function parseJsonProperty<T extends object>(raw: unknown): Partial<T> {
//   if (!raw) return {};
//   if (typeof raw === "object") return raw as Partial<T>;

//   const tryParse = (text: string): unknown => {
//     try {
//       let parsed: unknown = JSON.parse(text);
//       if (typeof parsed === "string") parsed = JSON.parse(parsed); // double-encoded
//       return parsed;
//     } catch {
//       return null;
//     }
//   };

//   const text = String(raw).trim();
//   let parsed = tryParse(text);
//   if (!parsed) {
//     const decoded = text
//       .replace(/&quot;|&#34;|&#x22;/g, '"')
//       .replace(/&#39;|&#x27;|&apos;/g, "'")
//       .replace(/&lt;/g, "<")
//       .replace(/&gt;/g, ">")
//       .replace(/&amp;/g, "&");
//     parsed = tryParse(decoded);
//   }
//   return typeof parsed === "object" && parsed !== null
//     ? (parsed as Partial<T>)
//     : {};
// }

// function parseQuoteMasterData(raw: unknown): QuoteMasterData {
//   return parseJsonProperty<QuoteMasterData>(raw) as QuoteMasterData;
// }

// function parseAgencyQuoteMasterData(raw: unknown): AgencyQuoteMasterData {
//   return parseJsonProperty<AgencyQuoteMasterData>(raw) as AgencyQuoteMasterData;
// }

// function cx(...classes: Array<string | false | null | undefined>): string {
//   return classes.filter(Boolean).join(" ");
// }

// // ---------------------------------------------------------------------------
// // Billing helpers
// // ---------------------------------------------------------------------------

// // Month labels in the style used on the printed agreement ("SEPT – NOV").
// const FLIGHT_MONTHS = [
//   "JAN",
//   "FEB",
//   "MAR",
//   "APR",
//   "MAY",
//   "JUNE",
//   "JULY",
//   "AUG",
//   "SEPT",
//   "OCT",
//   "NOV",
//   "DEC",
// ];
// const FULL_MONTHS = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

// const GST_RATE = 0.1;
// const DEFAULT_COMMISSION_RATE = 0.1; // only used when deal.agency_discount is empty

// function ordinalSuffix(day: number): string {
//   const mod100 = day % 100;
//   if (mod100 >= 11 && mod100 <= 13) return "th";
//   switch (day % 10) {
//     case 1:
//       return "st";
//     case 2:
//       return "nd";
//     case 3:
//       return "rd";
//     default:
//       return "th";
//   }
// }

// // Today's date in Queensland time, so a quote generated on a UTC server
// // late in the Australian evening still shows the Australian date.
// function todayInBrisbane(): { day: number; month: number; year: number } {
//   try {
//     const parts = new Intl.DateTimeFormat("en-AU", {
//       timeZone: "Australia/Brisbane",
//       day: "numeric",
//       month: "numeric",
//       year: "numeric",
//     }).formatToParts(new Date());
//     const get = (type: string) =>
//       Number(parts.find((p) => p.type === type)?.value);
//     const day = get("day");
//     const month = get("month");
//     const year = get("year");
//     if (day && month && year) return { day, month, year };
//   } catch {
//     // Intl timeZone not supported — fall through to local time.
//   }
//   const now = new Date();
//   return {
//     day: now.getDate(),
//     month: now.getMonth() + 1,
//     year: now.getFullYear(),
//   };
// }

// // "4000", "4,000.00", "$4,000.00", 4000 -> 4000; blank/unreadable -> null.
// function toAmount(value: CrmValue): number | null {
//   if (value === null || value === undefined) return null;
//   const s = String(value).replace(/[^0-9.-]/g, "");
//   if (s === "" || s === "-" || s === ".") return null;
//   const n = Number(s);
//   return Number.isFinite(n) ? n : null;
// }

// // Rounds to cents, avoiding float drift (1.005 -> 1.01).
// function round2(n: number): number {
//   return Math.round((n + Number.EPSILON) * 100) / 100;
// }

// // 0.1111 -> "11.1%", 0.1 -> "10%".
// function formatRate(rate: number): string {
//   return `${Number((rate * 100).toFixed(2))}%`;
// }

// // deal.agency_discount as a fraction: "0.1", "10", "10%" -> 0.1.
// // Values above 1 are read as a percentage. Blank/unreadable -> null.
// function toRate(value: CrmValue): number | null {
//   const n = toAmount(value);
//   if (n === null || n < 0) return null;
//   return n > 1 ? n / 100 : n;
// }

// interface AgencyBillingRow {
//   key: string; // "2026-09"
//   flighting: string; // "SEPT 2026"
//   billingDay: number; // last day of the month (EOM)
//   billingMonth: number; // 1-12
//   billingYear: number;
//   investment: number; // r + a
//   commission: number; // a
//   net: number; // r
//   gst: number; // 10% of net (Total less Agency Comm)
//   total: number; // net + GST
// }

// // One billing row per month in agency_quote_master_data.m, oldest first.
// // Months that can't be read are left out.
// function toAgencyBillingRows(data: AgencyQuoteMasterData): AgencyBillingRow[] {
//   const months = Array.isArray(data.m) ? data.m : [];

//   return months
//     .map((m): AgencyBillingRow | null => {
//       const match = /^(\d{4})-(\d{2})$/.exec(String(m?.k ?? ""));
//       if (!match) return null;

//       const year = Number(match[1]);
//       const month = Number(match[2]);
//       if (month < 1 || month > 12) return null;

//       const net = round2(Number(m.r) || 0);
//       const commission = round2(Number(m.a) || 0);
//       const investment = round2(net + commission);
//       const gst = round2(net * GST_RATE); // GST is on the amount after agency commission
//       const total = round2(net + gst);

//       return {
//         key: match[0],
//         flighting: `${FLIGHT_MONTHS[month - 1]} ${year}`,
//         billingDay: new Date(Date.UTC(year, month, 0)).getUTCDate(), // day 0 of next month = EOM
//         billingMonth: month,
//         billingYear: year,
//         investment,
//         commission,
//         net,
//         gst,
//         total,
//       };
//     })
//     .filter((row): row is AgencyBillingRow => row !== null)
//     .sort((x, y) => x.key.localeCompare(y.key));
// }

// // ---------------------------------------------------------------------------
// // Default data
// // ---------------------------------------------------------------------------

// const DEFAULT_ADVERTISER: AdvertiserDetails = {
//   greetingName: "Nic",
//   companyName: "",
//   contactName: "",
//   phone: "",
//   email: "",
//   address: "",
// };
// const DEFAULT_ACCOUNT: AccountDetails = {
//   accountsName: "",
//   accountsProcess: "Please send to Nic for distribution and payment",
//   accountsEmail: "",
// };
// const DEFAULT_CAMPAIGN: CampaignBooking = {
//   campaignName: "",
//   referenceId: "AOS-",
//   siteSizeType: "NETWORK",
//   type: "",
//   weeksRequired: 0,
//   startDate: "",
//   endDate: "",
// };
// const DEFAULT_EXECUTION: Execution = {
//   advertiser: { representativeName: "", position: "Owner", date: "" },
//   aosco: {
//     representativeName: "Jesse McIntyre",
//     position: "Sales Director",
//     date: "",
//   },
// };

// // Transcribed verbatim, including the source document's own numbering.
// const DEFAULT_SPECIAL_CONDITIONS: string[] = [
//   "Unlimited Material Changes / Uploads Included.",
//   "CANCELLATION (COVID Consideration) - AOSco agrees to honour a 7-day cancellation deadline, effective up until Monday before campaign launch in writing.",
//   "Execution - I acknowledge that I have received and read this Agreement, confirm that the details contained within (including regarding payments due) are correct and hereby agree to be bound to this Agreement and the Terms and Conditions as attached.",
//   "AOSco will offer Bonus STA Sites to the same spec if we have the avails.",
//   "Bonus offered in this campaign is placed as 100% Guaranteed Bonus",
//   "AOSCO will allocate Photographer resources to capture Creative for Client Socials. Drone, Static, Video",
//   "Discount applied of 10% on Total for up for payment.",
// ];

// // ---------------------------------------------------------------------------
// // CSS — injected via <style>, since Tailwind isn't available in this runtime
// // ---------------------------------------------------------------------------

// const MODULE_CSS = `
// .aosco-root { max-width: 64rem; margin: 0 auto; background: #ffffff; color: #111827; font-family: Arial, sans-serif; }

// /* Cover page */
// .aosco-cover { position: relative; display: flex; min-height: 900px; flex-direction: column; justify-content: space-between; overflow: hidden; background: linear-gradient(to bottom, #171717, #171717, #000000); color: #ffffff; }
// .aosco-cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.5; }
// .aosco-cover-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.4), rgba(0,0,0,0.85)); }
// .aosco-cover-center { position: relative; z-index: 10; display: flex; flex: 1 1 auto; flex-direction: column; align-items: center; justify-content: center; padding: 0 2rem; text-align: center; }
// .aosco-cover-logo-img { height: 100%; width:100%; }
// .aosco-text-logo { font-size: 3.75rem; font-weight: 900; line-height: 1; letter-spacing: -0.02em; }
// .aosco-text-logo-sup { vertical-align: super; font-size: 1.5rem; }
// .aosco-tagline { margin-top: 0.75rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.35em; color: rgba(255,255,255,0.8); }
// .aosco-cover-footer { position: relative; z-index: 10; border-top: 1px solid rgba(255,255,255,0.25); padding: 2rem 2.5rem 4rem; text-align: center; }
// .aosco-cover-company { font-size: 1.125rem; font-weight: 600; margin: 0; }
// .aosco-divider { margin: 1.25rem auto; height: 1px; width: 10rem; background: rgba(255,255,255,0.4); }
// .aosco-cover-title { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.025em; margin: 0; }

// /* Header bar */
// .aosco-header-bar { display: flex; align-items: center; justify-content: space-between; background: #e5e7eb; padding: 1.25rem 2.5rem; }
// .aosco-header-title { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; color: #111827; margin: 0; }
// .aosco-header-logo-img { height: 2.5rem; }
// .aosco-header-text-logo { font-size: 1.125rem; font-weight: 900; color: #111827; }
// .aosco-header-text-logo-sup { vertical-align: super; font-size: 0.75rem; }

// /* Body */
// .aosco-body { padding: 2rem 2.5rem; font-size: 0.875rem; line-height: 1.5; }
// .aosco-greeting { margin: 0 0 1rem; }
// .aosco-intro { margin: 0 0 0.25rem; }
// .aosco-intro-last { margin: 0 0 2rem; }

// .aosco-section { margin-bottom: 2rem; }
// .aosco-section--exec { margin-bottom: 2.5rem; }
// .aosco-section-heading { font-weight: 700; margin: 0 0 0.5rem; }
// .aosco-section-heading--mt { margin-top: 1.5rem; }
// .aosco-section-heading--underline { text-decoration: underline; margin-bottom: 0.75rem; text-transform: uppercase; }

// /* Field rows (label + underlined fill-in value) */
// .aosco-field-row { display: flex; align-items: baseline; gap: 1.5rem; margin-bottom: 0.625rem; }
// .aosco-field-label { width: 16rem; flex-shrink: 0; color: #1f2937; }
// .aosco-field-value { flex: 1 1 auto; padding-bottom: 0.125rem; }
// .aosco-field-value--underline { border-bottom: 1px solid #9ca3af; }

// /* Special conditions */
// .aosco-sc-list { margin: 0; padding-left: 1.5rem; color: #111827; }
// .aosco-sc-list li { margin-bottom: 0.375rem; }

// /* Execution */
// .aosco-exec-intro { margin: 0 0 1.5rem; color: #1f2937; }
// .aosco-exec-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
// @media (min-width: 640px) {
//   .aosco-exec-grid { grid-template-columns: 1fr 1fr; }
// }
// .aosco-exec-col-title { margin: 0 0 0.75rem; }

// /* Schedule table */
// .aosco-table-scroll { width: 100%; overflow: hidden; }
// .aosco-schedule-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 6px; line-height: 1.15; }
// .aosco-cell { border: 1px solid #d1d5db; padding: 1px 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
// .aosco-cell--p1 { padding: 1px; }
// .aosco-cell--wrap { white-space: normal; word-break: break-word; overflow-wrap: break-word; }

// /* Billing table — one row per month, matching the printed agreement */
// .aosco-billing { margin-top: 1.5rem; }
// .aosco-billing-table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 0.875rem; color: #000000; }
// .aosco-billing-cell { border: 1px solid #000000; padding: 1rem 0.75rem; text-align: center; vertical-align: middle; }
// .aosco-billing-head { padding-top: 1.5rem; padding-bottom: 1.5rem; font-weight: 400; }
// .aosco-billing-cell sup { font-size: 0.65em; line-height: 0; }
// .aosco-billing-total td { font-weight: 700; }
// .aosco-billing-grand { font-size: 1.05rem; }

// /* Shared atomic utilities */
// .text-white { color: #ffffff; }
// .text-gray-900 { color: #111827; }
// .text-gray-800 { color: #1f2937; }
// .text-red-600 { color: #dc2626; }
// .font-semibold { font-weight: 600; }
// .font-bold { font-weight: 700; }
// .font-normal { font-weight: 400; }
// .italic { font-style: italic; }
// .text-center { text-align: center; }
// .text-left { text-align: left; }
// .text-right { text-align: right; }
// .bg-gray-100 { background: #f3f4f6; }
// .bg-gray-200 { background: #e5e7eb; }
// .bg-gray-300 { background: #d1d5db; }
// .bg-gray-500 { background: #6b7280; }
// .bg-blue-500 { background: #3b82f6; }
// .bg-blue-700 { background: #1d4ed8; }
// .bg-blue-900 { background: #1e3a8a; }
// .bg-sky-200 { background: #bae6fd; }
// .bg-sky-400 { background: #38bdf8; }
// .bg-green-300 { background: #86efac; }
// .bg-green-700 { background: #15803d; }
// .bg-yellow-300 { background: #fde047; }

// @media print {
//   @page {
//     size: A4 landscape;
//     margin: 6mm;
//   }
//   .aosco-schedule-table, .aosco-billing-table {
//     width: 100% !important;
//   }
//   .aosco-billing-table tr { page-break-inside: avoid; }
// }
// `;

// // ---------------------------------------------------------------------------
// // Small presentational pieces
// // ---------------------------------------------------------------------------

// interface FieldLineProps {
//   label: string;
//   value?: string | number | null;
//   underline?: boolean;
// }

// function FieldLine({ label, value, underline = true }: FieldLineProps) {
//   return (
//     <div className="aosco-field-row">
//       <span className="aosco-field-label">{label}</span>
//       <span
//         className={cx(
//           "aosco-field-value",
//           underline && "aosco-field-value--underline",
//         )}
//       >
//         {value || "\u00A0"}
//       </span>
//     </div>
//   );
// }

// // ---------------------------------------------------------------------------
// // Billing table
// // ---------------------------------------------------------------------------

// const money = (n: number | null) => (n !== null ? formatCurrency(n) : "\u00A0");

// // "30th SEPTEMBER 2026"
// function BillingDate({
//   day,
//   month,
//   year,
// }: {
//   day: number;
//   month: number;
//   year: number;
// }) {
//   return (
//     <>
//       {day}
//       <sup>{ordinalSuffix(day)}</sup> {FULL_MONTHS[month - 1].toUpperCase()}{" "}
//       {year}
//     </>
//   );
// }

// function BillingColumns() {
//   return (
//     <colgroup>
//       <col style={{ width: "15%" }} />
//       <col style={{ width: "16%" }} />
//       <col style={{ width: "13%" }} />
//       <col style={{ width: "14%" }} />
//       <col style={{ width: "13%" }} />
//       <col style={{ width: "12%" }} />
//       <col style={{ width: "17%" }} />
//     </colgroup>
//   );
// }

// function BillingHead({ commissionLabel }: { commissionLabel: string }) {
//   return (
//     <thead>
//       <tr>
//         <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//           Flighting Dates
//         </th>
//         <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//           Billing Cycle 45
//           <br />
//           days EOM
//         </th>
//         <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//           Advertising
//           <br />
//           Investment
//         </th>
//         <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//           Agency
//           <br />
//           Commission
//           <br />({commissionLabel})
//         </th>
//         <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//           Total
//           <br />
//           <span className="italic">
//             (less
//             <br />
//             Agency
//             <br />
//             Comm
//           </span>
//           )
//         </th>
//         <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//           plus
//           <br />
//           GST 10%
//         </th>
//         <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
//           Total Due to
//           <br />
//           AOSco
//           <br />
//           <span className="italic">incl</span> GST
//         </th>
//       </tr>
//     </thead>
//   );
// }

// interface BillingTableProps {
//   agencyData?: AgencyQuoteMasterData; // month-wise rows (preferred)
//   agencyDiscount?: CrmValue; // deal.agency_discount — commission % in the header

//   // Fallback single row, used only when agency_quote_master_data is empty
//   campaignStartDate?: CrmValue;
//   campaignEndDate?: CrmValue;
//   investment?: CrmValue; // ex GST, before commission
//   agencyCommission?: CrmValue; // optional — if empty, 10% of investment is used
//   gstAmount?: CrmValue;
//   totalInvestment?: CrmValue; // incl GST
// }

// function BillingTable(props: BillingTableProps) {
//   const rows = props.agencyData ? toAgencyBillingRows(props.agencyData) : [];
//   const commissionRate = toRate(props.agencyDiscount) ?? DEFAULT_COMMISSION_RATE;
//   const commissionLabel = formatRate(commissionRate);

//   return rows.length > 0 ? (
//     <MonthlyBillingTable rows={rows} commissionLabel={commissionLabel} />
//   ) : (
//     <SingleRowBillingTable
//       {...props}
//       commissionRate={commissionRate}
//       commissionLabel={commissionLabel}
//     />
//   );
// }

// // One row per month from agency_quote_master_data, plus a Campaign Total row.
// function MonthlyBillingTable({
//   rows,
//   commissionLabel,
// }: {
//   rows: AgencyBillingRow[];
//   commissionLabel: string;
// }) {
//   const totals = rows.reduce(
//     (t, r) => ({
//       investment: round2(t.investment + r.investment),
//       commission: round2(t.commission + r.commission),
//       net: round2(t.net + r.net),
//       gst: round2(t.gst + r.gst),
//       total: round2(t.total + r.total),
//     }),
//     { investment: 0, commission: 0, net: 0, gst: 0, total: 0 },
//   );

//   return (
//     <div className="aosco-billing">
//       <table className="aosco-billing-table">
//         <BillingColumns />
//         <BillingHead commissionLabel={commissionLabel} />
//         <tbody>
//           {rows.map((row) => (
//             <tr key={row.key}>
//               <td className="aosco-billing-cell">{row.flighting}</td>
//               <td className="aosco-billing-cell">
//                 <BillingDate
//                   day={row.billingDay}
//                   month={row.billingMonth}
//                   year={row.billingYear}
//                 />
//               </td>
//               <td className="aosco-billing-cell">{money(row.investment)}</td>
//               <td className="aosco-billing-cell">{money(row.commission)}</td>
//               <td className="aosco-billing-cell">{money(row.net)}</td>
//               <td className="aosco-billing-cell">{money(row.gst)}</td>
//               <td className="aosco-billing-cell">{money(row.total)}</td>
//             </tr>
//           ))}
//           <tr className="aosco-billing-total">
//             <td colSpan={2} className={cx("aosco-billing-cell", "text-right")}>
//               Campaign Total
//             </td>
//             <td className="aosco-billing-cell">{money(totals.investment)}</td>
//             <td className="aosco-billing-cell">{money(totals.commission)}</td>
//             <td className="aosco-billing-cell">{money(totals.net)}</td>
//             <td className="aosco-billing-cell">{money(totals.gst)}</td>
//             <td className={cx("aosco-billing-cell", "aosco-billing-grand")}>
//               {money(totals.total)}
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // Original single-row table, from the deal's total amounts.
// function SingleRowBillingTable({
//   campaignStartDate,
//   campaignEndDate,
//   investment,
//   agencyCommission,
//   gstAmount,
//   totalInvestment,
//   commissionRate,
//   commissionLabel,
// }: BillingTableProps & { commissionRate: number; commissionLabel: string }) {
//   // "AUG – OCT 2026", or "NOV 2026 – JAN 2027" when the campaign crosses a year.
//   const flightingWithYear = (() => {
//     const read = (v: CrmValue) => {
//       const m = formatHubspotDate(v).match(/^\d{2}\/(\d{2})\/(\d{4})$/);
//       return m ? { month: FLIGHT_MONTHS[Number(m[1]) - 1], year: m[2] } : null;
//     };
//     const s = read(campaignStartDate);
//     const e = read(campaignEndDate);
//     if (s && e) {
//       if (s.year !== e.year)
//         return `${s.month} ${s.year} \u2013 ${e.month} ${e.year}`;
//       if (s.month !== e.month) return `${s.month} \u2013 ${e.month} ${e.year}`;
//       return `${s.month} ${s.year}`;
//     }
//     const one = s || e;
//     return one ? `${one.month} ${one.year}` : "";
//   })();

//   const today = todayInBrisbane();

//   const investmentAmount = toAmount(investment);
//   const commission =
//     toAmount(agencyCommission) ??
//     (investmentAmount !== null
//       ? round2(investmentAmount * commissionRate)
//       : null);
//   const net =
//     investmentAmount !== null ? round2(investmentAmount - (commission ?? 0)) : null;
//   // GST is on the amount after agency commission
//   const gst =
//     net !== null ? round2(net * GST_RATE) : toAmount(gstAmount);
//   const total =
//     net !== null
//       ? round2(net + (gst ?? 0))
//       : toAmount(totalInvestment);

//   return (
//     <div className="aosco-billing">
//       <table className="aosco-billing-table">
//         <BillingColumns />
//         <BillingHead commissionLabel={commissionLabel} />
//         <tbody>
//           <tr>
//             <td className="aosco-billing-cell">
//               {flightingWithYear || "\u00A0"}
//             </td>
//             <td className="aosco-billing-cell">
//               <BillingDate
//                 day={today.day}
//                 month={today.month}
//                 year={today.year}
//               />
//             </td>
//             <td className="aosco-billing-cell">{money(investmentAmount)}</td>
//             <td className="aosco-billing-cell">{money(commission)}</td>
//             <td className="aosco-billing-cell">{money(net)}</td>
//             <td className="aosco-billing-cell">{money(gst)}</td>
//             <td className="aosco-billing-cell">{money(total)}</td>
//           </tr>
//           <tr>
//             <td colSpan={6} className={cx("aosco-billing-cell", "text-right")}>
//               Campaign Total
//             </td>
//             <td className={cx("aosco-billing-cell", "aosco-billing-grand")}>
//               {money(total)}
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // ---------------------------------------------------------------------------
// // Component — HubSpot quote module entry point
// // ---------------------------------------------------------------------------

// export function Component({ hublData }: Props) {
//   const h: HublData = hublData || ({} as HublData);

//   const data = parseQuoteMasterData(h.scheduleSummaryJson);
//   const agencyData = parseAgencyQuoteMasterData(h.agencyQuoteJson);

//   const documentTitle = data.documentTitle || "ADVERTISING AGREEMENT";
//   const companyLegalName =
//     data.companyLegalName || "Australian Outdoor Sign Company Pty Ltd";
//   const coverSrc =
//     "https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/Quote%20Cover.png";
//   const logoSrc =
//     "https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/logo.png";
//   const coverImageSrc = data.coverImageSrc;

//   // -------------------------------------------------------------------------
//   // DEAL → form field mapping
//   // Priority everywhere: deal property → quote_master_data JSON → default.
//   // Advertiser and Accounts are the same person; Agency is a different one.
//   // -------------------------------------------------------------------------
//   const advertiserFullName = fullName(
//     h.advertiserFirstName,
//     h.advertiserLastName,
//   );
//   const agencyFullName = fullName(h.agencyFirstName, h.agencyLastName);

//   // Advertiser Details
//   const adv: AdvertiserDetails = {
//     greetingName: firstFilled(
//       h.advertiserFirstName,
//       data.advertiser?.greetingName,
//       DEFAULT_ADVERTISER.greetingName,
//     ),
//     companyName: firstFilled(h.advertiserCompany, data.advertiser?.companyName),
//     contactName: firstFilled(advertiserFullName, data.advertiser?.contactName),
//     phone: firstFilled(h.advertiserPhone, data.advertiser?.phone),
//     email: firstFilled(h.advertiserEmail, data.advertiser?.email),
//     address: firstFilled(data.advertiser?.address),
//   };

//   // Account Details — same person as the advertiser
//   const acc: AccountDetails = {
//     accountsName: firstFilled(adv.contactName, data.account?.accountsName),
//     accountsProcess: firstFilled(
//       data.account?.accountsProcess,
//       adv.greetingName
//         ? `Please send to ${adv.greetingName} for distribution and payment`
//         : "",
//       DEFAULT_ACCOUNT.accountsProcess,
//     ),
//     accountsEmail: firstFilled(adv.email, data.account?.accountsEmail),
//   };

//   // Agency Details — separate person
//   const agency: AgencyDetails = {
//     agencyName: firstFilled(h.agencyCompanyName, data.agency?.agencyName),
//     addressLine1: firstFilled(h.agencyAddress, data.agency?.addressLine1),
//     addressLine2: firstFilled(h.agencyAddressLine2, data.agency?.addressLine2),
//     contactName: firstFilled(agencyFullName, data.agency?.contactName),
//     phone: firstFilled(h.agencyPhone), // no agency phone property on the deal yet
//     email: firstFilled(h.agencyEmail, data.agency?.email),
//   };

//   // Campaign Booking
//   const camp: CampaignBooking = {
//     campaignName: firstFilled(h.dealName, data.campaign?.campaignName),
//     referenceId: firstFilled(
//       data.campaign?.referenceId,
//       h.dealId ? `AOS-${firstFilled(h.dealId)}` : "",
//       DEFAULT_CAMPAIGN.referenceId,
//     ),
//     siteSizeType: firstFilled(
//       data.campaign?.siteSizeType,
//       DEFAULT_CAMPAIGN.siteSizeType,
//     ),
//     type: firstFilled(data.campaign?.type),
//     weeksRequired: 0,
//     startDate: formatHubspotDate(h.campaignStartDate),
//     endDate: formatHubspotDate(h.campaignEndDate),
//   };

//   const exec: Execution = {
//     advertiser: {
//       ...DEFAULT_EXECUTION.advertiser,
//       ...(data.execution?.advertiser || {}),
//       representativeName: firstFilled(
//         data.execution?.advertiser?.representativeName,
//         adv.contactName,
//       ),
//     },
//     aosco: { ...DEFAULT_EXECUTION.aosco, ...(data.execution?.aosco || {}) },
//   };

//   const specialConditions =
//     data.specialConditions ?? DEFAULT_SPECIAL_CONDITIONS;

//   return (
//     <div className="aosco-root">
//       <style>{MODULE_CSS}</style>

//       {/* Cover page */}
//       <section className="aosco-cover">
//         {coverImageSrc && (
//           <img src={coverImageSrc} alt="" className="aosco-cover-img" />
//         )}
//         <div className="aosco-cover-overlay" />

//         <div className="aosco-cover-center">
//           {coverSrc ? (
//             <img
//               src={coverSrc}
//               alt={companyLegalName}
//               className="aosco-cover-logo-img"
//             />
//           ) : (
//             <div>
//               <div className="aosco-text-logo">
//                 AOS<span className="aosco-text-logo-sup">Co.</span>
//               </div>
//               <p className="aosco-tagline">Australian Outdoor Sign Company</p>
//             </div>
//           )}
//         </div>
//       </section>

//       {/* Content page header bar */}
//       <div className="aosco-header-bar">
//         <h1 className="aosco-header-title">{documentTitle}</h1>
//         {logoSrc ? (
//           <img
//             src={logoSrc}
//             alt={companyLegalName}
//             className="aosco-header-logo-img"
//           />
//         ) : (
//           <span className="aosco-header-text-logo">
//             AOS<span className="aosco-header-text-logo-sup">Co.</span>
//           </span>
//         )}
//       </div>

//       <div className="aosco-body">
//         <p className="aosco-greeting">Dear {adv.greetingName || "\u00A0"},</p>
//         <p className="aosco-intro">
//           Thank you for the opportunity to provide our services to you.
//         </p>
//         <p className="aosco-intro-last">
//           This document and the <strong>attached</strong> Terms and Conditions
//           set out the basis on which AOSCO provide our services.
//         </p>

//         {/* Advertiser + Account + Agency Details */}
//         <section className="aosco-section">
//           <p className="aosco-section-heading">Advertiser Details</p>
//           <FieldLine label="COMPANY NAME:" value={adv.companyName} />
//           <FieldLine label="Contact Name:" value={adv.contactName} />
//           <FieldLine label="Phone Number:" value={adv.phone} />
//           <FieldLine label="Email Address:" value={adv.email} />

//           <p
//             className={cx("aosco-section-heading", "aosco-section-heading--mt")}
//           >
//             Account Details
//           </p>
//           <FieldLine label="Accounts Name:" value={acc.accountsName} />
//           <FieldLine
//             label="Accounts Process:"
//             value={acc.accountsProcess}
//             underline={false}
//           />
//           <FieldLine label="Accounts Email 1:" value={acc.accountsEmail} />

//           <p
//             className={cx("aosco-section-heading", "aosco-section-heading--mt")}
//           >
//             Agency Details
//           </p>
//           <FieldLine label="Agency Name:" value={agency.agencyName} />
//           <FieldLine label="Address:" value={agency.addressLine1} />
//           <FieldLine label={"\u00A0"} value={agency.addressLine2} />
//           <FieldLine label="Contact Name:" value={agency.contactName} />
//           <FieldLine label="Phone Number:" value={agency.phone} />
//           <FieldLine label="Email Address:" value={agency.email} />
//         </section>

//         {/* Campaign Booking */}
//         <section className="aosco-section">
//           <p className="aosco-section-heading">Campaign Booking</p>
//           <FieldLine label="Campaign Name:" value={camp.campaignName} />
//           <FieldLine label="Reference ID:" value={camp.referenceId} />
//           <FieldLine
//             label="Site, Size & Type of Selected Billboards:"
//             value={camp.siteSizeType}
//           />
//           <FieldLine label="Type:" value={camp.type} />
//           <FieldLine label="Weeks Required:" value={camp.weeksRequired} />
//           <FieldLine label="Start Date:" value={camp.startDate} />
//           <FieldLine label="End Date:" value={camp.endDate} />
//         </section>

//         {/* Schedule + Billing */}
//         <section className="aosco-section">
//           <p className="aosco-section-heading aosco-section-heading--underline">
//             Schedule:
//           </p>

//           <p>
//             Schedule Below runs for 6 weeks as planned below across the AOSCO
//             Network{" "}
//           </p>

//           <br />
//           <p className="aosco-section-heading aosco-section-heading--underline">
//             Billing:
//           </p>
//           <p className="aosco-section-heading">
//             AOSCO is offering a 10% Discount for Upfront Billing from $10,000
//             Investment
//           </p>

//           <BillingTable
//             agencyData={agencyData}
//             agencyDiscount={h.agencyDiscount}
//             campaignStartDate={h.campaignStartDate}
//             campaignEndDate={h.campaignEndDate}
//             investment={h.investment}
//             gstAmount={h.gstAmount}
//             totalInvestment={h.totalInvestment}
//           />
//         </section>

//         {/* Special Conditions */}
//         <section className="aosco-section">
//           <p className="aosco-section-heading aosco-section-heading--underline">
//             Special conditions:
//           </p>
//           <ol className="aosco-sc-list" style={{ listStyleType: "decimal" }}>
//             {specialConditions.map((c, i) => (
//               <li key={i}>{c}</li>
//             ))}
//           </ol>
//         </section>

//         {/* Execution / signatures */}
//         <section className="aosco-section aosco-section--exec">
//           <p className="aosco-section-heading">Execution</p>
//           <p className="aosco-exec-intro">
//             I acknowledge that I have received and read this Agreement, confirm
//             that the details contained within (including regarding payments due)
//             are correct and hereby agree to be bound to this Agreement and the
//             Terms and Conditions as <strong>attached.</strong>
//           </p>
//           <div className="aosco-exec-grid">
//             <div>
//               <p className="aosco-exec-col-title">
//                 Executed on behalf of {adv.companyName || "\u00A0"} by
//               </p>
//               <FieldLine
//                 label="Representative Name:"
//                 value={exec.advertiser.representativeName}
//               />
//               <FieldLine label="Position:" value={exec.advertiser.position} />
//               <FieldLine label="Date:" value={exec.advertiser.date} />
//             </div>
//             <div>
//               <p className="aosco-exec-col-title">
//                 Executed on behalf of {companyLegalName}
//               </p>
//               <FieldLine
//                 label="Representative Name:"
//                 value={exec.aosco.representativeName}
//               />
//               <FieldLine label="Position:" value={exec.aosco.position} />
//               <FieldLine label="Date:" value={exec.aosco.date} />
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }

// export const meta = {
//   label: "AOSco Quote Agency",
//   content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
// };

// // Single source of truth: every value is read from the DEAL record.
// // The billing contact / billing company attached to the quote are ignored.
// // The deal lookup is guarded because a quote blueprint preview may not
// // have a deal attached.
// export const hublDataTemplate = `
//   {% set dealData = {} %}
//   {% if quoteTemplateContext.deal and quoteTemplateContext.deal.hs_object_id %}
//     {% set dealData = crm_object("deal", quoteTemplateContext.deal.hs_object_id, "hs_object_id,dealname,quote_master_data,agency_quote_master_data,agency_discount,campaign_start_date,campaign_end_date,total_commercial_rate,gst_amount,total_investment,advertiser_company,advertiser_contact_first_name,advertiser_contact_last_name,advertiser_person_phone_number,advertiser_person_email_address,agency_company_name,agency_person_first_name,agency_person_last_name,agency_person_email,agency_company_address,agency_address_line_2,agency_person_phone") %}
//   {% endif %}

//   {% set hublData = {
//     "isQuoteBlueprint": isQuoteBlueprint,
//     "dealId": dealData.hs_object_id,
//     "dealName": dealData.dealname,
//     "campaignStartDate": dealData.campaign_start_date,
//     "campaignEndDate": dealData.campaign_end_date,
//     "totalInvestment": dealData.total_investment,
//     "investment": dealData.total_commercial_rate,
//     "gstAmount": dealData.gst_amount,
//     "scheduleSummaryJson": dealData.quote_master_data,
//     "agencyQuoteJson": dealData.agency_quote_master_data,
//     "agencyDiscount": dealData.agency_discount,

//     "advertiserCompany": dealData.advertiser_company,
//     "advertiserFirstName": dealData.advertiser_contact_first_name,
//     "advertiserLastName": dealData.advertiser_contact_last_name,
//     "advertiserPhone": dealData.advertiser_person_phone_number,
//     "advertiserEmail": dealData.advertiser_person_email_address,

//     "agencyCompanyName": dealData.agency_company_name,
//     "agencyFirstName": dealData.agency_person_first_name,
//     "agencyLastName": dealData.agency_person_last_name,
//     "agencyEmail": dealData.agency_person_email,
//     "agencyPhone": dealData.agency_person_phone,
//     "agencyAddress": dealData.agency_company_address,
//     "agencyAddressLine2": dealData.agency_address_line_2
//   } %}
// `;

import React from "react";

import { fields } from "./fields";

// Styles live in a shared .css file; `?raw` imports it as a string so it can
// still be injected via <style> (SSR + quote PDF render, no Tailwind here).
import MODULE_CSS from '../../styles/aosco-quote.css?raw';

export { fields };

export interface AdvertiserDetails {
  greetingName: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export interface AccountDetails {
  accountsName: string;
  accountsProcess: string;
  accountsEmail: string;
}

export interface AgencyDetails {
  agencyName: string;
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
  weeksRequired: number;
  startDate: string;
  endDate: string;
}

export interface ScheduleMeta {
  locality: string;
  cashContraLabel: string;
  weekCommencingLabel: string;
  bonusPlacementLabel: string;
  reachInfoLabel: string;
  broadcastInfoLabel: string;
  bonusNote: string;
}

export interface BillingRow {
  flighting: string;
  billingDate: string;
  investment: number;
  gst: number;
  total: number;
}

export interface Billing {
  attAccounts: string;
  invoice1: string;
  invoice2: string;
  rows: BillingRow[];
}

export interface ExecutionParty {
  representativeName: string;
  position: string;
  date: string;
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
  ad_schedules?: Array<{ n?: string | null; fid?: string | null; ws?: string[] }>;
  weekDates?: string[];
  scheduleMeta?: Partial<ScheduleMeta>;
  billing?: Partial<Billing>;
  specialConditions?: string[];
  execution?: {
    advertiser?: Partial<ExecutionParty>;
    aosco?: Partial<ExecutionParty>;
  };
}

// The parsed shape of the agency_quote_master_data JSON property
// (built by the NestJS line-item sync). Short keys keep the JSON small.
export interface AgencyQuoteMonth {
  k: string; // month "YYYY-MM"
  w: number; // weeks booked (all schedules)
  r: number; // client total  -> "Total (less Agency Comm)"
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

// ---------------------------------------------------------------------------
// HubSpot module types
// ---------------------------------------------------------------------------

type CrmValue = string | number | null | undefined;

// Must match the keys built in hublDataTemplate at the bottom of this file.
// Everything comes from the DEAL record only (single source of truth) —
// the billing contact / billing company on the quote are not read.
interface HublData {
  isQuoteBlueprint: boolean;

  // Deal
  dealId?: CrmValue;
  dealName?: CrmValue;
  campaignStartDate?: CrmValue; // HubSpot date property (epoch ms or YYYY-MM-DD)
  campaignEndDate?: CrmValue;
  scheduleSummaryJson?: unknown; // quote_master_data — usually a JSON string, parsed client-side below
  agencyQuoteJson?: unknown; // agency_quote_master_data — month-wise billing, parsed client-side below

  // Deal — agency commission rate shown in the billing table header
  agencyDiscount?: CrmValue; // agency_discount (0.1 or 10 both mean 10%)

  // Deal — billing amounts (fallback when agency_quote_master_data is empty)
  investment?: CrmValue; // total_commercial_rate (ex GST)
  gstAmount?: CrmValue; // gst_amount
  totalInvestment?: CrmValue; // total_investment (incl GST)

  // Deal — advertiser (also used for Account Details: same person)
  advertiserCompany?: CrmValue; // advertiser_company
  advertiserFirstName?: CrmValue; // advertiser_contact_first_name
  advertiserLastName?: CrmValue; // advertiser_contact_last_name
  advertiserPhone?: CrmValue; // advertiser_person_phone_number
  advertiserEmail?: CrmValue; // advertiser_person_email_address

  // Deal — agency (a different person)
  agencyCompanyName?: CrmValue; // agency_company_name
  agencyFirstName?: CrmValue; // agency_person_first_name
  agencyLastName?: CrmValue; // agency_person_last_name
  agencyEmail?: CrmValue; // agency_person_email
  agencyPhone?: CrmValue; // agency_person_phone
  agencyAddress?: CrmValue; // agency_company_address
  agencyAddressLine2?: CrmValue; // agency_address_line_2
}

interface Props {
  fieldValues: FieldValues;
  hublData: HublData;
}

interface FieldValues {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// Formats a HubSpot deal date property (campaign_start_date etc.) as
// dd/mm/yyyy. HubSpot sends these as Australian day-first dates with a
// two- or four-digit year: "1/9/26", "01/09/26", "01/09/2026" -> "01/09/2026".
// Two-digit years are read as 20xx. Also accepts epoch timestamps and
// ISO "2026-09-01" in case the property format ever changes.
function formatHubspotDate(value: CrmValue): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  // d/m/yy, dd/mm/yy, d/m/yyyy, dd/mm/yyyy (optionally followed by a time)
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})(?!\d)/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return "";
    return `${pad2(day)}/${pad2(month)}/${year}`;
  }

  // ISO "2026-09-01"
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;

  // Epoch ms / seconds, including "1788220800000.0" and "1.7882208E12"
  if (/^\d+(\.\d+)?(e\+?\d+)?$/i.test(raw)) {
    const n = Number(raw);
    let date: Date | null = null;
    if (n > 1e11) date = new Date(n);
    else if (n > 1e8) date = new Date(n * 1000);
    if (!date || Number.isNaN(date.getTime())) return "";
    return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
  }

  return ""; // unknown format: show nothing rather than a wrong date
}

// Returns the first value that isn't null/undefined/blank, as a string.
function firstFilled(...values: CrmValue[]): string {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return "";
}

// "Jane", "Smith" -> "Jane Smith"; skips blanks.
function fullName(first: CrmValue, last: CrmValue): string {
  return [first, last]
    .map((v) => firstFilled(v))
    .filter(Boolean)
    .join(" ");
}

function formatCurrency(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0.00";
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// JSON deal properties can reach us in a few shapes depending on how HubL
// serialises them: a JSON string (normal), an already-parsed object, an
// HTML-escaped string (&quot;…), or a double-encoded JSON string.
function parseJsonProperty<T extends object>(raw: unknown): Partial<T> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Partial<T>;

  const tryParse = (text: string): unknown => {
    try {
      let parsed: unknown = JSON.parse(text);
      if (typeof parsed === "string") parsed = JSON.parse(parsed); // double-encoded
      return parsed;
    } catch {
      return null;
    }
  };

  const text = String(raw).trim();
  let parsed = tryParse(text);
  if (!parsed) {
    const decoded = text
      .replace(/&quot;|&#34;|&#x22;/g, '"')
      .replace(/&#39;|&#x27;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    parsed = tryParse(decoded);
  }
  return typeof parsed === "object" && parsed !== null
    ? (parsed as Partial<T>)
    : {};
}

function parseQuoteMasterData(raw: unknown): QuoteMasterData {
  return parseJsonProperty<QuoteMasterData>(raw) as QuoteMasterData;
}

function parseAgencyQuoteMasterData(raw: unknown): AgencyQuoteMasterData {
  return parseJsonProperty<AgencyQuoteMasterData>(raw) as AgencyQuoteMasterData;
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Billing helpers
// ---------------------------------------------------------------------------

// Month labels in the style used on the printed agreement ("SEPT – NOV").
const FLIGHT_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUNE",
  "JULY",
  "AUG",
  "SEPT",
  "OCT",
  "NOV",
  "DEC",
];
const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const GST_RATE = 0.1;
const DEFAULT_COMMISSION_RATE = 0.1; // only used when deal.agency_discount is empty

function ordinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

// Today's date in Queensland time, so a quote generated on a UTC server
// late in the Australian evening still shows the Australian date.
function todayInBrisbane(): { day: number; month: number; year: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Brisbane",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).formatToParts(new Date());
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value);
    const day = get("day");
    const month = get("month");
    const year = get("year");
    if (day && month && year) return { day, month, year };
  } catch {
    // Intl timeZone not supported — fall through to local time.
  }
  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

// "4000", "4,000.00", "$4,000.00", 4000 -> 4000; blank/unreadable -> null.
function toAmount(value: CrmValue): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/[^0-9.-]/g, "");
  if (s === "" || s === "-" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Rounds to cents, avoiding float drift (1.005 -> 1.01).
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// 0.1111 -> "11.1%", 0.1 -> "10%".
function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}

// deal.agency_discount as a fraction: "0.1", "10", "10%" -> 0.1.
// Values above 1 are read as a percentage. Blank/unreadable -> null.
function toRate(value: CrmValue): number | null {
  const n = toAmount(value);
  if (n === null || n < 0) return null;
  return n > 1 ? n / 100 : n;
}

interface AgencyBillingRow {
  key: string; // "2026-09"
  flighting: string; // "SEPT 2026"
  billingDay: number; // last day of the month (EOM)
  billingMonth: number; // 1-12
  billingYear: number;
  investment: number; // r + a
  commission: number; // a
  net: number; // r
  gst: number; // 10% of net (Total less Agency Comm)
  total: number; // net + GST
}

// One billing row per month in agency_quote_master_data.m, oldest first.
// Months that can't be read are left out.
function toAgencyBillingRows(data: AgencyQuoteMasterData): AgencyBillingRow[] {
  const months = Array.isArray(data.m) ? data.m : [];

  return months
    .map((m): AgencyBillingRow | null => {
      const match = /^(\d{4})-(\d{2})$/.exec(String(m?.k ?? ""));
      if (!match) return null;

      const year = Number(match[1]);
      const month = Number(match[2]);
      if (month < 1 || month > 12) return null;

      const net = round2(Number(m.r) || 0);
      const commission = round2(Number(m.a) || 0);
      const investment = round2(net + commission);
      const gst = round2(net * GST_RATE); // GST is on the amount after agency commission
      const total = round2(net + gst);

      return {
        key: match[0],
        flighting: `${FLIGHT_MONTHS[month - 1]} ${year}`,
        billingDay: new Date(Date.UTC(year, month, 0)).getUTCDate(), // day 0 of next month = EOM
        billingMonth: month,
        billingYear: year,
        investment,
        commission,
        net,
        gst,
        total,
      };
    })
    .filter((row): row is AgencyBillingRow => row !== null)
    .sort((x, y) => x.key.localeCompare(y.key));
}

// ---------------------------------------------------------------------------
// Campaign Booking helpers (rules confirmed by the client)
// ---------------------------------------------------------------------------

// A network buy uses every site on the AOSco network.
const NETWORK_SITE_COUNT = 18;
const DAY_MS = 24 * 60 * 60 * 1000;

// "15/09/2026" or "2026-09-15" (optionally with a time) -> UTC ms; else null.
function toDayMs(value: unknown): number | null {
  const s = String(value ?? "").trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  return null;
}

// "Site, Size & Type of Selected Billboards":
//   all 18 sites on the schedule -> "NETWORK"
//   otherwise                    -> how many billboards are itemised ("3 SITES")
// Each billboard is counted once (by face ID, else by name). Reads
// quote_master_data.ad_schedules, falling back to agency_quote_master_data.
function siteSizeTypeLabel(
  data: QuoteMasterData,
  agencyData: AgencyQuoteMasterData,
): string {
  const quoteRows = Array.isArray(data.ad_schedules) ? data.ad_schedules : [];
  const agencyRows = Array.isArray(agencyData.s) ? agencyData.s : [];
  const keys =
    quoteRows.length > 0
      ? quoteRows.map((r) => firstFilled(r?.fid, r?.n))
      : agencyRows.map((r) => firstFilled(r?.n));

  const count = new Set(
    keys.map((k) => k.replace(/\s+/g, " ").toLowerCase()).filter(Boolean),
  ).size;
  if (count === 0) return "";
  if (count >= NETWORK_SITE_COUNT) return "NETWORK";
  return `${count} ${count === 1 ? "SITE" : "SITES"}`;
}

// "Weeks Required": one number for the whole campaign length — every week
// from the first booked week to the last, paid AND bonus, counted once.
// Week dates come from agency_quote_master_data (d), else quote_master_data
// (ws); with no schedule it falls back to the deal's start/end dates.
function campaignWeeks(
  data: QuoteMasterData,
  agencyData: AgencyQuoteMasterData,
  startDate: string,
  endDate: string,
): number {
  const collect = (lists: unknown[][]) =>
    lists
      .flat()
      .map(toDayMs)
      .filter((t): t is number => t !== null);

  let times = collect(
    (Array.isArray(agencyData.s) ? agencyData.s : []).map((r) =>
      Array.isArray(r?.d) ? r.d : [],
    ),
  );
  if (times.length === 0) {
    times = collect(
      (Array.isArray(data.ad_schedules) ? data.ad_schedules : []).map((r) =>
        Array.isArray(r?.ws) ? r.ws : [],
      ),
    );
  }

  if (times.length > 0) {
    const span = Math.max(...times) - Math.min(...times);
    return Math.round(span / (7 * DAY_MS)) + 1;
  }

  const start = toDayMs(startDate);
  const end = toDayMs(endDate);
  if (start !== null && end !== null && end >= start) {
    return Math.ceil((Math.round((end - start) / DAY_MS) + 1) / 7);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_ADVERTISER: AdvertiserDetails = {
  greetingName: "Nic",
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
};
const DEFAULT_ACCOUNT: AccountDetails = {
  accountsName: "",
  accountsProcess: "Please send to Nic for distribution and payment",
  accountsEmail: "",
};
const DEFAULT_CAMPAIGN: CampaignBooking = {
  campaignName: "",
  referenceId: "AOS-",
  siteSizeType: "NETWORK",
  type: "",
  weeksRequired: 0,
  startDate: "",
  endDate: "",
};
const DEFAULT_EXECUTION: Execution = {
  advertiser: { representativeName: "", position: "Owner", date: "" },
  aosco: {
    representativeName: "Jesse McIntyre",
    position: "Sales Director",
    date: "",
  },
};

// Transcribed verbatim, including the source document's own numbering.
const DEFAULT_SPECIAL_CONDITIONS: string[] = [
  "Unlimited Material Changes / Uploads Included.",
  "CANCELLATION (COVID Consideration) - AOSco agrees to honour a 7-day cancellation deadline, effective up until Monday before campaign launch in writing.",
  "Execution - I acknowledge that I have received and read this Agreement, confirm that the details contained within (including regarding payments due) are correct and hereby agree to be bound to this Agreement and the Terms and Conditions as attached.",
  "AOSco will offer Bonus STA Sites to the same spec if we have the avails.",
  "Bonus offered in this campaign is placed as 100% Guaranteed Bonus",
  "AOSCO will allocate Photographer resources to capture Creative for Client Socials. Drone, Static, Video",
  "Discount applied of 10% on Total for up for payment.",
];

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

interface FieldLineProps {
  label: string;
  value?: string | number | null;
  underline?: boolean;
}

function FieldLine({ label, value, underline = true }: FieldLineProps) {
  return (
    <div className="aosco-field-row">
      <span className="aosco-field-label">{label}</span>
      <span
        className={cx(
          "aosco-field-value",
          underline && "aosco-field-value--underline",
        )}
      >
        {value || "\u00A0"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Billing table
// ---------------------------------------------------------------------------

const money = (n: number | null) => (n !== null ? formatCurrency(n) : "\u00A0");

// "30th SEPTEMBER 2026"
function BillingDate({
  day,
  month,
  year,
}: {
  day: number;
  month: number;
  year: number;
}) {
  return (
    <>
      {day}
      <sup>{ordinalSuffix(day)}</sup> {FULL_MONTHS[month - 1].toUpperCase()}{" "}
      {year}
    </>
  );
}

function BillingColumns() {
  return (
    <colgroup>
      <col style={{ width: "15%" }} />
      <col style={{ width: "16%" }} />
      <col style={{ width: "13%" }} />
      <col style={{ width: "14%" }} />
      <col style={{ width: "13%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "17%" }} />
    </colgroup>
  );
}

function BillingHead({ commissionLabel }: { commissionLabel: string }) {
  return (
    <thead>
      <tr>
        <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
          Flighting Dates
        </th>
        <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
          Billing Cycle 45
          <br />
          days EOM
        </th>
        <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
          Advertising
          <br />
          Investment
        </th>
        <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
          Agency
          <br />
          Commission
          <br />({commissionLabel})
        </th>
        <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
          Total
          <br />
          <span className="italic">
            (less
            <br />
            Agency
            <br />
            Comm
          </span>
          )
        </th>
        <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
          plus
          <br />
          GST 10%
        </th>
        <th className={cx("aosco-billing-cell", "aosco-billing-head")}>
          Total Due to
          <br />
          AOSco
          <br />
          <span className="italic">incl</span> GST
        </th>
      </tr>
    </thead>
  );
}

interface BillingTableProps {
  agencyData?: AgencyQuoteMasterData; // month-wise rows (preferred)
  agencyDiscount?: CrmValue; // deal.agency_discount — commission % in the header

  // Fallback single row, used only when agency_quote_master_data is empty
  campaignStartDate?: CrmValue;
  campaignEndDate?: CrmValue;
  investment?: CrmValue; // ex GST, before commission
  agencyCommission?: CrmValue; // optional — if empty, 10% of investment is used
  gstAmount?: CrmValue;
  totalInvestment?: CrmValue; // incl GST
}

function BillingTable(props: BillingTableProps) {
  const rows = props.agencyData ? toAgencyBillingRows(props.agencyData) : [];
  const commissionRate = toRate(props.agencyDiscount) ?? DEFAULT_COMMISSION_RATE;
  const commissionLabel = formatRate(commissionRate);

  return rows.length > 0 ? (
    <MonthlyBillingTable rows={rows} commissionLabel={commissionLabel} />
  ) : (
    <SingleRowBillingTable
      {...props}
      commissionRate={commissionRate}
      commissionLabel={commissionLabel}
    />
  );
}

// One row per month from agency_quote_master_data, plus a Campaign Total row.
function MonthlyBillingTable({
  rows,
  commissionLabel,
}: {
  rows: AgencyBillingRow[];
  commissionLabel: string;
}) {
  const totals = rows.reduce(
    (t, r) => ({
      investment: round2(t.investment + r.investment),
      commission: round2(t.commission + r.commission),
      net: round2(t.net + r.net),
      gst: round2(t.gst + r.gst),
      total: round2(t.total + r.total),
    }),
    { investment: 0, commission: 0, net: 0, gst: 0, total: 0 },
  );

  return (
    <div className="aosco-billing">
      <table className="aosco-billing-table">
        <BillingColumns />
        <BillingHead commissionLabel={commissionLabel} />
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="aosco-billing-cell">{row.flighting}</td>
              <td className="aosco-billing-cell">
                <BillingDate
                  day={row.billingDay}
                  month={row.billingMonth}
                  year={row.billingYear}
                />
              </td>
              <td className="aosco-billing-cell">{money(row.investment)}</td>
              <td className="aosco-billing-cell">{money(row.commission)}</td>
              <td className="aosco-billing-cell">{money(row.net)}</td>
              <td className="aosco-billing-cell">{money(row.gst)}</td>
              <td className="aosco-billing-cell">{money(row.total)}</td>
            </tr>
          ))}
          <tr className="aosco-billing-total">
            <td colSpan={2} className={cx("aosco-billing-cell", "text-right")}>
              Campaign Total
            </td>
            <td className="aosco-billing-cell">{money(totals.investment)}</td>
            <td className="aosco-billing-cell">{money(totals.commission)}</td>
            <td className="aosco-billing-cell">{money(totals.net)}</td>
            <td className="aosco-billing-cell">{money(totals.gst)}</td>
            <td className={cx("aosco-billing-cell", "aosco-billing-grand")}>
              {money(totals.total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Original single-row table, from the deal's total amounts.
function SingleRowBillingTable({
  campaignStartDate,
  campaignEndDate,
  investment,
  agencyCommission,
  gstAmount,
  totalInvestment,
  commissionRate,
  commissionLabel,
}: BillingTableProps & { commissionRate: number; commissionLabel: string }) {
  // "AUG – OCT 2026", or "NOV 2026 – JAN 2027" when the campaign crosses a year.
  const flightingWithYear = (() => {
    const read = (v: CrmValue) => {
      const m = formatHubspotDate(v).match(/^\d{2}\/(\d{2})\/(\d{4})$/);
      return m ? { month: FLIGHT_MONTHS[Number(m[1]) - 1], year: m[2] } : null;
    };
    const s = read(campaignStartDate);
    const e = read(campaignEndDate);
    if (s && e) {
      if (s.year !== e.year)
        return `${s.month} ${s.year} \u2013 ${e.month} ${e.year}`;
      if (s.month !== e.month) return `${s.month} \u2013 ${e.month} ${e.year}`;
      return `${s.month} ${s.year}`;
    }
    const one = s || e;
    return one ? `${one.month} ${one.year}` : "";
  })();

  const today = todayInBrisbane();

  const investmentAmount = toAmount(investment);
  const commission =
    toAmount(agencyCommission) ??
    (investmentAmount !== null
      ? round2(investmentAmount * commissionRate)
      : null);
  const net =
    investmentAmount !== null ? round2(investmentAmount - (commission ?? 0)) : null;
  // GST is on the amount after agency commission
  const gst =
    net !== null ? round2(net * GST_RATE) : toAmount(gstAmount);
  const total =
    net !== null
      ? round2(net + (gst ?? 0))
      : toAmount(totalInvestment);

  return (
    <div className="aosco-billing">
      <table className="aosco-billing-table">
        <BillingColumns />
        <BillingHead commissionLabel={commissionLabel} />
        <tbody>
          <tr>
            <td className="aosco-billing-cell">
              {flightingWithYear || "\u00A0"}
            </td>
            <td className="aosco-billing-cell">
              <BillingDate
                day={today.day}
                month={today.month}
                year={today.year}
              />
            </td>
            <td className="aosco-billing-cell">{money(investmentAmount)}</td>
            <td className="aosco-billing-cell">{money(commission)}</td>
            <td className="aosco-billing-cell">{money(net)}</td>
            <td className="aosco-billing-cell">{money(gst)}</td>
            <td className="aosco-billing-cell">{money(total)}</td>
          </tr>
          <tr>
            <td colSpan={6} className={cx("aosco-billing-cell", "text-right")}>
              Campaign Total
            </td>
            <td className={cx("aosco-billing-cell", "aosco-billing-grand")}>
              {money(total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component — HubSpot quote module entry point
// ---------------------------------------------------------------------------

export function Component({ hublData }: Props) {
  const h: HublData = hublData || ({} as HublData);

  const data = parseQuoteMasterData(h.scheduleSummaryJson);
  const agencyData = parseAgencyQuoteMasterData(h.agencyQuoteJson);

  const documentTitle = data.documentTitle || "ADVERTISING AGREEMENT";
  const companyLegalName =
    data.companyLegalName || "Australian Outdoor Sign Company Pty Ltd";
  const coverSrc =
    "https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/Quote%20Cover.png";
  const logoSrc =
    "https://443453524.fs1.hubspotusercontent-ap1.net/hubfs/443453524/logo.png";
  const coverImageSrc = data.coverImageSrc;

  // -------------------------------------------------------------------------
  // DEAL → form field mapping
  // Priority everywhere: deal property → quote_master_data JSON → default.
  // Advertiser and Accounts are the same person; Agency is a different one.
  // -------------------------------------------------------------------------
  const advertiserFullName = fullName(
    h.advertiserFirstName,
    h.advertiserLastName,
  );
  const agencyFullName = fullName(h.agencyFirstName, h.agencyLastName);

  // Advertiser Details
  const adv: AdvertiserDetails = {
    greetingName: firstFilled(
      h.advertiserFirstName,
      data.advertiser?.greetingName,
      DEFAULT_ADVERTISER.greetingName,
    ),
    companyName: firstFilled(h.advertiserCompany, data.advertiser?.companyName),
    contactName: firstFilled(advertiserFullName, data.advertiser?.contactName),
    phone: firstFilled(h.advertiserPhone, data.advertiser?.phone),
    email: firstFilled(h.advertiserEmail, data.advertiser?.email),
    address: firstFilled(data.advertiser?.address),
  };

  // Account Details — same person as the advertiser
  const acc: AccountDetails = {
    accountsName: firstFilled(adv.contactName, data.account?.accountsName),
    accountsProcess: firstFilled(
      data.account?.accountsProcess,
      adv.greetingName
        ? `Please send to ${adv.greetingName} for distribution and payment`
        : "",
      DEFAULT_ACCOUNT.accountsProcess,
    ),
    accountsEmail: firstFilled(adv.email, data.account?.accountsEmail),
  };

  // Agency Details — separate person
  const agency: AgencyDetails = {
    agencyName: firstFilled(h.agencyCompanyName, data.agency?.agencyName),
    addressLine1: firstFilled(h.agencyAddress, data.agency?.addressLine1),
    addressLine2: firstFilled(h.agencyAddressLine2, data.agency?.addressLine2),
    contactName: firstFilled(agencyFullName, data.agency?.contactName),
    phone: firstFilled(h.agencyPhone), // no agency phone property on the deal yet
    email: firstFilled(h.agencyEmail, data.agency?.email),
  };

  // Campaign Booking
  const camp: CampaignBooking = {
    campaignName: firstFilled(h.dealName, data.campaign?.campaignName),
    referenceId: firstFilled(
      data.campaign?.referenceId,
      h.dealId ? `AOS-${firstFilled(h.dealId)}` : "",
      DEFAULT_CAMPAIGN.referenceId,
    ),
    // "NETWORK" for all 18 sites, otherwise the number of billboards on the schedule
    siteSizeType: firstFilled(
      data.campaign?.siteSizeType,
      siteSizeTypeLabel(data, agencyData),
    ),
    // Not specified by the client yet — only filled if quote_master_data provides it.
    type: firstFilled(data.campaign?.type),
    // Total campaign length in weeks, bonus weeks included
    weeksRequired: campaignWeeks(
      data,
      agencyData,
      formatHubspotDate(h.campaignStartDate),
      formatHubspotDate(h.campaignEndDate),
    ),
    startDate: formatHubspotDate(h.campaignStartDate),
    endDate: formatHubspotDate(h.campaignEndDate),
  };

  const exec: Execution = {
    advertiser: {
      ...DEFAULT_EXECUTION.advertiser,
      ...(data.execution?.advertiser || {}),
      representativeName: firstFilled(
        data.execution?.advertiser?.representativeName,
        adv.contactName,
      ),
    },
    aosco: { ...DEFAULT_EXECUTION.aosco, ...(data.execution?.aosco || {}) },
  };

  const specialConditions =
    data.specialConditions ?? DEFAULT_SPECIAL_CONDITIONS;

  return (
    <div className="aosco-root">
      <style>{MODULE_CSS}</style>

      {/* Cover page */}
      <section className="aosco-cover">
        {coverImageSrc && (
          <img src={coverImageSrc} alt="" className="aosco-cover-img" />
        )}
        <div className="aosco-cover-overlay" />

        <div className="aosco-cover-center">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={companyLegalName}
              className="aosco-cover-logo-img"
            />
          ) : (
            <div>
              <div className="aosco-text-logo">
                AOS<span className="aosco-text-logo-sup">Co.</span>
              </div>
              <p className="aosco-tagline">Australian Outdoor Sign Company</p>
            </div>
          )}
        </div>
      </section>

      {/* Content page header bar */}
      <div className="aosco-header-bar">
        <h1 className="aosco-header-title">{documentTitle}</h1>
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={companyLegalName}
            className="aosco-header-logo-img"
          />
        ) : (
          <span className="aosco-header-text-logo">
            AOS<span className="aosco-header-text-logo-sup">Co.</span>
          </span>
        )}
      </div>

      <div className="aosco-body">
        <p className="aosco-greeting">Dear {adv.greetingName || "\u00A0"},</p>
        <p className="aosco-intro">
          Thank you for the opportunity to provide our services to you.
        </p>
        <p className="aosco-intro-last">
          This document and the <strong>attached</strong> Terms and Conditions
          set out the basis on which AOSCO provide our services.
        </p>

        {/* Advertiser + Account + Agency Details */}
        <section className="aosco-section">
          <p className="aosco-section-heading">Advertiser Details</p>
          <FieldLine label="COMPANY NAME:" value={adv.companyName} />
          <FieldLine label="Contact Name:" value={adv.contactName} />
          <FieldLine label="Phone Number:" value={adv.phone} />
          <FieldLine label="Email Address:" value={adv.email} />

          <p
            className={cx("aosco-section-heading", "aosco-section-heading--mt")}
          >
            Account Details
          </p>
          <FieldLine label="Accounts Name:" value={acc.accountsName} />
          <FieldLine
            label="Accounts Process:"
            value={acc.accountsProcess}
            underline={false}
          />
          <FieldLine label="Accounts Email 1:" value={acc.accountsEmail} />

          <p
            className={cx("aosco-section-heading", "aosco-section-heading--mt")}
          >
            Agency Details
          </p>
          <FieldLine label="Agency Name:" value={agency.agencyName} />
          <FieldLine label="Address:" value={agency.addressLine1} />
          <FieldLine label={"\u00A0"} value={agency.addressLine2} />
          <FieldLine label="Contact Name:" value={agency.contactName} />
          <FieldLine label="Phone Number:" value={agency.phone} />
          <FieldLine label="Email Address:" value={agency.email} />
        </section>

        {/* Campaign Booking */}
        <section className="aosco-section">
          <p className="aosco-section-heading">Campaign Booking</p>
          <FieldLine label="Campaign Name:" value={camp.campaignName} />
          <FieldLine label="Reference ID:" value={camp.referenceId} />
          <FieldLine
            label="Site, Size & Type of Selected Billboards:"
            value={camp.siteSizeType}
          />
          <FieldLine label="Type:" value={camp.type} />
          <FieldLine label="Weeks Required:" value={camp.weeksRequired} />
          <FieldLine label="Start Date:" value={camp.startDate} />
          <FieldLine label="End Date:" value={camp.endDate} />
        </section>

        {/* Schedule + Billing */}
        <section className="aosco-section">
          <p className="aosco-section-heading aosco-section-heading--underline">
            Schedule:
          </p>

          <p>
            Schedule Below runs for 6 weeks as planned below across the AOSCO
            Network{" "}
          </p>

          <br />
          <p className="aosco-section-heading aosco-section-heading--underline">
            Billing:
          </p>
          <p className="aosco-section-heading">
            AOSCO is offering a 10% Discount for Upfront Billing from $10,000
            Investment
          </p>

          <BillingTable
            agencyData={agencyData}
            agencyDiscount={h.agencyDiscount}
            campaignStartDate={h.campaignStartDate}
            campaignEndDate={h.campaignEndDate}
            investment={h.investment}
            gstAmount={h.gstAmount}
            totalInvestment={h.totalInvestment}
          />
        </section>

        {/* Special Conditions */}
        <section className="aosco-section">
          <p className="aosco-section-heading aosco-section-heading--underline">
            Special conditions:
          </p>
          <ol className="aosco-sc-list" style={{ listStyleType: "decimal" }}>
            {specialConditions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        </section>

        {/* Execution / signatures */}
        <section className="aosco-section aosco-section--exec">
          <p className="aosco-section-heading">Execution</p>
          <p className="aosco-exec-intro">
            I acknowledge that I have received and read this Agreement, confirm
            that the details contained within (including regarding payments due)
            are correct and hereby agree to be bound to this Agreement and the
            Terms and Conditions as <strong>attached.</strong>
          </p>
          <div className="aosco-exec-grid">
            <div>
              <p className="aosco-exec-col-title">
                Executed on behalf of {adv.companyName || "\u00A0"} by
              </p>
              <FieldLine
                label="Representative Name:"
                value={exec.advertiser.representativeName}
              />
              <FieldLine label="Position:" value={exec.advertiser.position} />
              <FieldLine label="Date:" value={exec.advertiser.date} />
            </div>
            <div>
              <p className="aosco-exec-col-title">
                Executed on behalf of {companyLegalName}
              </p>
              <FieldLine
                label="Representative Name:"
                value={exec.aosco.representativeName}
              />
              <FieldLine label="Position:" value={exec.aosco.position} />
              <FieldLine label="Date:" value={exec.aosco.date} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export const meta = {
  label: "AOSco Quote Agency",
  content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
};

// Single source of truth: every value is read from the DEAL record.
// The billing contact / billing company attached to the quote are ignored.
// The deal lookup is guarded because a quote blueprint preview may not
// have a deal attached.
export const hublDataTemplate = `
  {% set dealData = {} %}
  {% if quoteTemplateContext.deal and quoteTemplateContext.deal.hs_object_id %}
    {% set dealData = crm_object("deal", quoteTemplateContext.deal.hs_object_id, "hs_object_id,dealname,quote_master_data,agency_quote_master_data,agency_discount,campaign_start_date,campaign_end_date,total_commercial_rate,gst_amount,total_investment,advertiser_company,advertiser_contact_first_name,advertiser_contact_last_name,advertiser_person_phone_number,advertiser_person_email_address,agency_company_name,agency_person_first_name,agency_person_last_name,agency_person_email,agency_company_address,agency_address_line_2,agency_person_phone") %}
  {% endif %}

  {% set hublData = {
    "isQuoteBlueprint": isQuoteBlueprint,
    "dealId": dealData.hs_object_id,
    "dealName": dealData.dealname,
    "campaignStartDate": dealData.campaign_start_date,
    "campaignEndDate": dealData.campaign_end_date,
    "totalInvestment": dealData.total_investment,
    "investment": dealData.total_commercial_rate,
    "gstAmount": dealData.gst_amount,
    "scheduleSummaryJson": dealData.quote_master_data,
    "agencyQuoteJson": dealData.agency_quote_master_data,
    "agencyDiscount": dealData.agency_discount,

    "advertiserCompany": dealData.advertiser_company,
    "advertiserFirstName": dealData.advertiser_contact_first_name,
    "advertiserLastName": dealData.advertiser_contact_last_name,
    "advertiserPhone": dealData.advertiser_person_phone_number,
    "advertiserEmail": dealData.advertiser_person_email_address,

    "agencyCompanyName": dealData.agency_company_name,
    "agencyFirstName": dealData.agency_person_first_name,
    "agencyLastName": dealData.agency_person_last_name,
    "agencyEmail": dealData.agency_person_email,
    "agencyPhone": dealData.agency_person_phone,
    "agencyAddress": dealData.agency_company_address,
    "agencyAddressLine2": dealData.agency_address_line_2
  } %}
`;