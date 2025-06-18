import React, { useState } from 'react';

export default function ClientForm({ onSubmit, initialData = null, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    country: initialData?.country || ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="form-card">
      <h2 className="form-title">
        {initialData ? 'Edit Client' : 'Add New Client'}
      </h2>
      
      <form onSubmit={handleSubmit} className="form-fields">
        <div className="form-grid">
          {/* Name */}
          <div className="form-grid-full">
            <label htmlFor="name" className="form-label">
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter client name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="form-label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="client@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Address */}
          <div className="form-grid-full">
            <label htmlFor="address" className="form-label">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
              placeholder="123 Main Street"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="form-label">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-input"
              placeholder="New York"
            />
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="form-label">
              State/Province
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="form-input"
              placeholder="NY"
            />
          </div>

          {/* Zip Code */}
          <div>
            <label htmlFor="zipCode" className="form-label">
              ZIP/Postal Code
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="form-input"
              placeholder="10001"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="form-label">
              Country
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="form-input"
              placeholder="United States"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading 
              ? 'Saving...' 
              : initialData 
                ? 'Update Client' 
                : 'Add Client'
            }
          </button>
        </div>
      </form>
    </div>
  );
}