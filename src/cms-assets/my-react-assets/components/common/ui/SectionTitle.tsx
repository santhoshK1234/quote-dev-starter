import React from 'react';

export function SectionTitle({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <h2 className="aosco-h2">
      <span className="aosco-h2-num">{num}</span>
      <span>{children}</span>
    </h2>
  );
}
