import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { ApiClientError, USE_MOCK_API } from '../../lib/apiClient';
import { useAuth } from './AuthContext';
import { AuthLayout } from './AuthLayout';
import { FormField, inputBaseClass, primaryBtnClass } from '../../components/ui/Primitives';

export const LoginPage: React.FC = () => {
  const { status, login, sessionError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState(USE_MOCK_API ? 'admin@vitbhopal.ac.in' : '');
  const [password, setPassword] = useState(USE_MOCK_API ? 'AdminCampus2026!' : '');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const nextFieldErrors: Record<string, string> = {};

    if (!email.trim()) nextFieldErrors.email = 'Email address is required.';
    if (!password) nextFieldErrors.password = 'Password is required.';
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password, remember_me: rememberMe });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setFormError('Unable to sign in right now. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to Operations"
      subtitle="Use your approved VIT Bhopal facilities or sanitation staff account."
    >
      {(formError || sessionError) && (
        <div
          className="mb-4 p-3 rounded border border-clay-border bg-clay-soft text-clay text-xs flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{formError || sessionError}</span>
        </div>
      )}

      {USE_MOCK_API && (
        <div className="mb-4 p-3 rounded border border-ochre-border bg-ochre-soft text-bark text-xs">
          <p className="font-semibold text-ochre">Mock preview mode active</p>
          <p className="mt-0.5">
            Demo accounts: <span className="font-mono">admin@vitbhopal.ac.in</span>,{' '}
            <span className="font-mono">supervisor@vitbhopal.ac.in</span>, or{' '}
            <span className="font-mono">ramesh.verma@vitbhopal.ac.in</span> (any 6+ char password).
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Staff Email" htmlFor="login-email" error={fieldErrors.email} required>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="name@vitbhopal.ac.in"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={submitting}
            className={`${inputBaseClass} ${fieldErrors.email ? 'border-clay' : ''}`}
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password" error={fieldErrors.password} required>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={submitting}
              className={`${inputBaseClass} pr-10 ${fieldErrors.password ? 'border-clay' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-soil hover:text-ink cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <label className="inline-flex items-center gap-2 text-xs text-bark cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              disabled={submitting}
              className="rounded border-border text-forest focus:ring-forest"
            />
            <span>Keep me signed in (30 days)</span>
          </label>
          <Link to="/forgot-password" className="text-xs font-medium text-cedar hover:underline">
            Reset access?
          </Link>
        </div>

        <button type="submit" disabled={submitting} className={`${primaryBtnClass} w-full py-2.5`}>
          <LogIn className="w-4 h-4" />
          <span>{submitting ? 'Verifying session…' : 'Sign In'}</span>
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-border text-xs text-bark flex items-center justify-between">
        <span>New campus staff member?</span>
        <Link to="/register" className="font-semibold text-forest hover:underline">
          Request staff account
        </Link>
      </div>
    </AuthLayout>
  );
};
