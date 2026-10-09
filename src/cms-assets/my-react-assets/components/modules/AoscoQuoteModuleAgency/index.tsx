import React from "react";

import { fields, type FieldValues } from "./fields";

// Styles live in a shared .css file; `?raw` imports it as a string so it can
// still be injected via <style> (SSR + quote PDF render, no Tailwind here).
import MODULE_CSS from '../../styles/aosco-quote-agency45.css?raw';

import {
  type AgencyQuoteHublData,
  type ModuleProps,
  AGENCY_BILLING_DAYS_EOM,
  AGENCY_DEFAULT_EXECUTION,
  AGENCY_DOCUMENT_TITLE,
  COMPANY_LEGAL_NAME,
  DAY_MS,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_STATE,
  DEFAULT_TYPE,
  FORMAT_WORD,
  GST_RATE,
  HERO_IMAGE_SRC,
  LOGO_SRC,
  NETWORK_SITE_COUNT,
  WEEKDAYS,
  billingCycleHeader,
  billingDateLabel,
  buildAgencySites,
  buildWeekColumns,
  dealBillingRows,
  defaultAgencySpecialConditions,
  firstFilled,
  formatCurrency,
  formatDmy,
  formatRate,
  formatReferenceId,
  fullName,
  joinAnd,
  money,
  monthlyBillingRows,
  monthRangeLabel,
  negativeMoney,
  parseAgencyQuoteMasterData,
  parseDate,
  parseQuoteMasterData,
  plural,
  round2,
  sumRows,
  toAmount,
  toRate,
  uniq,
  AgencyPlacementsTable,
  DetailCard,
  GlanceTile,
  ScheduleGrid,
  SectionTitle,
  SignField,
  Stat,
} from '../../common';

export { fields };

type Props = ModuleProps<AgencyQuoteHublData, FieldValues>;

// ===========================================================================
// Component — HubSpot quote module entry point
// ===========================================================================

export function Component({ hublData }: Props) {
  const h: AgencyQuoteHublData = hublData || ({} as AgencyQuoteHublData);
  const data = parseQuoteMasterData(h.scheduleSummaryJson);
  const agencyData = parseAgencyQuoteMasterData(h.agencyQuoteJson);

  const documentTitle = firstFilled(data.documentTitle, AGENCY_DOCUMENT_TITLE);
  const companyLegalName = firstFilled(data.companyLegalName, COMPANY_LEGAL_NAME);
  const logoSrc = firstFilled(data.logoSrc, LOGO_SRC);
  const heroSrc = firstFilled(data.coverImageSrc, HERO_IMAGE_SRC);

  // -------------------------------------------------------------------------
  // People. Priority: deal property -> quote_master_data -> default.
  // The agency contact (when there is one) is the person the order is
  // addressed to, signs it, and receives the invoices.
  // -------------------------------------------------------------------------
  const adv = {
    companyName: firstFilled(h.advertiserCompany, data.advertiser?.companyName),
    contactName: firstFilled(fullName(h.advertiserFirstName, h.advertiserLastName), data.advertiser?.contactName),
    phone: firstFilled(h.advertiserPhone, data.advertiser?.phone),
    email: firstFilled(h.advertiserEmail, data.advertiser?.email),
  };

  const agency = {
    name: firstFilled(h.agencyCompanyName, data.agency?.agencyName),
    shortName: firstFilled(data.agency?.shortName),
    address: [
      firstFilled(h.agencyAddress, data.agency?.addressLine1),
      firstFilled(h.agencyAddressLine2, data.agency?.addressLine2),
    ]
      .filter(Boolean)
      .join(", "),
    contactName: firstFilled(fullName(h.agencyFirstName, h.agencyLastName), data.agency?.contactName),
    phone: firstFilled(h.agencyPhone, data.agency?.phone),
    email: firstFilled(h.agencyEmail, data.agency?.email),
  };

  const primary = agency.contactName
    ? {
        name: agency.contactName,
        first: firstFilled(h.agencyFirstName, agency.contactName.split(" ")[0]),
        email: agency.email,
      }
    : {
        name: adv.contactName,
        first: firstFilled(h.advertiserFirstName, data.advertiser?.greetingName, adv.contactName.split(" ")[0]),
        email: adv.email,
      };
  const greetingName = firstFilled(primary.first, data.advertiser?.greetingName, "Customer");
  const accounts = {
    name: firstFilled(primary.name, data.account?.accountsName),
    email: firstFilled(primary.email, data.account?.accountsEmail),
  };

  // -------------------------------------------------------------------------
  // Schedule
  // -------------------------------------------------------------------------
  const defaultState = firstFilled(data.scheduleMeta?.state, DEFAULT_STATE);
  const sites = buildAgencySites(data, agencyData, defaultState);
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
  const titleParen = titleMatch && titleMatch[1] ? titleMatch[2] : "";

  // Incrementing deal number (reference_number) -> "AOS-0000001"
  const referenceId = firstFilled(
    formatReferenceId(h.referenceNumber),
    data.campaign?.referenceId,
    h.dealId ? `AOS-${firstFilled(h.dealId)}` : "",
  );

  const uniqueSiteCount = new Set(sites.map((s) => (s.code || s.name).toLowerCase())).size;
  const isNetwork = uniqueSiteCount >= NETWORK_SITE_COUNT;
  const localities = uniq(sites.map((s) => s.locality));
  const shortLocalities =
    localities.length > 0 && localities.length <= 2 && localities.every(Boolean) ? localities : [];

  const sitesTile = isNetwork
    ? "AOSco Network"
    : shortLocalities.length
      ? shortLocalities.join(" + ")
      : uniqueSiteCount
        ? plural(uniqueSiteCount, "site")
        : "";

  const subtitle = [
    titleParen,
    firstFilled(
      data.scheduleMeta?.locality,
      shortLocalities.length ? `${shortLocalities.join(" & ")} ${FORMAT_WORD}` : "",
    ),
  ]
    .filter(Boolean)
    .join(" \u00B7 ");

  const onAir = bonusWeeks
    ? `${paidWeeks} paid + ${plural(bonusWeeks, "bonus week")}`
    : paidWeeks
      ? plural(paidWeeks, "paid week")
      : "";

  const weeksRequired = bonusWeeks
    ? `${plural(paidWeeks + bonusWeeks, "week")} (${paidWeeks} paid + ${bonusWeeks} guaranteed bonus)`
    : paidWeeks
      ? plural(paidWeeks, "week")
      : "";

  const sitesBooking = firstFilled(
    data.campaign?.siteSizeType,
    isNetwork
      ? "NETWORK \u2013 as per schedule"
      : sites.length
        ? `As per schedule: ${joinAnd(
            sites.map(
              (s) =>
                `${s.name} (${[s.code, s.bonus ? "guaranteed bonus" : "paid"].filter(Boolean).join(", ")})`,
            ),
          )}`
        : "",
  );

  // -------------------------------------------------------------------------
  // Money
  // -------------------------------------------------------------------------
  const configuredRate = toRate(h.agencyDiscount);
  const marketRate = toAmount(h.actualMarketRate);
  const monthRows = monthlyBillingRows(agencyData, sites, AGENCY_BILLING_DAYS_EOM);
  const billingRows = monthRows.length
    ? monthRows
    : dealBillingRows(h.investment, marketRate, configuredRate ?? DEFAULT_COMMISSION_RATE, startMs, endMs, AGENCY_BILLING_DAYS_EOM);
  const totals = sumRows(billingRows);

  // Both the discount and the agency commission are taken off the market rate:
  //   actualMarketRate - discount - agency commission = investment
  //   investment + GST = totalInvestment
  // Deal amounts win; the billing rows fill any gaps.
  const investment = toAmount(h.investment) ?? totals?.net ?? null;
  const commission = totals?.commission ?? null;
  const discount =
    marketRate !== null && investment !== null
      ? round2(Math.max(0, marketRate - investment - (commission ?? 0)))
      : null;
  const gstAmount = toAmount(h.gstAmount) ?? (investment !== null ? round2(investment * GST_RATE) : null);
  const totalInvestment =
    toAmount(h.totalInvestment) ?? (investment !== null && gstAmount !== null ? round2(investment + gstAmount) : null);
  const discountRate = discount !== null && marketRate ? discount / marketRate : null;

  // Agency % is deal.agency_discount, else commission / market rate. Never
  // commission / (investment + commission): that ignores the other discount (10% -> 11.11%).
  const commissionRate =
    configuredRate ??
    (marketRate && commission !== null
      ? commission / marketRate
      : monthRows.length
        ? null
        : DEFAULT_COMMISSION_RATE);
  const rateLabel = commissionRate !== null ? formatRate(commissionRate) : "";
  const discountRateLabel = discountRate !== null ? formatRate(discountRate) : "";
  const agencyPrefix = agency.shortName || "Agency";
  const commissionLabel = [`${agencyPrefix} commission`, rateLabel].filter(Boolean).join(" ");
  const discountLabel = ["Discount", discountRateLabel].filter(Boolean).join(" ");

  const bonusNote = firstFilled(
    data.scheduleMeta?.bonusNote,
    bonusSites.length
      ? `${joinAnd(bonusSites.map((s) => s.name))} ${bonusWeeks === 1 ? "bonus week" : "bonus weeks"} supplied as a guaranteed bonus (GTD) at no charge.`
      : "",
  );

  // -------------------------------------------------------------------------
  // Conditions + execution
  // -------------------------------------------------------------------------
  const specialConditions = data.specialConditions ?? defaultAgencySpecialConditions(agency.name, AGENCY_BILLING_DAYS_EOM);

  const execAdvertiser = {
    ...AGENCY_DEFAULT_EXECUTION.advertiser,
    ...(data.execution?.advertiser || {}),
    representativeName: firstFilled(data.execution?.advertiser?.representativeName, primary.name),
  };
  const execAosco = { ...AGENCY_DEFAULT_EXECUTION.aosco, ...(data.execution?.aosco || {}) };
  const advertiserEntity = firstFilled(
    data.execution?.advertiser?.onBehalfOf,
    adv.companyName,
    agency.name,
  );

  const headLabel = [documentTitle, referenceId].filter(Boolean).join(" \u00B7 ");

  return (
    <div className="aosco-root">
      <style>{MODULE_CSS}</style>

      {/* ================= cover ================= */}
      <section className="aosco-sheet">
        <img src={logoSrc} alt={companyLegalName} className="aosco-cover-logo" />

        <p className="aosco-eyebrow">{documentTitle}</p>
        <h1 className="aosco-cover-title">{titleMain || "\u00A0"}</h1>
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
            value={investment !== null ? `${formatCurrency(investment, true)} + GST` : ""}
            dark
          />
        </div>

        <div className="aosco-prepared">
          <div>
            <div className="aosco-mini-label">Prepared for</div>
            <p className="aosco-prepared-name">{primary.name || "\u00A0"}</p>
            <p className="aosco-prepared-org">{adv.companyName || agency.name}</p>
          </div>
          <div>
            <div className="aosco-mini-label">Prepared by</div>
            <p className="aosco-prepared-name">
              {[execAosco.representativeName, execAosco.position].filter(Boolean).join(", ")}
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
        <p className="aosco-greeting">Dear {greetingName},</p>
        <p className="aosco-intro">
          Thank you for the opportunity to provide our services to you. This Advertising Order and the
          attached Terms and Conditions set out the basis on which AOSco provide our services.
        </p>

        <div className="aosco-cols">
          <DetailCard
            title="Advertiser details"
            rows={[
              ["Company", adv.companyName],
              ["Contact", adv.contactName || "N/A"],
              ["Phone", adv.phone],
              ["Email", adv.email],
            ]}
          />
          <DetailCard
            title="Agency details"
            rows={[
              ["Agency", agency.name],
              ["Address", agency.address],
              ["Contact", agency.contactName],
              ["Phone", agency.phone],
              ["Email", agency.email],
            ]}
          />
          <DetailCard
            title="Account details"
            rows={[
              ["Accounts contact", accounts.name],
              ["Accounts email", accounts.email],
            ]}
          />
        </div>

        <SectionTitle num="02">Campaign booking</SectionTitle>
        <DetailCard
          wide
          rows={[
            ["Campaign name", campaignName],
            ["Reference ID", referenceId],
            ["Sites, size & type", sitesBooking],
            ["Type", firstFilled(data.campaign?.type, DEFAULT_TYPE)],
            ["Weeks required", weeksRequired],
            ["Start date", startMs !== null ? formatDmy(startMs) : ""],
            ["End date", endMs !== null ? formatDmy(endMs) : ""],
          ]}
        />

        <SectionTitle num="03">Investment at a glance</SectionTitle>
        <div className="aosco-glance aosco-glance--six">
          <GlanceTile label="Market rate" value={money(marketRate)} />
          <GlanceTile label={discountLabel} value={negativeMoney(discount)} />
          <GlanceTile label={commissionLabel} value={negativeMoney(commission)} />
          <GlanceTile
            label="Investment"
            value={investment !== null ? `${money(investment)} + GST` : "\u2014"}
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
                  states.join(", "),
                  weekdays.length === 1 ? `All weeks commence ${WEEKDAYS[weekdays[0]]}` : "",
                ]
                  .filter(Boolean)
                  .join(" \u00B7 ")}
              </span>
            </div>
            <ScheduleGrid sites={sites} weeks={weekColumns} />

            <p className="aosco-h3">Placements</p>
            <AgencyPlacementsTable
              sites={sites}
              discountRate={discountRate}
              discountLabel={discountLabel}
              commissionLabel={commissionLabel}
            />
          </>
        ) : (
          <p>The schedule will be confirmed before the campaign starts.</p>
        )}

        <table className="aosco-table aosco-gap">
          <thead>
            <tr>
              <th>Investment summary</th>
              <th className="num" style={{ width: "22%" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Market rate (before discounts)</td>
              <td className="num">{money(marketRate)}</td>
            </tr>
            <tr>
              <td>Less discount{discountRateLabel ? ` (${discountRateLabel})` : ""}</td>
              <td className="num">{negativeMoney(discount)}</td>
            </tr>
            <tr>
              <td>
                Less {agency.shortName ? `${agency.shortName} ` : ""}agency commission{rateLabel ? ` (${rateLabel})` : ""}
              </td>
              <td className="num">{negativeMoney(commission)}</td>
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
        {(accounts.name || accounts.email) && (
          <p className="aosco-accounts">
            <strong>Accounts:</strong> {[accounts.name, accounts.email].filter(Boolean).join(" \u00B7 ")}
          </p>
        )}
        <table className="aosco-table">
          <thead>
            <tr>
              <th style={{ width: "13%" }}>Flighting dates</th>
              <th style={{ width: "17%" }}>{billingCycleHeader(AGENCY_BILLING_DAYS_EOM)}</th>
              <th className="num">Rate after discount</th>
              <th className="num">{commissionLabel}</th>
              <th className="num">Total (less agency comm)</th>
              <th className="num">GST {formatRate(GST_RATE)}</th>
              <th className="num">Total due to AOSco inc GST</th>
            </tr>
          </thead>
          <tbody>
            {billingRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="aosco-table-small">
                  Billing will be confirmed with the final schedule.
                </td>
              </tr>
            ) : (
              billingRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.flighting || "\u00A0"}</td>
                  <td>{billingDateLabel(row.billing)}</td>
                  <td className="num">{money(row.investment)}</td>
                  <td className="num">{money(row.commission)}</td>
                  <td className="num">{money(row.net)}</td>
                  <td className="num">{money(row.gst)}</td>
                  <td className="num">{money(row.total)}</td>
                </tr>
              ))
            )}
            <tr className="aosco-table-total">
              <td colSpan={6} className="num">Campaign total</td>
              <td className="num">{money(totals?.total)}</td>
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
            <p className="aosco-exec-entity">{advertiserEntity || "\u00A0"}</p>
            {execAdvertiser.representativeName && (
              <p className="aosco-exec-by">by {execAdvertiser.representativeName}</p>
            )}
            <SignField label="Representative name" value={execAdvertiser.representativeName} />
            <SignField label="Position" value={execAdvertiser.position} />
            <SignField label="Signature" />
            <SignField label="Date" value={execAdvertiser.date} />
          </div>
          <div>
            <div className="aosco-exec-eyebrow">Executed on behalf of</div>
            <p className="aosco-exec-entity">{companyLegalName}</p>
            {execAosco.representativeName && (
              <p className="aosco-exec-by">by {execAosco.representativeName}</p>
            )}
            <SignField label="Representative name" value={execAosco.representativeName} />
            <SignField label="Position" value={execAosco.position} />
            <SignField label="Signature" />
            <SignField label="Date" value={execAosco.date} />
          </div>
        </div>
      </section>
    </div>
  );
}

export const meta = {
  label: "AOSco Quote Agency",
  content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
};

// Single source of truth: every value is read from the DEAL record.
// The deal lookup is guarded because a quote blueprint preview may not
// have a deal attached.
export const hublDataTemplate = `
  {% set dealData = {} %}
  {% if quoteTemplateContext.deal and quoteTemplateContext.deal.hs_object_id %}
    {% set dealData = crm_object("deal", quoteTemplateContext.deal.hs_object_id, "hs_object_id,dealname,quote_master_data,agency_quote_master_data,agency_discount,campaign_start_date,campaign_end_date,total_commercial_rate,gst_amount,total_investment,advertiser_company,advertiser_contact_first_name,advertiser_contact_last_name,advertiser_person_phone_number,advertiser_person_email_address,agency_company_name,agency_person_first_name,agency_person_last_name,agency_person_email,agency_company_address,agency_address_line_2,agency_person_phone,total_bill_amount_before_discount_total_market_rate,reference_number") %}
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
    "actualMarketRate": dealData.total_bill_amount_before_discount_total_market_rate,
    "scheduleSummaryJson": dealData.quote_master_data,
    "agencyQuoteJson": dealData.agency_quote_master_data,
    "agencyDiscount": dealData.agency_discount,
    "referenceNumber": dealData.reference_number,

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