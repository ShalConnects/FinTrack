import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Palette } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PurchaseCategory } from '../../types';

export const PurchaseCategories: React.FC = () => {
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
      category_color: category.category_color
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all purchases in this category.')) {
      await deletePurchaseCategory(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <div className="min-h-[200px] flex items-center justify-center text-lg">Loading categories...</div>;
  }

  if (error) {
    return <div className="min-h-[200px] flex items-center justify-center text-red-600 text-lg">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Purchase Categories</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => {
            setShowForm(false);
            setEditingCategory(null);
          }} />
          <div className="relative bg-white w-full max-w-md shadow-xl p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Household, Transportation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={formData.monthly_budget}
                    onChange={(e) => setFormData({ ...formData, monthly_budget: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.category_color}
                    onChange={(e) => setFormData({ ...formData, category_color: e.target.value })}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{formData.category_color}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {purchaseCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {purchaseCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.category_color }}
                  />
                  <h3 className="font-medium text-gray-900">{category.category_name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {category.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-1">{category.description}</p>
              )}

              <div className="text-sm">
                <span className="text-gray-600">Budget: </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(category.monthly_budget)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Palette className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">No categories yet</h3>
          <p className="text-sm text-gray-600 mb-4">
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