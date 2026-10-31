import React from 'react';
import { presentLines } from '../utils/invoiceData';

// Renders a titled block of lines, skipping blank values; renders nothing when every value is blank.
export default function DetailBlock({ title, values }) {
  const lines = presentLines(...values);
  if (!lines.length) return null;
  return (
    <div className="invoice-details-section">
      <strong>{title}:</strong>
      {lines.map((line, index) => (
        <React.Fragment key={index}><br />{line}</React.Fragment>
      ))}
    </div>
  );
}
