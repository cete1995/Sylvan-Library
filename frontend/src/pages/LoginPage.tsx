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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to access your account</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl shadow-xl p-8" style={{ backgroundColor: 'var(--color-panel)' }}>
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
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
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
          <span className="text-gray-600">Don't have an account? </span>
          <Link to="/register" className="font-semibold hover:underline hover:opacity-80" style={{ color: 'var(--color-accent)' }}>
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
