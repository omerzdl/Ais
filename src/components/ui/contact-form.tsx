import { useState } from 'react';
import { Dropdown } from './dropdown';

interface FormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  message: string;
  kvkkConsent: boolean;
}

interface ContactFormProps {
  onSubmit?: (data: FormData) => void;
}

const departmentOptions = [
  { value: 'sales', label: 'Sales and Marketing' },
  { value: 'dealer', label: 'Dealership Application' },
  { value: 'support', label: 'Technical Support' },
  { value: 'other', label: 'Other' },
];

export function ContactForm({ onSubmit }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    department: '',
    message: '',
    kvkkConsent: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[0-9+\s()-]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.department) {
      newErrors.department = 'Department selection is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (!formData.kvkkConsent) {
      newErrors.kvkkConsent = 'KVKK consent is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(formData);
      } else {
        // Default behavior
        console.log('Form submitted:', formData);
        alert('Form submitted successfully!');
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        message: '',
        kvkkConsent: false,
      });
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name and Email Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label 
            htmlFor="contact-name" 
            className="block text-sm font-medium text-[#1E293B] mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="contact-name"
            name="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className={`
              w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#1E293B]
              focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent
              transition-all duration-200
              ${errors.name ? 'border-red-500' : ''}
            `}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-xs text-red-500" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="contact-email" 
            className="block text-sm font-medium text-[#1E293B] mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="contact-email"
            name="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            className={`
              w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#1E293B]
              focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent
              transition-all duration-200
              ${errors.email ? 'border-red-500' : ''}
            `}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Phone and Department Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label 
            htmlFor="contact-phone" 
            className="block text-sm font-medium text-[#1E293B] mb-2"
          >
            Phone
          </label>
          <input
            type="tel"
            id="contact-phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
            className={`
              w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#1E293B]
              focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent
              transition-all duration-200
              ${errors.phone ? 'border-red-500' : ''}
            `}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-xs text-red-500" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="contact-department" 
            className="block text-sm font-medium text-[#1E293B] mb-2"
          >
            Department
          </label>
          <Dropdown
            options={departmentOptions}
            value={formData.department}
            onChange={(value) => handleChange('department', value)}
            placeholder="Select Department"
            className="w-full"
          />
          {errors.department && (
            <p className="mt-1 text-xs text-red-500" role="alert">
              {errors.department}
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label 
          htmlFor="contact-message" 
          className="block text-sm font-medium text-[#1E293B] mb-2"
        >
          Your Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          rows={3}
          required
          className={`
            w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#1E293B] resize-none
            focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent
            transition-all duration-200
            ${errors.message ? 'border-red-500' : ''}
          `}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-xs text-red-500" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      {/* KVKK Checkbox */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="contact-kvkk"
          name="kvkkConsent"
          checked={formData.kvkkConsent}
          onChange={(e) => handleChange('kvkkConsent', e.target.checked)}
          required
          className="mt-1 w-4 h-4 rounded border-[#E2E8F0] text-[#FF8C00] focus:ring-[#FF8C00] focus:ring-2 cursor-pointer"
          aria-invalid={!!errors.kvkkConsent}
          aria-describedby={errors.kvkkConsent ? 'kvkk-error' : undefined}
        />
        <label 
          htmlFor="contact-kvkk" 
          className="text-sm text-[#1E293B] leading-relaxed cursor-pointer"
        >
          Kişisel verilerimin işlenmesine ilişkin{' '}
          <a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined' && (window as any).openKvkkModal) {
                (window as any).openKvkkModal();
              }
            }}
            className="underline text-[#FF8C00] hover:text-[#E67E00] transition-colors"
          >
            Aydınlatma Metnini
          </a>
          {' '}okudum ve kabul ediyorum.
        </label>
      </div>
      {errors.kvkkConsent && (
        <p id="kvkk-error" className="text-xs text-red-500" role="alert">
          {errors.kvkkConsent}
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3 px-6 rounded-xl bg-[#FF8C00] text-white font-bold hover:bg-[#E67E00] transition-colors duration-200 shadow-[0_4px_16px_rgba(255,140,0,0.3)]"
      >
        Send
      </button>
    </form>
  );
}
