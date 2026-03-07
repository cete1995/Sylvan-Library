import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CatalogPageV2 from './pages/CatalogPageV2';
import MobileCatalogFeed from './pages/MobileCatalogFeed';
import CardDetailPage from './pages/CardDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCardListPage from './pages/AdminCardListPage';
import AdminCardFormPage from './pages/AdminCardFormPage';
import AdminBulkUploadPage from './pages/AdminBulkUploadPage';
import AdminSetUploadPage from './pages/AdminSetUploadPage';
import AdminCarouselPage from './pages/AdminCarouselPage';
import AdminFeaturedPage from './pages/AdminFeaturedPage';
import AdminPriceManagementPage from './pages/AdminPriceManagementPage';
import AdminUBPricingPage from './pages/AdminUBPricingPage';
import AdminUBSettingsPage from './pages/AdminUBSettingsPage';
import AdminRegularSettingsPage from './pages/AdminRegularSettingsPage';
import AdminSellerManagementPage from './pages/AdminSellerManagementPage';
import AdminMembershipPage from './pages/AdminMembershipPage';
import AdminTikTokDebugPage from './pages/AdminTikTokDebugPage';
import AdminTikTokGetOrdersPage from './pages/AdminTikTokGetOrdersPage';
import AdminTikTokOrdersPage from './pages/AdminTikTokOrdersPage';
import AdminTikTokOrderDetailPage from './pages/AdminTikTokOrderDetailPage';
import AdminTikTokSavedOrdersPage from './pages/AdminTikTokSavedOrdersPage';
import AdminMissingImagesPage from './pages/AdminMissingImagesPage';
import AdminDebugPage from './pages/AdminDebugPage';
import AdminOfflineSalePage from './pages/AdminOfflineSalePage';
import AdminOfflineBuyPage from './pages/AdminOfflineBuyPage';
import ManaboxUploadPage from './pages/ManaboxUploadPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import SellerInventoryFormPage from './pages/SellerInventoryFormPage';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CafePage from './pages/CafePage';
import ConsolesPage from './pages/ConsolesPage';
import AdminCafePage from './pages/AdminCafePage';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
            {!isMobile && <Navbar />}
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={isMobile ? <MobileCatalogFeed /> : <CatalogPage />} />
                <Route path="/catalog-v2" element={isMobile ? <MobileCatalogFeed /> : <CatalogPageV2 />} />
                <Route path="/cards/:id" element={<CardDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/cafe" element={<CafePage />} />
                <Route path="/consoles" element={<ConsolesPage />} />
                {/* Redirect old admin login to unified login */}
                <Route path="/admin/login" element={<Navigate to="/login" replace />} />

              {/* Protected Customer Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute adminOnly={false}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute adminOnly={false}>
                    <OrderHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute adminOnly={false}>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/cafe"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminCafePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cards"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminCardListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cards/new"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminCardFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cards/edit/:id"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminCardFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/bulk-upload"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminBulkUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/set-upload"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminSetUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/carousel"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminCarouselPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/featured"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminFeaturedPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/prices"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminPriceManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ub-pricing"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminUBPricingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ub-settings"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminUBSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/regular-settings"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminRegularSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sellers"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminSellerManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tiktok-debug"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminTikTokDebugPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tiktok-get-orders"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminTikTokGetOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tiktok-orders"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminTikTokOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tiktok-saved-orders"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminTikTokSavedOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tiktok-orders/:orderId"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminTikTokOrderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/offline-sales"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminOfflineSalePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/offline-buys"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminOfflineBuyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/missing-images"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminMissingImagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/debug"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDebugPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/membership"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminMembershipPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Seller Routes */}
              <Route
                path="/seller/dashboard"
                element={
                  <ProtectedRoute sellerOnly={true}>
                    <SellerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/manabox-upload"
                element={
                  <ProtectedRoute sellerOnly={true}>
                    <ManaboxUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/cards/:id/inventory"
                element={
                  <ProtectedRoute sellerOnly={true}>
                    <SellerInventoryFormPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>404 - Page Not Found</h1>
                    <Link to="/" className="hover:underline" style={{ color: 'var(--color-accent)' }}>
                      Go Home
                    </Link>
                  </div>
                }
              />
            </Routes>
          </main>

          {/* Footer - Hidden on Mobile */}
          {!isMobile && (
            <footer className="py-8 mt-12" style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}>
              <div className="container mx-auto px-4 text-center">
                <p>© 2026 Boardgame Time. All rights reserved.</p>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Magic: The Gathering is trademark of Wizards of the Coast LLC.
                </p>
              </div>
            </footer>
          )}

          {/* Bottom Navigation - Mobile Only */}
          {isMobile && <BottomNav />}
        </div>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
