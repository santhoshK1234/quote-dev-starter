// JSON deal properties can arrive as a JSON string (normal), an already-parsed
// object, an HTML-escaped string (&quot;…) or a double-encoded JSON string.
export function parseJsonProperty<T extends object>(raw: unknown): Partial<T> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Partial<T>;

  const tryParse = (text: string): unknown => {
    try {
      let parsed: unknown = JSON.parse(text);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); // double-encoded
      return parsed;
    } catch {
      return null;
    }
  };

  const text = String(raw).trim();
  let parsed = tryParse(text);
  if (!parsed) {
    const decoded = text
      .replace(/&quot;|&#34;|&#x22;/g, '"')
      .replace(/&#39;|&#x27;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    parsed = tryParse(decoded);
  }
  return typeof parsed === 'object' && parsed !== null ? (parsed as Partial<T>) : {};
}
