// A clause's nested list item is either plain text or a sub-list with its
// own text and further nested items (used for a/b/c -> i/ii/iii numbering).
export type NestedItem = string | { text: string; items?: NestedItem[] };

export interface Clause {
  title: string;
  body?: string;
  definitions?: Array<[term: string, definition: string]>;
  items?: NestedItem[];
}
