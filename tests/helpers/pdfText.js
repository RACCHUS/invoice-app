import { Buffer } from 'node:buffer';
import { inflateSync } from 'node:zlib';

// jsPDF compresses page content, so inflate every stream to inspect the drawn text.
export const pdfText = pdf => {
  const raw = Buffer.from(pdf.output('arraybuffer'));
  const latin = raw.toString('latin1');
  const parts = [];
  const pattern = /(?<!end)stream\r?\n/g;
  let match;
  while ((match = pattern.exec(latin))) {
    const start = match.index + match[0].length;
    const end = latin.indexOf('endstream', start);
    if (end < 0) break;
    try {
      parts.push(inflateSync(raw.subarray(start, end)).toString('latin1'));
    } catch {
      parts.push(latin.slice(start, end));
    }
    pattern.lastIndex = end;
  }
  return parts.join('\n');
};
