import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotals, normalizeInvoice, suggestNextNumber, localDate } from '../src/utils/invoiceData.js';
import { getClientDetails, mergeClientDetails } from '../src/utils/clientDetails.js';
import { generateInvoicePDF } from '../src/utils/pdfGenerator.js';
import { formatDate } from '../src/utils/formatters.js';

test('totals include tax, fractional quantities, zero prices, and credits', () => {
  const totals = calculateTotals([
    { quantity: '1.5', unitPrice: '100', tax: '10' },
    { quantity: 1, unitPrice: -20, tax: 0 },
    { quantity: 2, unitPrice: 0, tax: 0 }
  ]);
  assert.deepEqual(totals, { subtotal: 130, totalTax: 15, total: 145 });
});

test('existing invoices without totals are calculated without a database migration', () => {
  const invoice = normalizeInvoice({
    total: 0, lineItems: [{ description: 'Work', quantity: '2', unitPrice: '100', tax: '5' }]
  });
  assert.equal(invoice.total, 210);
  assert.equal(invoice.lineItems[0].unitPrice, 100);
});

test('legacy invoices with only a stored total retain it', () => {
  assert.equal(normalizeInvoice({ total: 75 }).total, 75);
});

test('overdue status is derived locally without changing paid invoices or quotes', () => {
  assert.equal(normalizeInvoice({ dueDate: '2000-01-01', status: 'pending' }).status, 'overdue');
  assert.equal(normalizeInvoice({ dueDate: localDate(), status: 'pending' }).status, 'pending');
  assert.equal(normalizeInvoice({ dueDate: '2000-01-01', status: 'paid' }).status, 'paid');
  assert.equal(normalizeInvoice({ dueDate: '2000-01-01', type: 'quote' }).status, 'quote');
  assert.equal(normalizeInvoice({ dueDate: '2999-01-01', status: 'overdue' }).status, 'pending');
});

test('number suggestions preserve prefixes and zero padding, and exclude quotes', () => {
  assert.equal(suggestNextNumber([
    { invoiceNumber: 'JOB-0008' },
    { invoiceNumber: 'JOB-0012' },
    { invoiceNumber: 'JOB-9999', type: 'quote' }
  ]), 'JOB-0013');
});

test('number suggestions use the latest prefix and can grow beyond padding', () => {
  assert.equal(suggestNextNumber([
    { invoiceNumber: '2026-0099' }, { invoiceNumber: '2025-9999' }
  ]), '2026-0100');
  assert.equal(suggestNextNumber([{ invoiceNumber: 'INV-9999' }]), 'INV-10000');
});

test('manual lower numbers do not move the suggestion backwards', () => {
  assert.equal(suggestNextNumber([{ invoiceNumber: 10 }, { invoiceNumber: 40 }]), '41');
});

test('new documents and non-numeric numbers have sensible suggestions', () => {
  assert.equal(suggestNextNumber([]), 'INV-0001');
  assert.equal(suggestNextNumber([{ invoiceNumber: 'Custom' }]), 'INV-0001');
  assert.equal(suggestNextNumber([], 'quote'), 'QUO-0001');
  assert.equal(suggestNextNumber([{ invoiceNumber: 'Q-007', status: 'quote' }], 'quote'), 'Q-008');
});

test('legacy clients expose their existing address and email', () => {
  const client = { address: '123 Main', city: 'Town', email: 'billing@example.test' };
  assert.deepEqual(getClientDetails(client, 'addresses'), [{ label: 'Primary', value: '123 Main, Town' }]);
  assert.deepEqual(getClientDetails(client, 'emails'), [{ label: 'Primary', value: 'billing@example.test' }]);
});

test('new building addresses and emails append without replacing defaults', () => {
  const client = { name: 'Builder', address: 'Building A', email: 'billing@example.test' };
  const merged = mergeClientDetails(client, { name: 'Builder', address: 'Building B', email: 'site@example.test' });
  assert.equal(merged.address, 'Building A');
  assert.equal(merged.email, 'billing@example.test');
  assert.equal(merged.addresses.length, 2);
  assert.equal(merged.emails.length, 2);
  assert.equal(client.addresses, undefined);
});

test('client reuse deduplicates email case and does not duplicate legacy city fields', () => {
  const client = {
    name: 'Builder', address: '123 Main, Town', city: 'Town',
    addresses: [{ label: 'Office', value: '123 Main, Town' }],
    email: 'billing@example.test', emails: [{ label: 'Billing', value: 'billing@example.test' }]
  };
  const merged = mergeClientDetails(client, { address: '123 Main, Town', email: 'BILLING@example.test' });
  assert.equal(merged.addresses.length, 1);
  assert.equal(merged.emails.length, 1);
});

test('clients can be saved without an email or address', () => {
  assert.deepEqual(mergeClientDetails({}, { name: 'Builder' }), {
    name: 'Builder', address: '', email: '', addresses: [], emails: []
  });
});

test('PDF export accepts legacy numeric strings and includes correct totals', () => {
  const pdf = generateInvoicePDF({
    invoiceNumber: 'INV-1', date: '2026-10-31', dueDate: '',
    recipient: { address: 'Building A\n123 Main Street\nTown', email: 'billing@example.test' },
    lineItems: [{ description: 'Work', quantity: '1.5', unitPrice: '100', tax: '10' }]
  });

  const output = pdf.output();
  assert.ok(output.includes('Total: $165.00'));
  assert.ok(output.includes('Building A'));
  assert.ok(output.includes('123 Main Street'));
});

test('date-only values display the entered calendar day, not the previous UTC day', () => {
  assert.equal(formatDate('2026-10-31'), 'Oct 31, 2026');
  assert.equal(formatDate(null), 'N/A');
  assert.notEqual(formatDate({ seconds: 0 }), 'Invalid Date');
});

test('location labels allow address-only, building-only, unit-only, both, or neither', async () => {
  const { locationLabel } = await import('../src/utils/invoiceData.js');
  assert.equal(locationLabel({}), '');
  assert.equal(locationLabel({ building: 'A' }), 'Building A');
  assert.equal(locationLabel({ unit: '101' }), 'Unit 101');
  assert.equal(locationLabel({ building: 'Bldg 2', unit: 'Suite 4' }), 'Bldg 2 \u00b7 Suite 4');
  assert.equal(locationLabel({ building: ' ', unit: '#7' }), '#7');
});

test('location headings appear when the building or unit changes, including back to no location', async () => {
  const { startsLocationGroup, locationGroupHeading } = await import('../src/utils/invoiceData.js');
  const items = [
    { building: 'A', unit: '101' }, { building: 'A', unit: '101' }, { building: 'A', unit: '102' },
    { building: 'B', unit: '' }, { building: '', unit: '' }, { building: 'B', unit: '' }
  ];
  assert.deepEqual(items.map((_, i) => startsLocationGroup(items, i)), [true, false, true, true, true, true]);
  assert.equal(locationGroupHeading(items, 4), 'General');
  const plain = [{ building: '' }, { unit: '' }];
  assert.deepEqual(plain.map((_, i) => locationGroupHeading(plain, i)), ['', '']);
});

test('building and unit suggestions come from the same client and job site', async () => {
  const { locationHistory } = await import('../src/utils/invoiceData.js');
  const invoices = [
    { clientId: 'c1', jobSite: '1 Main St', lineItems: [{ building: 'A', unit: '101' }, { building: 'B', unit: '201' }] },
    { clientId: 'c1', jobSite: '9 Oak Ave', lineItems: [{ building: 'Tower', unit: 'PH' }] },
    { clientId: 'c2', jobSite: '1 Main St', lineItems: [{ building: 'Other', unit: 'X' }] }
  ];
  const site = locationHistory(invoices, { clientId: 'c1', jobSite: '1 main st' });
  assert.deepEqual(site.jobSites, ['1 Main St', '9 Oak Ave']);
  assert.deepEqual(site.buildings, ['A', 'B']);
  assert.deepEqual(locationHistory(invoices, { clientId: 'c1', jobSite: '1 Main St', building: 'a' }).units, ['101']);
});

test('PDF shows the job site and one heading per building/unit group', () => {
  const pdf = generateInvoicePDF({
    invoiceNumber: 'INV-2', date: '2026-10-31', jobSite: '500 Site Rd',
    lineItems: [
      { description: 'Drywall', quantity: 1, unitPrice: 10, building: 'A', unit: '101' },
      { description: 'Paint', quantity: 1, unitPrice: 10, building: 'A', unit: '101' },
      { description: 'Trim', quantity: 1, unitPrice: 10, building: 'B' }
    ]
  });
  const output = pdf.output();
  assert.ok(output.includes('500 Site Rd'));
  assert.equal(output.split('Unit 101').length - 1, 1);
  assert.ok(output.includes('Building B'));
});
