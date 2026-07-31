import { Island, useEditorVariableChecks } from '@hubspot/cms-components';
// @ts-expect-error -- ?island not typed
import TermsAcceptanceIsland from './islands/TermsAcceptance?island';
import TermsAcceptance from './islands/TermsAcceptance';
import type { FieldValues } from './fields';

export { fields } from './fields';

interface Props {
  fieldValues: FieldValues;
}

export function Component({ fieldValues }: Props) {
  const { is_in_editor: isInEditor } = useEditorVariableChecks();

  const props = {
    heading: fieldValues.heading,
    termsText: fieldValues.termsText,
    disabledReason: fieldValues.disabledReason,
    isInEditor,
  };

  if (isInEditor) {
    return <TermsAcceptance {...props} />;
  }

  return <Island module={TermsAcceptanceIsland} hydrateOn="load" {...props} />;
}

export const meta = {
  label: 'Required Agreement',
  content_types: ['QUOTE', 'QUOTE_BLUEPRINT'],
};
