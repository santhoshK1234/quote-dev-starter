import {
  ModuleFields,
  TextField,
} from '@hubspot/cms-components/fields';

export interface FieldValues {
  client_name: string;
  campaign_name: string;
}

export const fields = (
  <ModuleFields>
    <TextField
      name="client_name"
      label="Client Name"
      default="University of Arizona"
    />

    <TextField
      name="campaign_name"
      label="Campaign Name"
      default="Spring Advertising Campaign"
    />
  </ModuleFields>
);