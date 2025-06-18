// Currency formatting
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount || 0);
};

// Date formatting
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Invoice number generation
export const generateInvoiceNumber = (prefix = 'INV', length = 6) => {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 1000000);
  const combined = timestamp + randomNum.toString();
  const suffix = combined.slice(-length).padStart(length, '0');
  return `${prefix}-${suffix}`;
};

// Status color mapping
export const getStatusColor = (status) => {
  const colors = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || colors.draft;
};

// Calculate due date
export const calculateDueDate = (issueDate, terms = 30) => {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + terms);
  return date;
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Calculate invoice totals
export const calculateInvoiceTotals = (items, taxRate = 0, discountAmount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.rate);
  }, 0);
  
  const discountTotal = typeof discountAmount === 'number' ? discountAmount : 0;
  const taxableAmount = subtotal - discountTotal;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;
  
  return {
    subtotal,
    discountAmount: discountTotal,
    taxAmount,
    total
  };
};

// Generate PDF filename
export const generatePDFFilename = (invoiceNumber, clientName) => {
  const cleanClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
  return `Invoice_${invoiceNumber}_${cleanClientName}.pdf`;
};

// Format phone number
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if not a standard format
  return phoneNumber;
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
