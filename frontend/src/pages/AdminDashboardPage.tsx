import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { Stats } from '../types';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-gray-600 mb-2">Total Unique Cards</div>
          <div className="text-3xl font-bold text-primary-600">{stats?.totalCards || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-gray-600 mb-2">Total Quantity</div>
          <div className="text-3xl font-bold text-primary-600">{stats?.totalQuantity || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-gray-600 mb-2">Inventory Value</div>
          <div className="text-3xl font-bold text-green-600">${stats?.totalInventoryValue || '0.00'}</div>
          <div className="text-sm text-gray-500 mt-1">Based on buy prices</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-gray-600 mb-2">Listing Value</div>
          <div className="text-3xl font-bold text-blue-600">${stats?.totalListingValue || '0.00'}</div>
          <div className="text-sm text-gray-500 mt-1">Based on sell prices</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link
            to="/admin/cards/new"
            className="btn-primary text-center py-4"
          >
            + Add New Card
          </Link>
          
          <Link
            to="/admin/cards"
            className="btn-secondary text-center py-4"
          >
            Manage Cards
          </Link>

          <Link
            to="/admin/bulk-upload"
            className="border-2 border-primary-600 text-primary-600 px-4 py-4 rounded-lg hover:bg-primary-50 transition-colors font-medium text-center"
          >
            Bulk Upload CSV
          </Link>

          <Link
            to="/admin/set-upload"
            className="border-2 border-green-600 text-green-600 px-4 py-4 rounded-lg hover:bg-green-50 transition-colors font-medium text-center"
          >
            Upload Set JSON
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-2">Welcome to Your Dashboard!</h3>
        <p className="text-gray-700 mb-2">
          From here you can manage your entire MTG card inventory. Add new cards, update prices and quantities, or upload cards in bulk.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Use "Add New Card" to manually add individual cards</li>
          <li>Use "Manage Cards" to edit or delete existing cards</li>
          <li>Use "Bulk Upload CSV" to import many cards at once</li>
          <li>Use "Upload Set JSON" to import entire sets from MTGJson with quantity 0</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
