import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Save the email before attempting login
    setLastAttemptedEmail(formData.email);
    
    // Validate fields
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }
    
    // Start loading
    setLoading(true);
    
    // Small delay to ensure state is set
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // Use AuthContext login which handles everything
      await login(formData.email, formData.password);
      
      // Success - wait a bit then navigate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Navigate after successful login
        if (userData.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/catalog', { replace: true });
        }
      } else {
        setError('Login failed - no user data');
        setLoading(false);
        // Restore email after error
        setFormData(prev => ({ ...prev, email: lastAttemptedEmail }));
      }
    } catch (err: any) {
      // Error occurred - stop loading and show error
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid email or password';
      
      // Keep the email but clear password
      setFormData(prev => ({ 
        email: lastAttemptedEmail || prev.email, 
        password: '' 
      }));
      
      setError(errorMessage);
      setLoading(false);
      
      // Prevent any form reload
      return false;
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* ── Left brand panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0d2818 0%, #1a3d1a 50%, #14391f 100%)' }}
      >
        {/* bg blobs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-[0.07]" style={{ backgroundColor: '#86efac' }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-[0.07]" style={{ backgroundColor: '#fbbf24' }} />

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>🍃</div>
            <span className="text-xl font-extrabold text-white tracking-tight">Sylvan Library</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-snug mb-3">
            Welcome back<br />to the hub
          </h2>
          <p style={{ color: '#86efac' }} className="text-base">
            Board games · PS5 & Switch · Mahjong · MTG Singles
          </p>
        </div>

        {/* Perks */}
        <div className="space-y-4">
          {[
            { e: '🎲', t: '100+ Board Games', d: 'Flat entry fee, play all day' },
            { e: '🎮', t: 'PS5 & Switch Rental', d: 'Hourly rate with happy hour deals' },
            { e: '🀄', t: 'Mahjong Tables', d: 'Dedicated tables, full equipment' },
            { e: '🃏', t: 'MTG Singles Store', d: 'Thousands of graded cards on-site' },
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

          <h2 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>Sign in</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Access your account and MTG order history
          </p>

        {/* Form Card */}
        <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded-lg relative mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <strong className="font-bold block mb-1">Login Failed!</strong>
                  <span className="block text-sm">{error}</span>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-700 hover:text-red-900 ml-2"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); return false; }}>
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
                type="text"
                autoComplete="off"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: 'var(--color-panel)',
                  color: 'var(--color-text)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  '--tw-ring-color': 'var(--color-accent)'
                } as React.CSSProperties}
                placeholder="you@example.com"
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
                autoComplete="off"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: 'var(--color-panel)',
                  color: 'var(--color-text)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  '--tw-ring-color': 'var(--color-accent)'
                } as React.CSSProperties}
                placeholder="••••••••"
              />
            </div>

            <button
              type="button"
              onClick={handleButtonClick}
              disabled={loading}
              className="w-full px-6 py-3.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: `linear-gradient(to right, var(--color-accent), var(--color-highlight))`, color: 'var(--color-panel)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <div className="text-center mt-6">
          <span style={{ color: 'var(--color-text-secondary)' }}>Don't have an account? </span>
          <Link to="/register" className="font-semibold hover:underline hover:opacity-80" style={{ color: 'var(--color-accent)' }}>
            Sign up here
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
