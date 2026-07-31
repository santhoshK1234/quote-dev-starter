# RequiredAgreementModule

An example quote module that demonstrates **using `useQuoteAcceptance` from `@hubspot/quote-dev-sdk` to control whether quote acceptance is enabled**, requiring the buyer to agree to terms before they can accept.

## What it demonstrates

The module renders a configurable terms block with a checkbox. Acceptance is disabled until the buyer checks the box, using the SDK's `FeatureControl` API:

- **`useQuoteAcceptance()`** — subscribes to live acceptance state (`loading`, `error`, `data`, `control`).
- **`control.disable({ reason })`** — disables acceptance with a message shown in the quote UI.
- **`control.enable()`** — re-enables acceptance when the checkbox is checked.
- **`data.accepted`** — once the quote is accepted, the checkbox is locked so it cannot be unchecked.

The module also shows how to handle the `loading` and `error` states from the hook, and how to render a representative preview in the editor (where the hook has no live data).

## Files

| File | Responsibility |
| --- | --- |
| [`index.tsx`](./index.tsx) | The `Component`, editor detection via `useEditorVariableChecks`, Island hydration, and `meta`. |
| [`fields.tsx`](./fields.tsx) | The editor `fields` (heading, terms rich text, disabled reason) and `FieldValues` type. |
| [`islands/TermsAcceptance.tsx`](./islands/TermsAcceptance.tsx) | The client-side island: calls `useQuoteAcceptance`, renders the terms and checkbox, toggles acceptance enablement. |
| [`TermsAcceptance.module.css`](./TermsAcceptance.module.css) | Scoped styles using cpq-theme CSS custom properties. |

## How controlling acceptance enablement works

1. On mount, the island calls `control.disable({ reason })` with the configured disabled reason, preventing quote acceptance.
2. When the buyer checks the checkbox, `control.enable()` is called, allowing the quote to be accepted.
3. If the buyer unchecks the box, `control.disable()` is called again, preventing acceptance.
4. Once the quote is accepted (`data.accepted === true`), the checkbox is locked — the buyer can no longer uncheck it.

## Extending this example

- **Persist agreement state externally** — the `handleChange` callback includes a comment showing where to POST to a Serverless Function or External API to record the agreement.
- **Pre-populate agreement state** — the `useState(false)` initializer includes a comment showing where to fetch prior agreement state from an external store.
- **Add more fields** — the terms text is a `RichTextField`, so the quote editor can customize the language per-template. Add more fields in [`fields.tsx`](./fields.tsx) as needed.
