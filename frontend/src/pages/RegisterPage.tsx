import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.registerCustomer(formData.name, formData.email, formData.password);
      
      // Log user in with the returned token
      setAuthData(data.token, data.user, data.refreshToken);
      
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to register';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex pb-28 md:pb-0" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* ── Left brand panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0d2818 0%, #1a3d1a 50%, #14391f 100%)' }}
      >
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-[0.07]" style={{ backgroundColor: '#86efac' }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-[0.07]" style={{ backgroundColor: '#fbbf24' }} />

        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>🍃</div>
            <span className="text-xl font-extrabold text-white tracking-tight">Sylvan Library</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-snug mb-3">
            Join the<br />community
          </h2>
          <p style={{ color: '#86efac' }} className="text-base">
            One account for all things Sylvan Library
          </p>
        </div>

        <div className="space-y-4">
          {[
            { e: '🎲', t: 'Board Games & Mahjong', d: 'Flat entry, no hourly charge' },
            { e: '🎮', t: 'PS5 & Switch Rental', d: 'Console sessions with happy hour' },
            { e: '🃏', t: 'MTG Singles', d: 'Order cards online, pick up in store' },
            { e: '📦', t: 'Track Your Orders', d: 'Order history & status updates' },
          ].map(({ e, t, d }) => (
            <div key={t} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.09)' }}>{e}</div>
              <div>
                <p className="text-sm font-bold text-white">{t}</p>
                <p className="text-xs" style={{ color: '#86efac' }}>{d}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>© 2026 Sylvan Library</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🍃</span>
            <span className="text-lg font-extrabold" style={{ color: 'var(--color-text)' }}>Sylvan Library</span>
          </div>

          <h2 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Create Account</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Join the community — board games, consoles, Mahjong & MTG
          </p>

        {/* Form Card */}
        <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded-lg mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: 'var(--color-panel)',
                  color: 'var(--color-text)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  '--tw-ring-color': 'var(--color-highlight)'
                } as React.CSSProperties}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: 'var(--color-panel)',
                  color: 'var(--color-text)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  '--tw-ring-color': 'var(--color-highlight)'
                } as React.CSSProperties}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: 'var(--color-panel)',
                  color: 'var(--color-text)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  '--tw-ring-color': 'var(--color-highlight)'
                } as React.CSSProperties}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <p className="mt-2 text-xs text-gray-500 flex items-start">
                <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                At least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: 'var(--color-panel)',
                  color: 'var(--color-text)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  '--tw-ring-color': 'var(--color-highlight)'
                } as React.CSSProperties}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
              style={{ background: `linear-gradient(to right, var(--color-highlight), var(--color-accent))`, color: 'var(--color-panel)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <div className="text-center mt-6">
          <span style={{ color: 'var(--color-text-secondary)' }}>Already have an account? </span>
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>
            Sign in
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
