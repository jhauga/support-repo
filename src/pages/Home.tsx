import { useState, FormEvent, ChangeEvent } from 'react';
import { PartOrder, ValidationErrors, SubmissionStatus } from '../types/forms';
import '../styles/forms.css';

function Home() {
  const [formData, setFormData] = useState<PartOrder>({
    customerName: '',
    email: '',
    companyName: '',
    partNumber: '',
    partDescription: '',
    quantity: 1,
    urgency: 'standard',
    deliveryAddress: '',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [orderId, setOrderId] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    }

    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus('submitting');

    // Simulate API call
    setTimeout(() => {
      const mockOrderId = `ORD-${Date.now()}`;
      setOrderId(mockOrderId);
      setStatus('success');
      console.log('Order submitted:', { ...formData, orderId: mockOrderId });
    }, 1500);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleReset = (): void => {
    setFormData({
      customerName: '',
      email: '',
      companyName: '',
      partNumber: '',
      partDescription: '',
      quantity: 1,
      urgency: 'standard',
      deliveryAddress: '',
      additionalNotes: '',
    });
    setErrors({});
    setStatus('idle');
    setOrderId('');
  };

  if (status === 'success') {
    return (
      <div className="success-container">
        <h1>Order Submitted Successfully!</h1>
        <div className="success-message">
          <p>Thank you for your order.</p>
          <p className="order-id">Order ID: <strong>{orderId}</strong></p>
          <p>We will process your request and contact you shortly.</p>
        </div>
        <button onClick={handleReset} className="btn-primary">
          Submit Another Order
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Order Parts from Manufacturer</h1>
      <p className="page-description">
        Fill out the form below to order parts. All fields marked with * are required.
      </p>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-section">
          <h2>Customer Information</h2>
          
          <div className="form-group">
            <label htmlFor="customerName">
              Customer Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              className={errors.customerName ? 'error' : ''}
            />
            {errors.customerName && (
              <span className="error-message">{errors.customerName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Part Details</h2>

          <div className="form-group">
            <label htmlFor="partNumber">
              Part Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="partNumber"
              name="partNumber"
              value={formData.partNumber}
              onChange={handleChange}
              className={errors.partNumber ? 'error' : ''}
              placeholder="e.g., PN-12345"
            />
            {errors.partNumber && (
              <span className="error-message">{errors.partNumber}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="partDescription">Part Description</label>
            <textarea
              id="partDescription"
              name="partDescription"
              value={formData.partDescription}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the part (optional)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">
                Quantity <span className="required">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className={errors.quantity ? 'error' : ''}
              />
              {errors.quantity && (
                <span className="error-message">{errors.quantity}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="urgency">Urgency</label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
              >
                <option value="standard">Standard (5-7 days)</option>
                <option value="expedited">Expedited (2-3 days)</option>
                <option value="rush">Rush (1 day)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Delivery Information</h2>

          <div className="form-group">
            <label htmlFor="deliveryAddress">
              Delivery Address <span className="required">*</span>
            </label>
            <textarea
              id="deliveryAddress"
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              rows={4}
              className={errors.deliveryAddress ? 'error' : ''}
              placeholder="Enter complete shipping address"
            />
            {errors.deliveryAddress && (
              <span className="error-message">{errors.deliveryAddress}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="additionalNotes">Additional Notes</label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              rows={3}
              placeholder="Any special instructions or requirements (optional)"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Order'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary"
            disabled={status === 'submitting'}
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}

export default Home;
