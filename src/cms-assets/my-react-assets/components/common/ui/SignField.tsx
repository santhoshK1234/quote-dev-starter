export function SignField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="aosco-sign">
      <div className="aosco-mini-label">{label}</div>
      <div className="aosco-sign-value">{value || ' '}</div>
    </div>
  );
}
