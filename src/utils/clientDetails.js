export function getClientDetails(client, field) {
  const details = (client[field] || []).filter(detail => detail.value?.trim());
  const legacyValue = field === 'addresses'
    ? details.some(detail => detail.value === client.address) ? client.address
      : [client.address, client.city, client.state, client.zipCode, client.country].filter(Boolean).join(', ')
    : client.email;
  if (legacyValue && !details.some(detail => detail.value === legacyValue)) {
    return [{ label: 'Primary', value: legacyValue }, ...details];
  }
  return details;
}

export function mergeClientDetails(client, recipient, jobSite = '') {
  const addresses = getClientDetails(client, 'addresses');
  const emails = getClientDetails(client, 'emails');
  if (recipient.address?.trim() && !addresses.some(detail => detail.value === recipient.address.trim())) {
    addresses.push({ label: 'Address', value: recipient.address.trim() });
  }
  if (jobSite.trim() && !addresses.some(detail => detail.value === jobSite.trim())) {
    addresses.push({ label: 'Job site', value: jobSite.trim() });
  }
  if (recipient.email?.trim() && !emails.some(detail => detail.value.toLowerCase() === recipient.email.trim().toLowerCase())) {
    emails.push({ label: 'Email', value: recipient.email.trim() });
  }
  return {
    name: client.name || recipient.name.trim(),
    address: addresses[0]?.value || '',
    email: emails[0]?.value || '',
    addresses,
    emails
  };
}
