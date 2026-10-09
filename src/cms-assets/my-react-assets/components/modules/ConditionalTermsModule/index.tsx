import React from 'react';

import { fields, type FieldValues } from "./fields";

// Styles live in a shared .css file; `?raw` imports it as a string so it can
// still be injected via <style> (SSR + quote PDF render, no Tailwind here).
import MODULE_CSS from '../../styles/aosco-terms.css?raw';

import {
  type BaseHublData,
  type ModuleProps,
  TERMS_AND_CONDITIONS,
  NestedItems,
} from '../../common';

export { fields };

/**
 * AOSCO Terms & Conditions — standalone HubSpot custom quote module.
 *
 * Extracted from the combined AOSco Quote module so it can sit in the
 * quote's own "Terms" section slot instead of inside the main module.
 * Content is the full 20-clause Terms & Conditions of Business, static
 * and identical for every quote — nothing here is deal-specific, so
 * hublDataTemplate only passes through isQuoteBlueprint.
 */

type Props = ModuleProps<BaseHublData, FieldValues>;

// ---------------------------------------------------------------------------
// Component — HubSpot quote module entry point
// ---------------------------------------------------------------------------

export function Component({ hublData }: Props) {
  return (
    <div className="aosco-terms-root">
      <style>{MODULE_CSS}</style>

      <h2 className="aosco-terms-heading">Terms &amp; Conditions of Business</h2>
      <ol className="aosco-terms-list" style={{ listStyleType: 'decimal' }}>
        {TERMS_AND_CONDITIONS.map((clause, i) => (
          <li key={i} className="aosco-terms-item">
            <span className="aosco-terms-item-title">{clause.title}</span>
            {clause.body && <p className="aosco-terms-item-body">{clause.body}</p>}
            {clause.definitions && (
              <dl className="aosco-terms-defs">
                {clause.definitions.map(([term, def], j) => (
                  <div key={j}>
                    <dt className="aosco-terms-def-term" style={{ display: 'inline' }}>&ldquo;{term}&rdquo;</dt>{' '}
                    <dd className="aosco-terms-def-text" style={{ display: 'inline', margin: 0 }}>{def}</dd>
                  </div>
                ))}
              </dl>
            )}
            <NestedItems items={clause.items} />
          </li>
        ))}
      </ol>
    </div>
  );
}

export const meta = {
  label: "AOSco Terms & Conditions",
  content_types: ["QUOTE", "QUOTE_BLUEPRINT"],
};

export const hublDataTemplate = `
  {% set hublData = {
    "isQuoteBlueprint": isQuoteBlueprint
  } %}
`;