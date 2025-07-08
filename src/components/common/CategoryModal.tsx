import React, { useState, useEffect } from 'react';
import { X, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { CustomDropdown } from '../Purchases/CustomDropdown';

export interface CategoryModalProps {
  open: boolean;
  initialValues?: {
    category_name: string;
    description?: string;
    monthly_budget?: number;
    currency?: string;
    category_color?: string;
  };
  isEdit?: boolean;
  isPurchaseCategory?: boolean;
  onSave: (values: {
    category_name: string;
    description?: string;
    monthly_budget?: number;
    currency?: string;
    category_color?: string;
  }) => void;
  onClose: () => void;
  currencyOptions?: string[];
  title?: string;
  isIncomeCategory?: boolean;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  initialValues = {
    category_name: '',
    description: '',
    monthly_budget: 0,
    currency: 'USD',
    category_color: '#3B82F6',
  },
  isEdit = false,
  isPurchaseCategory = false,
  onSave,
  onClose,
  currencyOptions = ['USD', 'BDT', 'EUR', 'GBP', 'JPY'],
  title,
  isIncomeCategory = false,
}) => {
  const [formData, setFormData] = useState({ ...initialValues });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    setFormData({ ...initialValues });
    setErrors({});
    setTouched({});
    setFormSubmitted(false);
  }, [initialValues, open]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.category_name || formData.category_name.trim() === '') {
      newErrors.category_name = 'Category name is required.';
    }
    if (!isIncomeCategory) {
      if (
        formData.monthly_budget === undefined ||
        formData.monthly_budget === null ||
        String(formData.monthly_budget).trim() === '' ||
        isNaN(Number(formData.monthly_budget))
      ) {
        newErrors.monthly_budget = 'Monthly budget is required.';
      }
    }
    return newErrors;
  };

  useEffect(() => {
    setErrors(validate());
  }, [formData]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setSubmitting(true);
    await onSave(formData);
    setSubmitting(false);
    onClose();
  };

  const isFormValid =
    isIncomeCategory
      ? formData.category_name && formData.category_name.trim() !== '' && Object.keys(errors).length === 0
      : formData.category_name &&
        formData.category_name.trim() !== '' &&
        formData.monthly_budget !== undefined &&
        formData.monthly_budget !== null &&
        String(formData.monthly_budget).trim() !== '' &&
        !isNaN(Number(formData.monthly_budget)) &&
        Number(formData.monthly_budget) > 0 &&
        Object.keys(errors).length === 0;

  // Helper to get input classes with error state (copied from TransactionForm)
  const getInputClasses = (field: string) => {
    const base = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const error = "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normal = "border-gray-200 focus:ring-blue-500";
    return `${base} ${errors[field] && (touched[field] || formSubmitted) ? error : normal}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-[38rem] max-h-[90vh] overflow-y-auto z-50 shadow-xl transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title ? title : (isEdit ? 'Edit Purchase Category' : 'Add New Purchase Category')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="grid grid-cols-2 gap-x-[1.15rem] gap-y-[1.40rem]">
            <div className="relative">
              <input
                type="text"
                value={formData.category_name}
                onChange={e => setFormData({ ...formData, category_name: e.target.value })}
                onBlur={() => handleBlur('category_name')}
                className={getInputClasses('category_name')}
                placeholder={isIncomeCategory ? "Income Source Name *" : "Category Name (e.g., Household, Transportation) *"}
                required
                aria-invalid={!!errors.category_name}
                aria-describedby={errors.category_name ? 'category_name-error' : undefined}
              />
              {errors.category_name && (touched.category_name || formSubmitted) && (
                <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1" id="category_name-error">
                  <AlertCircle className="w-4 h-4" />
                  {errors.category_name}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="Description (optional)"
            />
            {isIncomeCategory && (
              <div className="flex items-center gap-3 col-span-2">
                <input
                  type="color"
                  value={formData.category_color}
                  onChange={e => setFormData({ ...formData, category_color: e.target.value })}
                  className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">{formData.category_color}</span>
              </div>
            )}
          </div>
          {!isIncomeCategory && (
            <div className="grid grid-cols-3 gap-x-[1.15rem] gap-y-[1.40rem] items-center">
              <div className="relative">
                <input
                  type="number"
                  value={formData.monthly_budget === 0 ? '' : formData.monthly_budget}
                  onChange={e => setFormData({ ...formData, monthly_budget: parseFloat(e.target.value) || 0 })}
                  onBlur={() => handleBlur('monthly_budget')}
                  className={getInputClasses('monthly_budget') + ' appearance-none'}
                  placeholder="Monthly Budget *"
                  step="0.01"
                  min="0"
                  required
                  aria-invalid={!!errors.monthly_budget}
                  aria-describedby={errors.monthly_budget ? 'monthly_budget-error' : undefined}
                />
                {errors.monthly_budget && (touched.monthly_budget || formSubmitted) && (
                  <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1" id="monthly_budget-error">
                    <AlertCircle className="w-4 h-4" />
                    {errors.monthly_budget}
                  </span>
                )}
              </div>
              <CustomDropdown
                value={formData.currency || ''}
                onChange={val => setFormData({ ...formData, currency: val })}
                options={currencyOptions.map(opt => ({ value: opt, label: opt }))}
                placeholder="Currency"
                fullWidth={true}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              disabled={submitting || !isFormValid}
              aria-busy={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {submitting ? 'Saving...' : (isEdit ? 'Update Category' : 'Add Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 