import React from 'react';

import { fields, type FieldValues } from "./fields";

// Styles live in a shared .css file; `?raw` imports it as a string so it can
// still be injected via <style> (SSR + quote PDF render, no Tailwind here).
// Same stylesheet as the agency templates so all quotes share one look.
import MODULE_CSS from '../../styles/aosco-quote-agency45.css?raw';

import {
  type AccountDetails,
  type AdvertiserDetails,
  type DirectQuoteHublData,
  type Execution,
  type ModuleProps,
  type ScheduleRow,
  COMPANY_LEGAL_NAME,
  DAY_MS,
  DEFAULT_ACCOUNT,
  DEFAULT_ADVERTISER,
  DEFAULT_REFERENCE_ID,
  DEFAULT_SPECIAL_CONDITIONS,
  DEFAULT_STATE,
  DEFAULT_TYPE,
  DIRECT_DEFAULT_EXECUTION,
  DIRECT_DOCUMENT_TITLE,
  FORMAT_WORD,
  GST_RATE,
  HERO_IMAGE_SRC,
  LOGO_SRC,
  NETWORK_SITE_COUNT,
  WEEKDAYS,
  buildDirectSites,
  buildWeekColumns,
  campaignWeeks,
  firstFilled,
  flightingLabel,
  formatCurrency,
  formatDmy,
  formatRate,
  formatReferenceId,
  fullName,
  joinAnd,
  longDateLabel,
  money,
  monthRangeLabel,
  negativeMoney,
  parseDate,
  parseQuoteMasterData,
  plural,
  round2,
  siteSizeTypeLabel,
  toAmount,
  todayInBrisbane,
  uniq,
  uniqueSiteCount,
  DetailCard,
  DirectPlacementsTable,
  GlanceTile,
  ScheduleGrid,
  SectionTitle,
  SignField,
  Stat,
} from '../../common';

export { fields };

type Props = ModuleProps<DirectQuoteHublData, FieldValues>;

// ===========================================================================
// Component — HubSpot quote module entry point
// ===========================================================================

export function Component({ hublData }: Props) {
  const h: DirectQuoteHublData = hublData || ({} as DirectQuoteHublData);
  const data = parseQuoteMasterData(h.scheduleSummaryJson);

  const documentTitle = firstFilled(data.documentTitle, DIRECT_DOCUMENT_TITLE);
  const companyLegalName = firstFilled(data.companyLegalName, COMPANY_LEGAL_NAME);
  const logoSrc = firstFilled(data.logoSrc, LOGO_SRC);
  const heroSrc = firstFilled(data.coverImageSrc, HERO_IMAGE_SRC);

  // -------------------------------------------------------------------------
  // People. Advertiser + Account Details come from the deal's own
  // advertiser_* properties. Priority: deal property -> quote_master_data -> default.
  // -------------------------------------------------------------------------
  const advertiserFullName = fullName(h.advertiserFirstName, h.advertiserLastName);

  const adv: AdvertiserDetails = {
    greetingName: firstFilled(h.advertiserFirstName, data.advertiser?.greetingName, DEFAULT_ADVERTISER.greetingName),
    companyName: firstFilled(h.advertiserCompany, data.advertiser?.companyName), // advertiser_company
    contactName: firstFilled(advertiserFullName, data.advertiser?.contactName),  // first + last name
    phone: firstFilled(h.advertiserPhone, data.advertiser?.phone),               // advertiser_person_phone_number
    email: firstFilled(h.advertiserEmail, data.advertiser?.email),               // advertiser_person_email_address
  };

  const acc: AccountDetails = {
    accountsName: firstFilled(advertiserFullName, data.account?.accountsName),
    accountsProcess: firstFilled(
      data.account?.accountsProcess,
      adv.greetingName ? `Please send to ${adv.greetingName} for distribution and payment` : '',
      DEFAULT_ACCOUNT.accountsProcess,
    ),
    accountsEmail: firstFilled(h.advertiserEmail, data.account?.accountsEmail),
  };

  // -------------------------------------------------------------------------
  // Schedule
  // -------------------------------------------------------------------------
  const schedule: ScheduleRow[] = Array.isArray(data.ad_schedules) ? data.ad_schedules : [];
  const defaultState = firstFilled(data.scheduleMeta?.state, DEFAULT_STATE);
  const sites = buildDirectSites(schedule, defaultState);
  const paidSites = sites.filter((s) => !s.bonus);
  const bonusSites = sites.filter((s) => s.bonus);
  const paidWeeks = paidSites.reduce((n, s) => n + s.weeks.length, 0);
  const bonusWeeks = bonusSites.reduce((n, s) => n + s.weeks.length, 0);

  const bookedTimes = sites.flatMap((s) => s.weeks);
  const firstBooked = bookedTimes.length ? Math.min(...bookedTimes) : null;
  const lastBooked = bookedTimes.length ? Math.max(...bookedTimes) : null;

  const dealStart = parseDate(h.campaignStartDate);
  const dealEnd = parseDate(h.campaignEndDate);
  const startMs = dealStart ?? firstBooked;
  const endMs = dealEnd ?? (lastBooked !== null ? lastBooked + 6 * DAY_MS : null);

  const weekColumns = buildWeekColumns(bookedTimes, dealStart, dealEnd);
  const weekdays = uniq(bookedTimes.map((t) => new Date(t).getUTCDay()));
  const states = uniq(sites.map((s) => s.state).filter(Boolean));

  // -------------------------------------------------------------------------
  // Campaign
  // -------------------------------------------------------------------------
  const campaignName = firstFilled(h.dealName, data.campaign?.campaignName);
  const titleMatch = campaignName.match(/^(.*?)\s*(\([^)]*\))\s*$/);
  const titleMain = titleMatch && titleMatch[1] ? titleMatch[1] : campaignName;
  const titleParen = titleMatch && titleMatch[1] ? titleMatch[2] : '';

  // Incrementing deal number -> "AOS-0000001"
  const referenceId = firstFilled(
    formatReferenceId(h.referenceNumber),
    data.campaign?.referenceId,
    DEFAULT_REFERENCE_ID,
  );

  const siteCount = uniqueSiteCount(sites);
  const isNetwork = siteCount >= NETWORK_SITE_COUNT;
  const localities = uniq(sites.map((s) => s.locality));
  const shortLocalities =
    localities.length > 0 && localities.length <= 2 && localities.every(Boolean) ? localities : [];

  const sitesTile = isNetwork
    ? 'AOSco Network'
    : shortLocalities.length
      ? shortLocalities.join(' + ')
      : siteCount
        ? plural(siteCount, 'site')
        : '';

  const subtitle = [
    titleParen,
    firstFilled(
      data.scheduleMeta?.locality,
      shortLocalities.length ? `${shortLocalities.join(' & ')} ${FORMAT_WORD}` : '',
    ),
  ]
    .filter(Boolean)
    .join(' · ');

  const onAir = bonusWeeks
    ? `${paidWeeks} paid + ${plural(bonusWeeks, 'bonus week')}`
    : paidWeeks
      ? plural(paidWeeks, 'paid week')
      : '';

  const weeksRequired = campaignWeeks(bookedTimes, startMs, endMs);

  // -------------------------------------------------------------------------
  // Money — all from the deal:
  //   actualMarketRate - discount = investment
  //   investment + GST = totalInvestment
  // -------------------------------------------------------------------------
  const marketRate = toAmount(h.actualMarketRate);
  const investment = toAmount(h.investment);
  const discount =
    marketRate !== null && investment !== null ? round2(Math.max(0, marketRate - investment)) : null;
  const gstAmount = toAmount(h.gstAmount) ?? (investment !== null ? round2(investment * GST_RATE) : null);
  // Falls back to investment + GST only if total_investment is empty.
  const totalInvestment =
    toAmount(h.totalInvestment) ?? (investment !== null && gstAmount !== null ? round2(investment + gstAmount) : null);
  const discountRate = discount !== null && marketRate ? discount / marketRate : null;
  const discountRateLabel = discountRate !== null ? formatRate(discountRate) : '';
  const discountLabel = ['Discount', discountRateLabel].filter(Boolean).join(' ');

  const flighting = flightingLabel(startMs, endMs);
  const billedOn = longDateLabel(todayInBrisbane());

  const bonusNote = firstFilled(
    data.scheduleMeta?.bonusNote,
    bonusSites.length
      ? `${joinAnd(uniq(bonusSites.map((s) => s.name)))} ${bonusWeeks === 1 ? 'bonus week' : 'bonus weeks'} supplied as a guaranteed bonus (GTD) at no charge.`
      : '',
  );

  // -------------------------------------------------------------------------
  // Conditions + execution
  // -------------------------------------------------------------------------
  const specialConditions = data.specialConditions ?? DEFAULT_SPECIAL_CONDITIONS;

  const exec: Execution = {
    advertiser: {
      ...DIRECT_DEFAULT_EXECUTION.advertiser,
      ...(data.execution?.advertiser || {}),
      representativeName: firstFilled(data.execution?.advertiser?.representativeName, adv.contactName),
    },
    aosco: { ...DIRECT_DEFAULT_EXECUTION.aosco, ...(data.execution?.aosco || {}) },
  };

  const headLabel = [documentTitle, referenceId].filter(Boolean).join(' · ');

  return (
    <div className="aosco-root">
      <style>{MODULE_CSS}</style>

      {/* ================= cover ================= */}
      <section className="aosco-sheet">
        <img src={logoSrc} alt={companyLegalName} className="aosco-cover-logo" />

        <p className="aosco-eyebrow">{documentTitle}</p>
        <h1 className="aosco-cover-title">{titleMain || ' '}</h1>
        {subtitle && <p className="aosco-cover-sub">{subtitle}</p>}

        <div className="aosco-hero">
          <img src={heroSrc} alt="" />
        </div>
        <p className="aosco-hero-caption">
          AOSco &ndash; Queensland&rsquo;s fastest growing digital billboard network.
        </p>

        <div className="aosco-stats">
          <Stat label="Campaign" value={monthRangeLabel(startMs, endMs)} />
          <Stat label="Sites" value={sitesTile} />
          <Stat label="On air" value={onAir} />
          <Stat
            label="Investment"
            value={investment !== null ? `${formatCurrency(investment, true)} + GST` : ''}
            dark
          />
        </div>

        <div className="aosco-prepared">
          <div>
            <div className="aosco-mini-label">Prepared for</div>
            <p className="aosco-prepared-name">{adv.contactName || ' '}</p>
            <p className="aosco-prepared-org">{adv.companyName}</p>
          </div>
          <div>
            <div className="aosco-mini-label">Prepared by</div>
            <p className="aosco-prepared-name">
              {[exec.aosco.representativeName, exec.aosco.position].filter(Boolean).join(', ')}
            </p>
            <p className="aosco-prepared-org">{companyLegalName}</p>
          </div>
        </div>

        {referenceId && (
          <p className="aosco-ref">
            <strong>Reference ID:</strong> {referenceId}
          </p>
        )}
      </section>

      {/* ================= summary, booking, investment ================= */}
      <section className="aosco-sheet">

        <SectionTitle num="01">Order summary</SectionTitle>
        <p className="aosco-greeting">Dear {adv.greetingName || ' '},</p>
        <p className="aosco-intro">
          Thank you for the opportunity to provide our services to you. This document and the attached
          Terms and Conditions set out the basis on which AOSco provide our services.
        </p>

        <div className="aosco-cols">
          <DetailCard
            title="Advertiser details"
            rows={[
              ['Company', adv.companyName],
              ['Contact', adv.contactName],
              ['Phone', adv.phone],
              ['Email', adv.email],
            ]}
          />
          <DetailCard
            title="Account details"
            rows={[
              ['Accounts name', acc.accountsName],
              ['Accounts process', acc.accountsProcess],
              ['Accounts email', acc.accountsEmail],
            ]}
          />
        </div>

        <SectionTitle num="02">Campaign booking</SectionTitle>
        <DetailCard
          wide
          rows={[
            ['Campaign name', campaignName],
            ['Reference ID', referenceId],
            // "NETWORK" for all 18 sites, otherwise the number of billboards on the schedule
            ['Sites, size & type', firstFilled(data.campaign?.siteSizeType, siteSizeTypeLabel(siteCount))],
            ['Type', firstFilled(data.campaign?.type, DEFAULT_TYPE)],
            // Total campaign length in weeks, bonus weeks included (first to last booked week)
            ['Weeks required', weeksRequired ? plural(weeksRequired, 'week') : ''],
            ['Start date', startMs !== null ? formatDmy(startMs) : ''],
            ['End date', endMs !== null ? formatDmy(endMs) : ''],
          ]}
        />

        <SectionTitle num="03">Investment at a glance</SectionTitle>
        <div className="aosco-glance aosco-glance--five">
          <GlanceTile label="Market rate" value={money(marketRate)} />
          <GlanceTile label={discountLabel} value={negativeMoney(discount)} />
          <GlanceTile
            label="Investment"
            value={investment !== null ? `${money(investment)} + GST` : '—'}
            tone="dark"
          />
          <GlanceTile label={`GST ${formatRate(GST_RATE)}`} value={money(gstAmount)} />
          <GlanceTile label="Total investment inc GST" value={money(totalInvestment)} tone="gold" />
        </div>
        {bonusNote && <p className="aosco-note">{bonusNote}</p>}
      </section>

      {/* ================= campaign schedule (landscape) ================= */}
      <section className="aosco-sheet aosco-sheet--landscape">
        <SectionTitle num="04">Campaign schedule</SectionTitle>

        {sites.length > 0 && weekColumns.length > 0 ? (
          <>
            <div className="aosco-legend">
              <span className="aosco-legend-item">
                <span className="aosco-swatch aosco-swatch--paid" /> Paid week
              </span>
              {bonusSites.length > 0 && (
                <span className="aosco-legend-item">
                  <span className="aosco-swatch aosco-swatch--gtd" /> Guaranteed bonus week (GTD) &ndash; no charge
                </span>
              )}
              <span className="aosco-legend-meta">
                {[
                  `${FORMAT_WORD} large format`,
                  states.join(', '),
                  weekdays.length === 1 ? `All weeks commence ${WEEKDAYS[weekdays[0]]}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
            <ScheduleGrid sites={sites} weeks={weekColumns} />

            <p className="aosco-h3">Placements</p>
            <DirectPlacementsTable sites={sites} />
          </>
        ) : (
          <p>The schedule will be confirmed before the campaign starts.</p>
        )}

        <table className="aosco-table aosco-gap">
          <thead>
            <tr>
              <th>Investment summary</th>
              <th className="num" style={{ width: '22%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Market rate (before discount)</td>
              <td className="num">{money(marketRate)}</td>
            </tr>
            <tr>
              <td>Less discount{discountRateLabel ? ` (${discountRateLabel})` : ''}</td>
              <td className="num">{negativeMoney(discount)}</td>
            </tr>
            <tr>
              <td className="strong">Investment (ex GST)</td>
              <td className="num strong">{money(investment)}</td>
            </tr>
            <tr>
              <td>Plus GST ({formatRate(GST_RATE)})</td>
              <td className="num">{money(gstAmount)}</td>
            </tr>
            <tr className="aosco-table-total">
              <td>Total investment inc GST</td>
              <td className="num">{money(totalInvestment)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ================= billing, conditions, execution ================= */}
      <section className="aosco-sheet">
        <SectionTitle num="05">Billing</SectionTitle>
        {(acc.accountsName || acc.accountsEmail) && (
          <p className="aosco-accounts">
            <strong>Accounts:</strong> {[acc.accountsName, acc.accountsEmail].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="aosco-accounts">
          <strong>Billed upfront:</strong> {billedOn}
        </p>
        {/* One row for the whole campaign: start month to end month. */}
        <table className="aosco-table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Flighting dates</th>
              <th className="num">Market rate</th>
              <th className="num">{discountLabel}</th>
              <th className="num">GST {formatRate(GST_RATE)}</th>
              <th className="num">Total due to AOSco inc GST</th>
            </tr>
          </thead>
          <tbody>
            <tr className="aosco-table-total">
              <td>{flighting || ' '}</td>
              <td className="num">{money(marketRate)}</td>
              <td className="num">{negativeMoney(discount)}</td>
              <td className="num">{money(gstAmount)}</td>
              <td className="num">{money(totalInvestment)}</td>
            </tr>
          </tbody>
        </table>

        <SectionTitle num="06">Special conditions</SectionTitle>
        <ol className="aosco-sc">
          {specialConditions.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ol>

        <SectionTitle num="07">Execution</SectionTitle>
        <p>
          I acknowledge that I have received and read this Agreement, confirm that the details contained
          within (including regarding payments due) are correct and hereby agree to be bound to this
          Agreement and the Terms and Conditions as attached.
        </p>
        <div className="aosco-exec">
          <div>
            <div className="aosco-exec-eyebrow">Executed on behalf of</div>
            <p className="aosco-exec-entity">{adv.companyName || ' '}</p>
            {exec.advertiser.representativeName && (
              <p className="aosco-exec-by">by {exec.advertiser.representativeName}</p>
            )}
            <SignField label="Representative name" value={exec.advertiser.representativeName} />
            <SignField label="Position" value={exec.advertiser.position} />
            <SignField label="Signature" />
            <SignField label="Date" value={exec.advertiser.date} />
          </div>
          <div>
            <div className="aosco-exec-eyebrow">Executed on behalf of</div>
            <p className="aosco-exec-entity">{companyLegalName}</p>
            {exec.aosco.representativeName && (
              <p className="aosco-exec-by">by {exec.aosco.representativeName}</p>
            )}
            <SignField label="Representative name" value={exec.aosco.representativeName} />
            <SignField label="Position" value={exec.aosco.position} />
            <SignField label="Signature" />
            <SignField label="Date" value={exec.aosco.date} />
          </div>
        </div>
      </section>
    </div>
  );
}

export const meta = {
  label: "AOSco Quote",
  content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
};

// Flattened so the React side gets simple, predictable keys (see HublData).
// Every value is read from the DEAL record. The deal lookup is guarded
// because a quote blueprint preview may not have a deal attached.
export const hublDataTemplate = `
  {% set dealData = {} %}
  {% if quoteTemplateContext.deal and quoteTemplateContext.deal.hs_object_id %}
    {% set dealData = crm_object("deal", quoteTemplateContext.deal.hs_object_id, "hs_object_id,dealname,aos_reference_number,quote_master_data,campaign_start_date,campaign_end_date,total_bill_amount_before_discount_total_market_rate,total_commercial_rate,gst_amount,total_investment,advertiser_company,advertiser_person_email_address,advertiser_contact_first_name,advertiser_contact_last_name,advertiser_person_phone_number,reference_number") %}
  {% endif %}

  {% set hublData = {
    "isQuoteBlueprint": isQuoteBlueprint,
    "dealId": dealData.hs_object_id,
    "dealName": dealData.dealname,
    "referenceNumber": dealData.aos_reference_number,
    "campaignStartDate": dealData.campaign_start_date,
    "campaignEndDate": dealData.campaign_end_date,
    "actualMarketRate": dealData.total_bill_amount_before_discount_total_market_rate,
    "totalInvestment": dealData.total_investment,
    "investment": dealData.total_commercial_rate,
    "gstAmount": dealData.gst_amount,
    "referenceNumber": dealData.reference_number,
    "scheduleSummaryJson": dealData.quote_master_data,
    "advertiserCompany": dealData.advertiser_company,
    "advertiserEmail": dealData.advertiser_person_email_address,
    "advertiserFirstName": dealData.advertiser_contact_first_name,
    "advertiserLastName": dealData.advertiser_contact_last_name,
    "advertiserPhone": dealData.advertiser_person_phone_number
  } %}
`;
