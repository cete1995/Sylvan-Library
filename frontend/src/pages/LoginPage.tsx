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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-4xl font-bold text-gray-900">Sign In</h2>
          <p className="mt-2 text-center text-gray-600">Welcome back!</p>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-4 rounded relative shadow-lg">
            <strong className="font-bold block mb-1">Login Failed!</strong>
            <span className="block">{error}</span>
            <button
              onClick={() => setError('')}
              className="absolute top-2 right-2 text-red-700 hover:text-red-900"
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); return false; }}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
