import { useEffect, useState } from 'react';
import { RichTextFieldWrapper } from '@hubspot/cms-components';
import { useQuoteAcceptance } from '@hubspot/quote-dev-sdk';
import styles from '../TermsAcceptance.module.css';

export default function TermsAcceptance({
  heading,
  termsText,
  disabledReason,
  isInEditor = false,
}: {
  heading: string;
  termsText: string;
  disabledReason: string;
  isInEditor?: boolean;
}) {
  const { loading, error, data, control } = useQuoteAcceptance();
  // Fetch the initial agreement state from an external data store here,
  // e.g. GET from a Serverless Function or External API.
  const [agreed, setAgreed] = useState(false);
  const isAccepted = data?.accepted ?? false;

  useEffect(() => {
    if (isInEditor) return;
    if (agreed) {
      control.enable();
    } else {
      control.disable({ reason: disabledReason });
    }
  }, [agreed, control, disabledReason, isInEditor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInEditor) return;
    setAgreed(e.target.checked);
    // Write the agreement state to an external data store here,
    // e.g. POST to a Serverless Function or External API.
  };

  const isLoading = !isInEditor && loading;
  const hasError = !isInEditor && error;
  const isReady = isInEditor || (!loading && !error);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{heading}</h2>

      {isLoading && (
        <div className={styles.statusMessage}>
          <div className={styles.spinner} />
          Loading…
        </div>
      )}

      {hasError && (
        <div className={styles.statusMessage}>
          Error loading acceptance data. Please try again later.
        </div>
      )}

      {isReady && (
        <>
          <RichTextFieldWrapper tag="div" fieldValue={termsText} className={styles.terms} />

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={agreed || isAccepted}
              disabled={isAccepted}
              onChange={handleChange}
            />
            I agree to the terms and conditions of this quote.
          </label>
        </>
      )}
    </div>
  );
}
