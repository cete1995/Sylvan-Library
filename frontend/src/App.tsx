import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

// Eagerly-loaded customer pages (fast path, frequently hit)
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import MobileCatalogFeed from './pages/MobileCatalogFeed';
import CardDetailPage from './pages/CardDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CafePage from './pages/CafePage';
import ConsolesPage from './pages/ConsolesPage';
import BoardgameCataloguePage from './pages/BoardgameCataloguePage';

// Lazily-loaded admin pages (reduces initial bundle)
const AdminDashboardPage       = lazy(() => import('./pages/AdminDashboardPage'));
const AdminCardListPage        = lazy(() => import('./pages/AdminCardListPage'));
const AdminCardFormPage        = lazy(() => import('./pages/AdminCardFormPage'));
const AdminBulkUploadPage      = lazy(() => import('./pages/AdminBulkUploadPage'));
const AdminSetUploadPage       = lazy(() => import('./pages/AdminSetUploadPage'));
const AdminCarouselPage        = lazy(() => import('./pages/AdminCarouselPage'));
const AdminFeaturedPage        = lazy(() => import('./pages/AdminFeaturedPage'));
const AdminPriceManagementPage = lazy(() => import('./pages/AdminPriceManagementPage'));
const AdminUBPricingPage       = lazy(() => import('./pages/AdminUBPricingPage'));
const AdminUBSettingsPage      = lazy(() => import('./pages/AdminUBSettingsPage'));
const AdminRegularSettingsPage = lazy(() => import('./pages/AdminRegularSettingsPage'));
const AdminSellerManagementPage = lazy(() => import('./pages/AdminSellerManagementPage'));
const AdminMembershipPage      = lazy(() => import('./pages/AdminMembershipPage'));
const AdminTikTokDebugPage     = lazy(() => import('./pages/AdminTikTokDebugPage'));
const AdminTikTokGetOrdersPage = lazy(() => import('./pages/AdminTikTokGetOrdersPage'));
const AdminTikTokOrdersPage    = lazy(() => import('./pages/AdminTikTokOrdersPage'));
const AdminTikTokOrderDetailPage = lazy(() => import('./pages/AdminTikTokOrderDetailPage'));
const AdminTikTokSavedOrdersPage = lazy(() => import('./pages/AdminTikTokSavedOrdersPage'));
const AdminMissingImagesPage   = lazy(() => import('./pages/AdminMissingImagesPage'));
const AdminDebugPage           = lazy(() => import('./pages/AdminDebugPage'));
const AdminOfflineSalePage     = lazy(() => import('./pages/AdminOfflineSalePage'));
const AdminOfflineBuyPage      = lazy(() => import('./pages/AdminOfflineBuyPage'));
const AdminCafePage            = lazy(() => import('./pages/AdminCafePage'));
const AdminOrdersPage          = lazy(() => import('./pages/AdminOrdersPage'));
const AdminBoardgamesPage      = lazy(() => import('./pages/AdminBoardgamesPage'));
const AdminBuylistPage         = lazy(() => import('./pages/AdminBuylistPage'));
const BuylistPage              = lazy(() => import('./pages/BuylistPage'));

// Lazily-loaded seller pages
const ManaboxUploadPage        = lazy(() => import('./pages/ManaboxUploadPage'));
const SellerDashboardPage      = lazy(() => import('./pages/SellerDashboardPage'));
const SellerInventoryFormPage  = lazy(() => import('./pages/SellerInventoryFormPage'));

// Lazily-loaded additional pages
const SetBrowsePage  = lazy(() => import('./pages/SetBrowsePage'));
const WishlistPage   = lazy(() => import('./pages/WishlistPage'));
const BoardgameDetailPage = lazy(() => import('./pages/BoardgameDetailPage'));

// Fallback UI while lazy chunks load
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
  </div>
);

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

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
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={isMobile ? <MobileCatalogFeed /> : <CatalogPage />} />
                <Route path="/cards/:id" element={<CardDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/cafe" element={<CafePage />} />
                <Route path="/consoles" element={<ConsolesPage />} />
                <Route path="/boardgames" element={<BoardgameCataloguePage />} />
                <Route path="/boardgames/:id" element={<BoardgameDetailPage />} />
                <Route path="/buylist" element={<BuylistPage />} />
                <Route path="/sets" element={<SetBrowsePage />} />
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
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute adminOnly={false}>
                    <WishlistPage />
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
                path="/admin/boardgames"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminBoardgamesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/buylist"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminBuylistPage />
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
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminOrdersPage />
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
              </Suspense>
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
