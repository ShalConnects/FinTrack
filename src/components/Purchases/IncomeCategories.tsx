import React, { useState } from 'react';
import { Plus, Edit, Trash2, Palette } from 'lucide-react';
import { CategoryModal } from '../common/CategoryModal';
import { useFinanceStore } from '../../store/useFinanceStore';

interface IncomeCategoriesProps {
  hideTitle?: boolean;
}

export const IncomeCategories: React.FC<IncomeCategoriesProps> = ({ hideTitle = false }) => {
  const { categories, addCategory, deleteCategory } = useFinanceStore();
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategory(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        {!hideTitle && (
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Income Categories</h2>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>
      <CategoryModal
        open={showForm}
        initialValues={editingCategory ? {
          category_name: editingCategory.name,
          description: editingCategory.description || '',
          category_color: editingCategory.color || '#10B981',
        } : {
          category_name: '',
          description: '',
          category_color: '#10B981',
        }}
        isEdit={!!editingCategory}
        onSave={async (values) => {
          if (editingCategory) {
            deleteCategory(editingCategory.id);
            await addCategory({
              name: values.category_name,
              type: 'income',
              color: values.category_color,
              icon: '',
              description: values.description,
            });
            setEditingCategory(null);
          } else {
            await addCategory({
              name: values.category_name,
              type: 'income',
              color: values.category_color,
              icon: '',
              description: values.description,
            });
          }
          setShowForm(false);
        }}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
        currencyOptions={[]}
        title="Add New Income Source"
        isIncomeCategory={true}
      />
      {incomeCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {incomeCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 p-2 hover:shadow transition-shadow min-h-[80px]"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-medium text-[15px] text-gray-900 dark:text-white">{category.name}</h3>
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
                <div className="text-[12px] text-gray-600 dark:text-gray-300 mb-1 line-clamp-2">{category.description}</div>
              )}
              <div className="text-xs">
                <span className="text-gray-600 dark:text-gray-300">Type: </span>
                <span className="font-medium text-gray-900 dark:text-white">Income</span>
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
            Create your first income category to start organizing your income.
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