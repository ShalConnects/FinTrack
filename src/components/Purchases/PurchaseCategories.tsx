import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Palette } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PurchaseCategory } from '../../types';
import { CategoryModal } from '../common/CategoryModal';

interface PurchaseCategoriesProps {
  hideTitle?: boolean;
}

export const PurchaseCategories: React.FC<PurchaseCategoriesProps> = ({ hideTitle = false }) => {
  const { 
    purchaseCategories, 
    loading, 
    error, 
    fetchPurchaseCategories, 
    addPurchaseCategory, 
    updatePurchaseCategory, 
    deletePurchaseCategory 
  } = useFinanceStore();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PurchaseCategory | null>(null);
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    monthly_budget: 0,
    currency: 'USD',
    category_color: '#3B82F6'
  });

  // useEffect(() => {
  //   fetchPurchaseCategories();
  // }, [fetchPurchaseCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      await updatePurchaseCategory(editingCategory.id, formData);
      setEditingCategory(null);
    } else {
      await addPurchaseCategory(formData);
    }
    
    setFormData({
      category_name: '',
      description: '',
      monthly_budget: 0,
      currency: 'USD',
      category_color: '#3B82F6'
    });
    setShowForm(false);
  };

  const handleEdit = (category: PurchaseCategory) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      description: category.description || '',
      monthly_budget: category.monthly_budget,
      currency: category.currency,
      category_color: category.category_color
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all purchases in this category.')) {
      await deletePurchaseCategory(id);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return <div className="min-h-[200px] flex items-center justify-center text-lg text-gray-900 dark:text-white">Loading categories...</div>;
  }

  if (error) {
    return <div className="min-h-[200px] flex items-center justify-center text-red-600 dark:text-red-400 text-lg">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        {!hideTitle && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Categories</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Categories you create here will be available for both expenses and transactions.
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={async () => {
              console.log('Manual sync triggered');
              await useFinanceStore.getState().syncExpenseCategoriesWithPurchaseCategories();
              await fetchPurchaseCategories();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm relative group"
            type="button"
          >
            🔄 Sync Categories
            <span className="ml-1 relative flex items-center">
              <span className="inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white opacity-80 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
              </span>
              {/* Tooltip - always positioned under the button, centered */}
              <span className="pointer-events-none absolute left-1/2 top-full z-50 flex flex-col items-center mt-3 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                {/* Arrow */}
                <span className="w-3 h-3 rotate-45 bg-gray-900 -mb-1"></span>
                <span className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-xl px-4 py-2 shadow-lg min-w-[220px] text-center">
                  Syncs any new expense categories with the purchase categories list.<br />
                  <b>Use this if you add a new expense category and want it to appear here.</b>
                </span>
              </span>
            </span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      <CategoryModal
        open={showForm}
        initialValues={editingCategory ? editingCategory : {
          category_name: '',
          description: '',
          monthly_budget: 0,
          currency: 'USD',
          category_color: '#3B82F6',
        }}
        isEdit={!!editingCategory}
        onSave={async (values) => {
          if (editingCategory) {
            await updatePurchaseCategory(editingCategory.id, values);
            setEditingCategory(null);
          } else {
            await addPurchaseCategory({
              ...values,
              currency: values.currency || 'USD',
              monthly_budget: values.monthly_budget ?? 0,
              category_color: values.category_color || '#3B82F6',
            });
          }
          setShowForm(false);
        }}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
        title="Add New Expense Category"
      />

      {purchaseCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {purchaseCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 p-2 hover:shadow transition-shadow min-h-[80px]"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: category.category_color }}
                  />
                  <h3 className="font-medium text-[15px] text-gray-900 dark:text-white">{category.category_name}</h3>
                </div>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {category.description && (
                <p className="text-[12px] text-gray-600 dark:text-gray-300 mb-1 line-clamp-1">{category.description}</p>
              )}

              <div className="text-xs">
                <span className="text-gray-600 dark:text-gray-300">Budget: </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(category.monthly_budget, category.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Palette className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No categories yet</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Create your first purchase category to start organizing your purchases.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      )}
    </div>
  );
}; 