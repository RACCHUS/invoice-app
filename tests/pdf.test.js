import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { generateInvoicePDF } from '../src/utils/pdfGenerator.js';
import { cleanText, presentLines } from '../src/utils/invoiceData.js';
import { pdfText } from './helpers/pdfText.js';

const drawn = (text, value) => text.includes(`(${value}`);

const fullInvoice = (overrides = {}) => ({
  type: 'invoice', status: 'pending', invoiceNumber: 'INV-42', date: '2026-01-05', dueDate: '2026-02-05',
  sender: { businessName: 'My Co', name: 'Rich', address: '9 Shop Rd', phone: '555-0100' },
  recipient: { name: 'Acme Builders', address: '1 Main St', email: 'ap@acme.test' },
  jobSite: '200 Site Ave',
  lineItems: [{ description: 'Framing', quantity: 2, unitPrice: 150, tax: 10 }],
  notes: 'Thanks!',
  ...overrides
});

test('presentLines trims values and drops blank, null, and undefined ones', () => {
  assert.deepEqual(presentLines(' A ', '', '   ', null, undefined, 'B', 0), ['A', 'B', '0']);
  assert.equal(cleanText(null), '');
  assert.equal(cleanText('  x  '), 'x');
});

test('a fully filled invoice prints every field', () => {
  const text = pdfText(generateInvoicePDF(fullInvoice()));
  for (const value of ['Invoice #INV-42', 'From:', 'My Co', 'Rich', '9 Shop Rd', '555-0100', 'To:', 'Acme Builders',
    '1 Main St', 'ap@acme.test', 'Job site:', '200 Site Ave', 'Date:', '2026-01-05', 'Due:', '2026-02-05',
    'Subtotal: $300.00', 'Tax: $30.00', 'Total: $330.00', 'Notes:', 'Thanks!']) {
    assert.ok(drawn(text, value), `expected "${value}" in the PDF`);
  }
});

test('empty and whitespace-only fields are not printed, and neither are their labels', () => {
  const text = pdfText(generateInvoicePDF(fullInvoice({
    dueDate: '',
    sender: { businessName: '  ', name: '', address: '\n', phone: undefined },
    recipient: { name: 'Acme Builders', address: ' ', email: '' },
    jobSite: '   ',
    notes: ' \n ',
    lineItems: [{ description: 'Framing', quantity: 2, unitPrice: 150, tax: 0 }]
  })));
  for (const label of ['From:', 'Due:', 'Job site:', 'Notes:', 'Subtotal:', 'Tax:', 'Tax (%)']) {
    assert.ok(!drawn(text, label), `"${label}" should not be printed`);
  }
  assert.ok(drawn(text, 'To:'));
  assert.ok(drawn(text, 'Acme Builders'));
  assert.ok(drawn(text, 'Total: $300.00'));
  assert.ok(!/\(\s*\) Tj/.test(text), 'no blank text runs should be drawn');
});

test('an invoice with no sender, recipient, or dates still renders the items and total', () => {
  const text = pdfText(generateInvoicePDF({
    invoiceNumber: '7', lineItems: [{ description: 'Cleanup', quantity: 1, unitPrice: 80 }]
  }));
  for (const label of ['From:', 'To:', 'Date:', 'Due:']) assert.ok(!drawn(text, label), `"${label}" should not be printed`);
  assert.ok(drawn(text, 'Cleanup'));
  assert.ok(drawn(text, 'Total: $80.00'));
});

test('quotes label the due date as "Valid until"', () => {
  const text = pdfText(generateInvoicePDF(fullInvoice({ type: 'quote', status: 'quote' })));
  assert.ok(drawn(text, 'Quote #INV-42'));
  assert.ok(drawn(text, 'Valid until:'));
  assert.ok(!drawn(text, 'Due:'));
});

test('a PDF with no line items is rejected with a clear error', () => {
  assert.throws(() => generateInvoicePDF(fullInvoice({ lineItems: [] })), /no line items/);
});

test('PDFs are compressed and stay small, even for long invoices', () => {
  const small = generateInvoicePDF(fullInvoice()).output('arraybuffer').byteLength;
  assert.ok(small < 6000, `single-item PDF is ${small} bytes`);

  const lineItems = Array.from({ length: 120 }, (_, i) => ({
    description: `Unit ${i} drywall patch and paint, two coats, matched texture`,
    quantity: 1, unitPrice: 95, tax: 0, building: `Building ${Math.floor(i / 40) + 1}`, unit: `${i % 40}`
  }));
  const pdf = generateInvoicePDF(fullInvoice({ lineItems }));
  const size = pdf.output('arraybuffer').byteLength;
  assert.ok(pdf.getNumberOfPages() > 1);
  assert.ok(size < 40000, `120-item PDF is ${size} bytes`);
  assert.match(Buffer.from(pdf.output('arraybuffer')).toString('latin1'), /FlateDecode/);
});
