import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./helpers/loader.mjs', import.meta.url);
const { invoiceService } = await import('../src/services/InvoiceServices.js');
const { clientService } = await import('../src/services/clientService.js');
const { itemService } = await import('../src/services/itemService.js');
const { store, resetStore, failNext } = await import('./helpers/firestoreMock.js');
const { friendlyError } = await import('../src/utils/errors.js');

const userId = 'user-1';
const permissionDenied = () => Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' });
const ids = name => [...(store.get(name)?.keys() || [])];

beforeEach(() => resetStore());

const seed = async () => {
  const invoiceId = await invoiceService.saveWithDetails({
    userId, type: 'invoice', status: 'pending', invoiceNumber: 'INV-1', date: '2026-01-01',
    recipient: { name: 'Acme', address: '1 Main St', email: 'a@acme.test' },
    lineItems: [{ description: 'Framing', quantity: 1, unitPrice: 100, tax: 0 }]
  });
  const quoteId = await invoiceService.saveWithDetails({
    userId, type: 'quote', status: 'quote', invoiceNumber: 'Q-1', date: '2026-01-01',
    recipient: { name: 'Acme' },
    lineItems: [{ description: 'Drywall', quantity: 1, unitPrice: 50, tax: 0 }]
  });
  const [client] = await clientService.getClients(userId);
  const items = await itemService.getItems(userId);
  return { invoiceId, quoteId, clientId: client.id, itemIds: items.map(item => item.id) };
};

test('deleting an invoice removes only that invoice', async () => {
  const { invoiceId, quoteId } = await seed();
  await invoiceService.deleteInvoice(invoiceId);
  assert.deepEqual(ids('invoices'), [quoteId]);
  assert.equal(await invoiceService.getInvoiceById(invoiceId), null);
});

test('deleting a quote removes only that quote', async () => {
  const { invoiceId, quoteId } = await seed();
  await invoiceService.deleteInvoice(quoteId);
  assert.deepEqual(ids('invoices'), [invoiceId]);
});

test('deleting a client keeps its invoices, and saving again recreates the client', async () => {
  const { invoiceId, clientId } = await seed();
  await clientService.deleteClient(clientId);
  assert.deepEqual(await clientService.getClients(userId), []);
  assert.ok(await invoiceService.getInvoiceById(invoiceId));

  const invoice = await invoiceService.getInvoiceById(invoiceId);
  delete invoice.id;
  await invoiceService.saveWithDetails({ ...invoice, notes: 'edited' }, { id: invoiceId });
  assert.equal((await clientService.getClients(userId)).length, 1);
});

test('deleting an item removes only that item', async () => {
  const { itemIds } = await seed();
  await itemService.deleteItem(itemIds[0]);
  assert.deepEqual(ids('items'), itemIds.slice(1));
});

test('delete failures are rethrown so the page can show them, and nothing is removed', async () => {
  const { invoiceId, clientId, itemIds } = await seed();
  const cases = [
    () => invoiceService.deleteInvoice(invoiceId),
    () => clientService.deleteClient(clientId),
    () => itemService.deleteItem(itemIds[0])
  ];
  const originalError = console.error;
  console.error = () => {};
  try {
    for (const run of cases) {
      failNext('deleteDoc', permissionDenied());
      await assert.rejects(run, { code: 'permission-denied' });
    }
  } finally {
    console.error = originalError;
  }
  assert.equal(ids('invoices').length, 2);
  assert.equal(ids('clients').length, 1);
  assert.equal(ids('items').length, 2);
});

test('deletes without an id fail fast instead of targeting a bad path', async () => {
  await assert.rejects(() => invoiceService.deleteInvoice(''), /Missing invoice id/);
  await assert.rejects(() => clientService.deleteClient(undefined), /Missing client id/);
  await assert.rejects(() => itemService.deleteItem(null), /Missing item id/);
});

test('friendlyError explains Firebase error codes in plain language', () => {
  assert.match(friendlyError('delete client', permissionDenied()), /^Couldn't delete client: you don't have permission/);
  assert.match(friendlyError('delete item', { code: 'firestore/unavailable' }), /internet connection/);
  assert.match(friendlyError('delete invoice', { code: 'unauthenticated' }), /signed out/);
  assert.match(friendlyError('delete quote', { code: 'deadline-exceeded' }), /timed out/);
  assert.match(friendlyError('delete quote', { code: 'not-found' }), /no longer exists/);
});

test('friendlyError falls back to the error message, then a generic message', () => {
  assert.equal(friendlyError('delete item', new Error('Boom.')), "Couldn't delete item: Boom.");
  assert.equal(friendlyError('delete item', {}), "Couldn't delete item: an unexpected error occurred.");
  assert.equal(friendlyError('delete item', undefined), "Couldn't delete item: an unexpected error occurred.");
});
