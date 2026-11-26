import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { ApiClientError } from '../../lib/apiClient';
import { useAuth } from './AuthContext';
import { AuthLayout } from './AuthLayout';
import { FormField, inputBaseClass, primaryBtnClass } from '../../components/ui/Primitives';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization: 'VIT Bhopal Facilities Management',
    auth_code: '',
    password: '',
    confirm_password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const errors: Record<string, string> = {};
    if (!form.full_name.trim()) errors.full_name = 'Full name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (!form.phone.trim()) errors.phone = 'Contact phone is required.';
    if (!form.organization.trim()) errors.organization = 'Department or wing is required.';
    if (!form.auth_code.trim()) errors.auth_code = 'Registration code from admin is required.';
    if (form.password.length < 12) errors.password = 'Password must be at least 12 characters.';
    if (form.password !== form.confirm_password) errors.confirm_password = 'Passwords do not match.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const message = await register(form);
      setSuccessMessage(message);
      setForm({
        full_name: '',
        email: '',
        phone: '',
        organization: 'VIT Bhopal Facilities Management',
        auth_code: '',
        password: '',
        confirm_password: '',
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setServerError('Registration failed. Please verify backend connectivity.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Staff Account Registration"
      subtitle="Requires the campus registration code. New accounts start as Field Staff pending Super Admin approval."
    >
      {serverError && (
        <div
          className="mb-4 p-3 rounded border border-clay-border bg-clay-soft text-clay text-xs flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3.5 rounded border border-forest-border bg-forest-soft text-forest text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{successMessage}</p>
            <p className="mt-1 text-bark">
              Once approved by a Super Admin, you can sign in from the login screen.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <FormField label="Full Name" htmlFor="reg-name" error={fieldErrors.full_name} required>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g., Ramesh Verma"
              value={form.full_name}
              onChange={e => updateField('full_name', e.target.value)}
              disabled={submitting}
              className={inputBaseClass}
            />
          </FormField>

          <FormField label="Phone Number" htmlFor="reg-phone" error={fieldErrors.phone} required>
            <input
              id="reg-phone"
              type="tel"
              placeholder="+91 98260 XXXXX"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              disabled={submitting}
              className={inputBaseClass}
            />
          </FormField>
        </div>

        <FormField label="Campus Email" htmlFor="reg-email" error={fieldErrors.email} required>
          <input
            id="reg-email"
            type="email"
            placeholder="staff@vitbhopal.ac.in"
            value={form.email}
            onChange={e => updateField('email', e.target.value)}
            disabled={submitting}
            className={inputBaseClass}
          />
        </FormField>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <FormField label="Department / Wing" htmlFor="reg-org" error={fieldErrors.organization} required>
            <input
              id="reg-org"
              type="text"
              value={form.organization}
              onChange={e => updateField('organization', e.target.value)}
              disabled={submitting}
              className={inputBaseClass}
            />
          </FormField>

          <FormField
            label="Registration Code"
            htmlFor="reg-code"
            error={fieldErrors.auth_code}
            hint="Matches server REGISTRATION_CODE"
            required
          >
            <input
              id="reg-code"
              type="text"
              placeholder="Private admin code"
              value={form.auth_code}
              onChange={e => updateField('auth_code', e.target.value)}
              disabled={submitting}
              className={`${inputBaseClass} font-mono`}
            />
          </FormField>
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <FormField
            label="Password"
            htmlFor="reg-password"
            error={fieldErrors.password}
            hint="Minimum 12 characters"
            required
          >
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={e => updateField('password', e.target.value)}
              disabled={submitting}
              className={inputBaseClass}
            />
          </FormField>

          <FormField
            label="Confirm Password"
            htmlFor="reg-confirm"
            error={fieldErrors.confirm_password}
            required
          >
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={e => updateField('confirm_password', e.target.value)}
              disabled={submitting}
              className={inputBaseClass}
            />
          </FormField>
        </div>

        <button type="submit" disabled={submitting} className={`${primaryBtnClass} w-full py-2.5 mt-1`}>
          <UserPlus className="w-4 h-4" />
          <span>{submitting ? 'Submitting request…' : 'Submit Registration'}</span>
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-border text-xs text-bark flex items-center justify-between">
        <span>Already approved?</span>
        <Link to="/login" className="font-semibold text-forest hover:underline">
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};
