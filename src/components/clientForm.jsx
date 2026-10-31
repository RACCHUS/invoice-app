import { useState } from 'react';
import { getClientDetails } from '../utils/clientDetails';

export default function ClientForm({ onSubmit, initialData = null, onCancel }) {
  const [form, setForm] = useState(() => ({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    addresses: getClientDetails(initialData || {}, 'addresses'),
    emails: getClientDetails(initialData || {}, 'emails')
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const changeDetail = (field, index, property, value) => setForm(prev => ({
    ...prev, [field]: prev[field].map((detail, i) => i === index ? { ...detail, [property]: value } : detail)
  }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const addresses = form.addresses.map(detail => ({ label: detail.label.trim(), value: detail.value.trim() }));
      const emails = form.emails.map(detail => ({ label: detail.label.trim(), value: detail.value.trim() }));
      await onSubmit({
        ...form, name: form.name.trim(), addresses, emails,
        address: addresses[0]?.value || '', email: emails[0]?.value || '',
        city: '', state: '', zipCode: '', country: ''
      });
    } catch (error) {
      console.error('Error saving client:', error);
      setError(`Failed to save client: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{initialData ? 'Edit Client' : 'Add Client'}</h2>
      {error && <p role="alert">{error}</p>}
      <fieldset className="document-fields" disabled={saving}>
        <label className="form-label">Client name
          <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="form-label">Phone
          <input className="form-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </label>
        {['addresses', 'emails'].map(field => (
          <section key={field}>
            <h3>{field === 'addresses' ? 'Building / mailing addresses' : 'Email contacts'}</h3>
            <p className="form-help">The first entry is the default. Choose any saved entry when creating an invoice.</p>
            {form[field].map((detail, index) => (
              <div key={index} className="saved-detail">
                <label className="form-label">Label
                  <input className="form-input" required placeholder={field === 'addresses' ? 'Building A' : 'Accounts payable'} value={detail.label}
                    onChange={e => changeDetail(field, index, 'label', e.target.value)} />
                </label>
                <label className="form-label">{field === 'addresses' ? 'Address' : 'Email'}
                  {field === 'addresses'
                    ? <textarea className="form-input" required rows={2} value={detail.value} onChange={e => changeDetail(field, index, 'value', e.target.value)} />
                    : <input className="form-input" required type="email" value={detail.value} onChange={e => changeDetail(field, index, 'value', e.target.value)} />}
                </label>
                <button type="button" className="btn-secondary" onClick={() => setForm(prev => ({
                  ...prev, [field]: prev[field].filter((_, i) => i !== index)
                }))}>Remove {field === 'addresses' ? 'address' : 'email'}</button>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => setForm(prev => ({
              ...prev, [field]: [...prev[field], { label: '', value: '' }]
            }))}>Add {field === 'addresses' ? 'address' : 'email'}</button>
          </section>
        ))}
        <div className="form-actions">
          <button type="submit" className="btn-primary">{saving ? 'Saving...' : 'Save Client'}</button>
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </fieldset>
    </form>
  );
}
