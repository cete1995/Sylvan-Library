import React, { useState, useEffect } from 'react';
import { priceApi } from '../api/price';
import { useAuth } from '../contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CardPriceChartProps {
  uuid: string;
}

const CardPriceChart: React.FC<CardPriceChartProps> = ({ uuid }) => {
  const { token } = useAuth();
  const [priceData, setPriceData] = useState<any[]>([]);
  const [latestPrice, setLatestPrice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [usdToIdr] = useState(15800); // Default conversion rate, can be made dynamic later

  useEffect(() => {
    if (uuid && token) {
      loadPriceData();
    }
  }, [uuid, token, days]);

  const loadPriceData = async () => {
    if (!token || !uuid) return;

    try {
      setLoading(true);
      
      // Load latest price
      try {
        const latest = await priceApi.getLatestPrice(token, uuid);
        setLatestPrice(latest.price);
      } catch (err) {
        console.log('No latest price found');
      }

      // Load price history
      const history = await priceApi.getPriceHistory(token, uuid, { days });
      
      // Transform data for chart
      const chartData = history.prices.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'CK Retail (Normal)': item.prices?.cardkingdom?.retail?.normal || null,
        'CK Retail (Foil)': item.prices?.cardkingdom?.retail?.foil || null,
        'TCG Retail (Normal)': item.prices?.tcgplayer?.retail?.normal || null,
        'TCG Retail (Foil)': item.prices?.tcgplayer?.retail?.foil || null,
      }));

      setPriceData(chartData);
    } catch (error) {
      console.error('Failed to load price data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number, currency: 'USD' | 'IDR' = 'USD') => {
    if (currency === 'IDR') {
      return `Rp ${(value * usdToIdr).toLocaleString('id-ID')}`;
    }
    return `$${value.toFixed(2)}`;
  };

  if (!uuid) {
    return (
      <div className="rounded-lg p-6 border-2 border-dashed" style={{ borderColor: 'var(--color-text-secondary)', opacity: 0.5 }}>
        <p className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
          No UUID available for this card. Price data requires a card UUID from MTGJson.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span style={{ color: 'var(--color-text-secondary)' }}>Loading price data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Market Prices</h3>
        <div className="flex gap-2">
          {[7, 30, 90, 180].map((d) => (
            <button
              key={d}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDays(d);
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                days === d ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
              style={{ 
                backgroundColor: days === d ? 'var(--color-accent)' : 'var(--color-background)',
                color: days === d ? 'var(--color-panel)' : 'var(--color-text)'
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Latest Prices */}
      {latestPrice && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {latestPrice.prices?.cardkingdom?.retail?.normal && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>CK Retail (Normal)</div>
              <div className="font-bold" style={{ color: 'var(--color-accent)' }}>
                {formatPrice(latestPrice.prices.cardkingdom.retail.normal)}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {formatPrice(latestPrice.prices.cardkingdom.retail.normal, 'IDR')}
              </div>
            </div>
          )}

          {latestPrice.prices?.cardkingdom?.retail?.foil && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>CK Retail (Foil)</div>
              <div className="font-bold" style={{ color: 'var(--color-highlight)' }}>
                {formatPrice(latestPrice.prices.cardkingdom.retail.foil)}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {formatPrice(latestPrice.prices.cardkingdom.retail.foil, 'IDR')}
              </div>
            </div>
          )}

          {latestPrice.prices?.tcgplayer?.retail?.normal && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>TCG Retail (Normal)</div>
              <div className="font-bold" style={{ color: 'var(--color-accent)' }}>
                {formatPrice(latestPrice.prices.tcgplayer.retail.normal)}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {formatPrice(latestPrice.prices.tcgplayer.retail.normal, 'IDR')}
              </div>
            </div>
          )}

          {latestPrice.prices?.tcgplayer?.retail?.foil && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>TCG Retail (Foil)</div>
              <div className="font-bold" style={{ color: 'var(--color-highlight)' }}>
                {formatPrice(latestPrice.prices.tcgplayer.retail.foil)}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {formatPrice(latestPrice.prices.tcgplayer.retail.foil, 'IDR')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Chart */}
      {priceData.length > 0 ? (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text-secondary)" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-panel)',
                  border: '1px solid var(--color-text-secondary)',
                  borderRadius: '8px',
                  color: 'var(--color-text)'
                }}
                formatter={(value: any) => `$${value.toFixed(2)}`}
              />
              <Legend 
                wrapperStyle={{ color: 'var(--color-text)' }}
              />
              <Line 
                type="monotone" 
                dataKey="CK Retail (Normal)" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="CK Retail (Foil)" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="TCG Retail (Normal)" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="TCG Retail (Foil)" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No price history available for this card.
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Import price data from the Price Management page to see historical trends.
          </p>
        </div>
      )}
    </div>
  );
};

export default CardPriceChart;
