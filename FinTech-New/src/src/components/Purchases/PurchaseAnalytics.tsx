import React from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PurchaseAnalytics as Analytics } from '../../types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

export const PurchaseAnalytics: React.FC = () => {
  const { getPurchaseAnalytics } = useFinanceStore();
  const analytics: Analytics = getPurchaseAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Purchase Analytics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.total_spent)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.monthly_spent)}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Planned Items</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.planned_count}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Purchased</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.purchased_count}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Purchased</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{analytics.purchased_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Planned</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{analytics.planned_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Cancelled</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{analytics.cancelled_count}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Category</h3>
          {analytics.top_category ? (
            <div className="text-center">
              <ShoppingBag className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-xl font-bold text-gray-900">{analytics.top_category}</p>
              <p className="text-sm text-gray-600">Highest spending category</p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>No purchase data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {analytics.category_breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {analytics.category_breakdown.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}></div>
                  <span className="text-sm font-medium text-gray-700">{category.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(category.total_spent)}</p>
                  <p className="text-xs text-gray-500">{formatPercentage(category.percentage)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
        <div className="space-y-3">
          {analytics.monthly_spent > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Monthly Spending</p>
                <p className="text-xs text-blue-700">
                  You've spent {formatCurrency(analytics.monthly_spent)} this month
                </p>
              </div>
            </div>
          )}

          {analytics.planned_count > 0 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Planned Purchases</p>
                <p className="text-xs text-yellow-700">
                  You have {analytics.planned_count} items planned for purchase
                </p>
              </div>
            </div>
          )}

          {analytics.top_category && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Top Category</p>
                <p className="text-xs text-green-700">
                  {analytics.top_category} is your highest spending category
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 