export const isQuote = invoice => invoice.type === 'quote' || invoice.status === 'quote';

export const cleanText = value => (value === null || value === undefined ? '' : String(value).trim());

// Trimmed, non-empty values only, so blank optional fields are never printed.
export const presentLines = (...values) => values.map(cleanText).filter(Boolean);

export const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function calculateTotals(lineItems = []) {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  const totalTax = lineItems.reduce((sum, item) =>
    sum + Number(item.quantity) * Number(item.unitPrice) * Number(item.tax || 0) / 100, 0);
  return { subtotal, totalTax, total: subtotal + totalTax };
}

export function normalizeInvoice(invoice) {
  const lineItems = invoice.lineItems?.map(item => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    tax: Number(item.tax || 0)
  }));
  const status = isQuote(invoice) ? 'quote' : invoice.status === 'paid' ? 'paid'
    : invoice.dueDate && invoice.dueDate < localDate() ? 'overdue'
    : 'pending';
  return {
    ...invoice,
    status,
    ...(lineItems ? { lineItems, ...calculateTotals(lineItems) } : {})
  };
}

const prefixed = (value, pattern, word) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return pattern.test(text) ? text : `${word} ${text}`;
};

export const locationLabel = item => [
  prefixed(item.building, /^(building|bldg)\b/i, 'Building'),
  prefixed(item.unit, /^(unit|apt|apartment|suite|ste|#)/i, 'Unit')
].filter(Boolean).join(' · ');

// Heading for a row that starts a new building/unit group, or '' if it continues the previous group.
// Items without a location that follow located items get a "General" heading so they don't look like part of the previous building.
export const locationGroupHeading = (items, index) => {
  const label = locationLabel(items[index]);
  const previous = index > 0 ? locationLabel(items[index - 1]) : '';
  if (label === previous) return '';
  return label || 'General';
};

export const startsLocationGroup = (items, index) => Boolean(locationGroupHeading(items, index));

export function locationHistory(invoices, { clientId = '', clientName = '', jobSite = '', building = '' } = {}) {
  const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  const unique = values => [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
  const forClient = invoices.filter(invoice => clientId
    ? invoice.clientId === clientId
    : clientName.trim() && same(invoice.recipient?.name, clientName));
  const items = forClient
    .filter(invoice => !jobSite.trim() || same(invoice.jobSite, jobSite))
    .flatMap(invoice => invoice.lineItems || []);
  return {
    jobSites: unique(forClient.map(invoice => invoice.jobSite)),
    buildings: unique(items.map(item => item.building)),
    units: unique(items.filter(item => !building.trim() || same(item.building, building)).map(item => item.unit))
  };
}

export function suggestNextNumber(invoices, type = 'invoice') {
  const matching = invoices.filter(invoice => isQuote(invoice) === (type === 'quote'));
  const numbered = matching.map(invoice => {
    const match = String(invoice.invoiceNumber || '').match(/^(.*?)(\d+)$/);
    return match ? { prefix: match[1], digits: match[2], value: Number(match[2]) } : null;
  }).filter(Boolean);
  if (!numbered.length) return type === 'quote' ? 'QUO-0001' : 'INV-0001';
  // The most recent numbered document determines the active prefix.
  const prefix = numbered[0].prefix;
  const sequence = numbered.filter(number => number.prefix === prefix);
  const highest = sequence.reduce((max, number) => number.value > max.value ? number : max);
  return `${prefix}${String(highest.value + 1).padStart(highest.digits.length, '0')}`;
}
