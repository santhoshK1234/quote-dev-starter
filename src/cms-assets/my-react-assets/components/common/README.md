# common

Shared code for every quote module in `components/modules/`. Modules import from the barrel:

```ts
import { firstFilled, GST_RATE, ScheduleGrid, type QuoteMasterData } from '../../common';
```

## Layout

| Folder       | What goes here                                                              | May import from               |
| ------------ | --------------------------------------------------------------------------- | ----------------------------- |
| `types/`     | Interfaces only: HubL data shapes, deal JSON shapes, site and billing rows.   | `types/`                      |
| `constants/` | Fixed values and default copy: brand, business rules, legal text, defaults.  | `types/`                      |
| `utils/`     | Generic helpers with no AOSco knowledge: strings, numbers, money, dates, JSON. | `types/`, `constants/`        |
| `quote/`     | AOSco quote logic: parsing deal JSON, building sites, schedule, billing.     | `types/`, `constants/`, `utils/` |
| `ui/`        | Presentational React pieces that render the `aosco-*` CSS classes.           | everything above              |

Dependencies only point down the table, so there are no import cycles. Inside `common/`, import from the specific file (`'../utils/dates'`), not from the barrel.

## What stays in a module

HubSpot reads these from each module's own `index.tsx` and `fields.tsx`, so keep them there:

- `Component`, `meta`, `hublDataTemplate`, `fields`
- the `?raw` stylesheet import

The module's `HublData` interface lives in `types/hubspot.ts`, and **it must match the keys in that module's `hublDataTemplate`**. Update both together.

## Adding a new quote module

1. Create `components/modules/<Name>/` with `index.tsx` and `fields.tsx`.
2. Reuse `DirectQuoteHublData` / `AgencyQuoteHublData`, or add a new interface to `types/hubspot.ts` if the module reads different deal properties.
3. Build the page from `quote/` helpers and `ui/` pieces. If you write something that a second module could use, put it in `common/` rather than in the module.
4. Put module-specific defaults (titles, special conditions, billing terms) in a new file under `constants/` and export it from `constants/index.ts`.
