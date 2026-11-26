import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { ApiClientError } from '../../lib/apiClient';
import { authService } from '../../services/authService';
import { AuthLayout } from './AuthLayout';
import { FormField, inputBaseClass, primaryBtnClass } from '../../components/ui/Primitives';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const res = await authService.requestPasswordReset(email);
      setResult(res.message);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Account Recovery"
      subtitle="Request a credential reset through the VIT Bhopal Facilities Super Admin."
    >
      {result && (
        <div className="mb-4 p-3.5 rounded border border-forest-border bg-forest-soft text-forest text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{result}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="Registered Staff Email"
          htmlFor="forgot-email"
          error={error || undefined}
          hint="Self-service SMTP reset is disabled in the current Express backend; requests route to Facilities Admin."
          required
        >
          <input
            id="forgot-email"
            type="email"
            placeholder="name@vitbhopal.ac.in"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={submitting}
            className={inputBaseClass}
          />
        </FormField>

        <button type="submit" disabled={submitting} className={`${primaryBtnClass} w-full py-2.5`}>
          <KeyRound className="w-4 h-4" />
          <span>{submitting ? 'Logging request…' : 'Request Credential Reset'}</span>
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-border">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Sign In</span>
        </Link>
      </div>
    </AuthLayout>
  );
};
