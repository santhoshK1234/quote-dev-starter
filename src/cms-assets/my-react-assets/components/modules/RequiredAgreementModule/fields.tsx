import { ModuleFields, TextField, RichTextField } from '@hubspot/cms-components/fields';

export interface FieldValues {
  heading: string;
  termsText: string;
  disabledReason: string;
}

export const fields = (
  <ModuleFields>
    <TextField
      name="heading"
      label="Heading"
      default="Terms & Conditions"
    />
    <RichTextField
      name="termsText"
      label="Terms and Conditions"
      default="<p>By accepting this quote, you agree to the terms and conditions outlined herein. All pricing is valid for 30 days from the date of issue.</p>"
    />
    <TextField
      name="disabledReason"
      label="Disabled Reason"
      default="You must agree to the terms before accepting this quote."
    />
  </ModuleFields>
);
