import { useState, FormEvent, ChangeEvent } from 'react';
import { ContactForm, ValidationErrors, SubmissionStatus } from '../types/forms';
import '../styles/forms.css';

function Contact() {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: 'general',
    message: '',
    preferredContactMethod: 'email',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [ticketId, setTicketId] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.preferredContactMethod === 'phone' && !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required when phone is the preferred contact method';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
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
      const mockTicketId = `TKT-${Date.now()}`;
      setTicketId(mockTicketId);
      setStatus('success');
      console.log('Support ticket submitted:', { ...formData, ticketId: mockTicketId });
    }, 1500);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      name: '',
      email: '',
      phone: '',
      subject: '',
      category: 'general',
      message: '',
      preferredContactMethod: 'email',
    });
    setErrors({});
    setStatus('idle');
    setTicketId('');
  };

  if (status === 'success') {
    return (
      <div className="success-container">
        <h1>Message Sent Successfully!</h1>
        <div className="success-message">
          <p>Thank you for contacting our support team.</p>
          <p className="order-id">Ticket ID: <strong>{ticketId}</strong></p>
          <p>
            We will respond to your inquiry via {formData.preferredContactMethod} within 1-2 business days.
          </p>
        </div>
        <button onClick={handleReset} className="btn-primary">
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Contact Customer Support</h1>
      <p className="page-description">
        Have a question or need assistance? Fill out the form below and our support team will get back to you.
      </p>

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-section">
          <h2>Your Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
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
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="(555) 123-4567"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="preferredContactMethod">Preferred Contact Method</label>
            <select
              id="preferredContactMethod"
              name="preferredContactMethod"
              value={formData.preferredContactMethod}
              onChange={handleChange}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Your Inquiry</h2>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="general">General Inquiry</option>
              <option value="technical">Technical Support</option>
              <option value="billing">Billing Question</option>
              <option value="complaint">Complaint</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">
              Subject <span className="required">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={errors.subject ? 'error' : ''}
              placeholder="Brief description of your inquiry"
            />
            {errors.subject && (
              <span className="error-message">{errors.subject}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="message">
              Message <span className="required">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={8}
              className={errors.message ? 'error' : ''}
              placeholder="Please provide details about your inquiry..."
            />
            {errors.message && (
              <span className="error-message">{errors.message}</span>
            )}
            <small className="form-hint">
              Minimum 10 characters ({formData.message.length} / 10)
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Sending...' : 'Send Message'}
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

export default Contact;
