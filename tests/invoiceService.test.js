import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./helpers/loader.mjs', import.meta.url);
const { invoiceService } = await import('../src/services/InvoiceServices.js');
const { clientService } = await import('../src/services/clientService.js');
const { itemService } = await import('../src/services/itemService.js');
const { store, resetStore } = await import('./helpers/firestoreMock.js');
const { suggestNextNumber } = await import('../src/utils/invoiceData.js');

const userId = 'user-1';
const invoice = (overrides = {}) => ({
  userId, type: 'invoice', status: 'pending', invoiceNumber: 'JOB-0007', date: '2026-10-31', dueDate: '',
  sender: { businessName: 'My Co' },
  recipient: { name: 'Acme Builders', address: 'Building A, 1 Main St', email: 'ap@acme.test' },
  lineItems: [{ description: 'Framing', quantity: 2, unitPrice: 150, tax: 10 }],
  notes: '',
  ...overrides
});

beforeEach(() => resetStore());

test('saving an invoice persists totals, a reusable client, and reusable items', async () => {
  const id = await invoiceService.saveWithDetails(invoice());
  const saved = await invoiceService.getInvoiceById(id);
  assert.equal(saved.total, 330);
  assert.equal(saved.invoiceNumber, 'JOB-0007');

  const [client] = await clientService.getClients(userId);
  assert.equal(saved.clientId, client.id);
  assert.deepEqual(client.addresses, [{ label: 'Address', value: 'Building A, 1 Main St' }]);
  assert.deepEqual(client.emails, [{ label: 'Email', value: 'ap@acme.test' }]);

  const items = await itemService.getItems(userId);
  assert.equal(items.length, 1);
  assert.equal(items[0].description, 'Framing');
});

test('a second building address and email are appended to the same client, items are not duplicated', async () => {
  const firstId = await invoiceService.saveWithDetails(invoice());
  const { clientId } = await invoiceService.getInvoiceById(firstId);
  await invoiceService.saveWithDetails(invoice({
    clientId, invoiceNumber: 'JOB-0008',
    recipient: { name: 'Acme Builders', address: 'Building B, 9 Oak Ave', email: 'site-b@acme.test' }
  }));

  const clients = await clientService.getClients(userId);
  assert.equal(clients.length, 1);
  assert.deepEqual(clients[0].addresses.map(a => a.value), ['Building A, 1 Main St', 'Building B, 9 Oak Ave']);
  assert.deepEqual(clients[0].emails.map(e => e.value), ['ap@acme.test', 'site-b@acme.test']);
  assert.equal(clients[0].address, 'Building A, 1 Main St');
  assert.equal((await itemService.getItems(userId)).length, 1);
});

test('opting out of saving details stores only the invoice', async () => {
  await invoiceService.saveWithDetails(invoice(), { saveClient: false, saveItems: false });
  assert.equal(store.get('clients')?.size || 0, 0);
  assert.equal(store.get('items')?.size || 0, 0);
  assert.equal(store.get('invoices').size, 1);
});

test('the next-number suggestion follows saved invoices and ignores quotes', async () => {
  await invoiceService.saveWithDetails(invoice({ invoiceNumber: 'JOB-0009' }));
  await invoiceService.saveWithDetails(invoice({ invoiceNumber: 'QUO-0050', type: 'quote', status: 'quote' }));
  assert.equal(suggestNextNumber(await invoiceService.getInvoices(userId)), 'JOB-0010');
  assert.equal(suggestNextNumber(await invoiceService.getInvoices(userId), 'quote'), 'QUO-0051');
});

test('converting a quote assigns the next invoice number', async () => {
  await invoiceService.saveWithDetails(invoice({ invoiceNumber: 'JOB-0041' }));
  const quoteId = await invoiceService.saveWithDetails(invoice({ invoiceNumber: 'QUO-0003', type: 'quote', status: 'quote' }));
  const quote = await invoiceService.getInvoiceById(quoteId);
  await invoiceService.convertToInvoice(quote);
  const converted = await invoiceService.getInvoiceById(quoteId);
  assert.equal(converted.type, 'invoice');
  assert.equal(converted.invoiceNumber, 'JOB-0042');
});

test('marking paid and unpaid persists, and an unpaid past-due invoice shows overdue', async () => {
  const id = await invoiceService.saveWithDetails(invoice({ dueDate: '2000-01-01' }));
  assert.equal((await invoiceService.getInvoiceById(id)).status, 'overdue');
  await invoiceService.updateInvoice(id, { status: 'paid' });
  assert.equal((await invoiceService.getInvoiceById(id)).status, 'paid');
  await invoiceService.updateInvoice(id, { status: 'pending' });
  assert.equal((await invoiceService.getInvoiceById(id)).status, 'overdue');
});

test('job site, building, and unit are saved; the job site is added to the client for reuse', async () => {
  const id = await invoiceService.saveWithDetails(invoice({
    jobSite: '500 Site Rd',
    lineItems: [
      { description: 'Framing', quantity: 1, unitPrice: 100, tax: 0, building: 'A', unit: '101' },
      { description: 'Framing', quantity: 1, unitPrice: 100, tax: 0, building: 'A', unit: '102' },
      { description: 'Cleanup', quantity: 1, unitPrice: 50, tax: 0, building: '', unit: '' }
    ]
  }));
  const saved = await invoiceService.getInvoiceById(id);
  assert.equal(saved.jobSite, '500 Site Rd');
  assert.deepEqual(saved.lineItems.map(item => [item.building, item.unit]), [['A', '101'], ['A', '102'], ['', '']]);
  const [client] = await clientService.getClients(userId);
  assert.ok(client.addresses.some(a => a.label === 'Job site' && a.value === '500 Site Rd'));
  const items = await itemService.getItems(userId);
  assert.equal(items.length, 2);
  assert.ok(items.every(item => item.building === undefined && item.unit === undefined));
});
