// ===========================================================================
// HubSpot module types
// ===========================================================================

// A raw CRM property value as HubL hands it to React.
export type CrmValue = string | number | null | undefined;

// Props every HubSpot quote module Component receives.
export interface ModuleProps<THublData, TFieldValues> {
  fieldValues: TFieldValues;
  hublData: THublData;
}

export interface BaseHublData {
  isQuoteBlueprint: boolean;
}

// AoscoQuoteModule. Must match the keys built in that module's
// hublDataTemplate. Everything comes from the DEAL record only.
export interface DirectQuoteHublData extends BaseHublData {
  // Deal
  dealId?: CrmValue;
  dealName?: CrmValue;
  referenceNumber?: CrmValue; // aos_reference_number — incrementing number, shown as AOS-0000001
  campaignStartDate?: CrmValue;
  campaignEndDate?: CrmValue;
  scheduleSummaryJson?: unknown; // quote_master_data

  // Deal — money
  //   actualMarketRate - discount = investment
  //   investment + gstAmount = totalInvestment
  actualMarketRate?: CrmValue; // total_bill_amount_before_discount_total_market_rate (before discount)
  investment?: CrmValue;       // total_commercial_rate (ex GST, after discount)
  gstAmount?: CrmValue;        // gst_amount
  totalInvestment?: CrmValue;  // total_investment (incl GST)

  // Deal — advertiser details (used for Advertiser + Account Details)
  advertiserCompany?: CrmValue;   // advertiser_company
  advertiserEmail?: CrmValue;     // advertiser_person_email_address
  advertiserFirstName?: CrmValue; // advertiser_contact_first_name
  advertiserLastName?: CrmValue;  // advertiser_contact_last_name
  advertiserPhone?: CrmValue;     // advertiser_person_phone_number
}

// AoscoQuoteModuleAgency / AoscoQuoteModuleAgency45. Must match the keys
// built in those modules' hublDataTemplate. Everything comes from the DEAL
// record only (single source of truth).
export interface AgencyQuoteHublData extends BaseHublData {
  dealId?: CrmValue;
  dealName?: CrmValue;
  referenceNumber?: CrmValue; // reference_number — incrementing number, shown as AOS-0000001
  campaignStartDate?: CrmValue;
  campaignEndDate?: CrmValue;
  scheduleSummaryJson?: unknown; // quote_master_data
  agencyQuoteJson?: unknown; // agency_quote_master_data
  agencyDiscount?: CrmValue; // agency_discount (0.3 or 30 both mean 30%)

  // actualMarketRate - discount - agency commission = investment
  // investment + gstAmount = totalInvestment
  actualMarketRate?: CrmValue; // total_bill_amount_before_discount_total_market_rate (before all discounts)
  investment?: CrmValue; // total_commercial_rate (ex GST, after discount and agency commission)
  gstAmount?: CrmValue;
  totalInvestment?: CrmValue;

  advertiserCompany?: CrmValue;
  advertiserFirstName?: CrmValue;
  advertiserLastName?: CrmValue;
  advertiserPhone?: CrmValue;
  advertiserEmail?: CrmValue;

  agencyCompanyName?: CrmValue;
  agencyFirstName?: CrmValue;
  agencyLastName?: CrmValue;
  agencyEmail?: CrmValue;
  agencyPhone?: CrmValue;
  agencyAddress?: CrmValue;
  agencyAddressLine2?: CrmValue;
}
