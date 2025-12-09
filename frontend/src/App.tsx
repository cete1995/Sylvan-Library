import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CardDetailPage from './pages/CardDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCardListPage from './pages/AdminCardListPage';
import AdminCardFormPage from './pages/AdminCardFormPage';
import AdminBulkUploadPage from './pages/AdminBulkUploadPage';
import AdminSetUploadPage from './pages/AdminSetUploadPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/cards/:id" element={<CardDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/cart" element={<CartPage />} />
                {/* Redirect old admin login to unified login */}
                <Route path="/admin/login" element={<Navigate to="/login" replace />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cards"
                element={
                  <ProtectedRoute>
                    <AdminCardListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cards/new"
                element={
                  <ProtectedRoute>
                    <AdminCardFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cards/edit/:id"
                element={
                  <ProtectedRoute>
                    <AdminCardFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/bulk-upload"
                element={
                  <ProtectedRoute>
                    <AdminBulkUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/set-upload"
                element={
                  <ProtectedRoute>
                    <AdminSetUploadPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                    <a href="/" className="text-primary-600 hover:underline">
                      Go Home
                    </a>
                  </div>
                }
              />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-8 mt-12">
            <div className="container mx-auto px-4 text-center">
              <p>&copy; 2025 MTG Inventory. All rights reserved.</p>
              <p className="text-sm text-gray-400 mt-2">
                Magic: The Gathering is trademark of Wizards of the Coast LLC.
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
