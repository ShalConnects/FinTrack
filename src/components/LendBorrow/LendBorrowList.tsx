import React, { useState, useEffect } from 'react';
import { LendBorrow, LendBorrowReturn } from '../../types/index';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, InfoIcon, CheckCircle, Clock, AlertTriangle, DollarSign, CornerDownLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { supabase } from '../../lib/supabase';

interface LendBorrowListProps {
  records: LendBorrow[];
  loading: boolean;
  onEdit: (record: LendBorrow) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: LendBorrow['status']) => void;
  onPartialReturn: (record: LendBorrow) => void;
  analytics?: any;
  formatCurrency?: (amount: number, currency: string) => string;
}

export const LendBorrowList: React.FC<LendBorrowListProps> = ({ records, loading, onEdit, onDelete, onUpdateStatus, onPartialReturn, analytics, formatCurrency }) => {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [returnHistory, setReturnHistory] = useState<Record<string, LendBorrowReturn[]>>({});
  
  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    recordId: string;
    recordName: string;
    recordType: 'lend' | 'borrow';
    recordAmount: number;
    recordCurrency: string;
  }>({
    isOpen: false,
    recordId: '',
    recordName: '',
    recordType: 'lend',
    recordAmount: 0,
    recordCurrency: 'USD'
  });

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Sort function
  const sortData = (data: LendBorrow[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'person_name':
          aValue = a.person_name.toLowerCase();
          bValue = b.person_name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const toggleRowExpansion = async (recordId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(recordId)) {
      newExpandedRows.delete(recordId);
    } else {
      newExpandedRows.add(recordId);
      // Fetch return history when expanding
      await fetchReturnHistory(recordId);
    }
    setExpandedRows(newExpandedRows);
  };

  const fetchReturnHistory = async (recordId: string) => {
    try {
      const { data, error } = await supabase
        .from('lend_borrow_returns')
        .select('*')
        .eq('lend_borrow_id', recordId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturnHistory(prev => ({
        ...prev,
        [recordId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching return history:', error);
    }
  };

  const isRowExpanded = (recordId: string) => expandedRows.has(recordId);

  const handleDeleteClick = (record: LendBorrow) => {
    setDeleteModal({
      isOpen: true,
      recordId: record.id,
      recordName: record.person_name,
      recordType: record.type,
      recordAmount: record.amount,
      recordCurrency: record.currency
    });
  };

  const handleConfirmDelete = () => {
    onDelete(deleteModal.recordId);
    setDeleteModal({ ...deleteModal, isOpen: false });
  };

  // Use the formatCurrency prop, or fallback to a default implementation
  const defaultFormatCurrency = (amount: number, currency: string) => {
    if (currency === 'BDT') {
      return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: LendBorrow['status']) => {
    switch (status) {
      // No icon for 'active' or 'settled'
      // case 'settled':
      //   return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('person_name')}
          >
            <div className="flex items-center space-x-1">
              <span>Person Name</span>
              {getSortIcon('person_name')}
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('type')}
          >
            <div className="flex items-center space-x-1">
              <span>Type</span>
              {getSortIcon('type')}
            </div>
          </th>
          <th 
            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('amount')}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>Amount</span>
              {getSortIcon('amount')}
            </div>
          </th>
          <th 
            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('status')}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>Status</span>
              {getSortIcon('status')}
            </div>
          </th>
          <th 
            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('due_date')}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>Due Date</span>
              {getSortIcon('due_date')}
            </div>
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {/* Analytics summary row */}
      {analytics && formatCurrency && (
        <tr>
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Lend</p>
                    <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>
                      {formatCurrency(analytics.total_lent, analytics.currency)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Borrowed</p>
                    <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>
                      {formatCurrency(analytics.total_borrowed, analytics.currency)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Outstanding</p>
                    <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>
                      {formatCurrency(analytics.outstanding_lent - analytics.outstanding_borrowed, analytics.currency)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Overdue</p>
                    <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>
                      {analytics.overdue_count}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
        {loading ? (
          <tr>
            <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400 text-lg">Loading records...</td>
          </tr>
        ) : records.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400 text-lg">No records found</td>
          </tr>
        ) : (
          sortData(records).map((record) => {
            const isOverdue = record.due_date && new Date(record.due_date) < new Date() && record.status === 'active';
            const daysUntilDue = record.due_date ? getDaysUntilDue(record.due_date) : null;
            const recordReturns = returnHistory[record.id] || [];
            const totalReturned = recordReturns.reduce((sum, ret) => sum + ret.amount, 0);
            
            return (
              <React.Fragment key={record.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => toggleRowExpansion(record.id)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div 
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-help relative group"
                          title={record.notes || 'No notes available'}
                        >
                          {record.person_name}
                          {record.notes && (
                            <div className="absolute left-0 top-full mt-2 w-64 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              {record.notes}
                              <div className="absolute top-0 left-4 transform -translate-y-1/2 w-2 h-2 bg-gray-800 dark:bg-gray-700 rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-2">
                        <svg 
                          className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(record.id) ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.type === 'lend' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                    }`}>
                      {record.type === 'lend' ? t('lendBorrow.lend') : t('lendBorrow.borrow')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-semibold ${
                      record.type === 'lend' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(formatCurrency || defaultFormatCurrency)(record.amount, record.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                        record.status === 'settled' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                        record.status === 'overdue' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                      {getStatusIcon(record.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {record.due_date ? formatDate(record.due_date) : '-'}
                    </div>
                    {record.due_date && (
                      <div className={`text-xs ${
                        isOverdue ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {isOverdue ? 'Overdue' : daysUntilDue !== null && daysUntilDue > 0 ? `${daysUntilDue} days left` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(record)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {record.status !== 'settled' && (
                        <>
                          <button
                            onClick={() => onPartialReturn(record)}
                            className="text-gray-500 hover:text-blue-600"
                            title="Partial Return"
                          >
                            <CornerDownLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onUpdateStatus(record.id, 'settled')}
                            className="text-gray-500 hover:text-blue-600"
                            title="Mark as Settled"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteClick(record)}
                        className="text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Row Content */}
                {isRowExpanded(record.id) && (
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Record Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Record Details</h4>
                          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            <div><span className="font-medium">Created:</span> {formatDate(record.created_at)}</div>
                            <div><span className="font-medium">Updated:</span> {record.updated_at ? formatDate(record.updated_at) : 'Never'}</div>

                            {record.notes && (
                              <div><span className="font-medium">Notes:</span> {record.notes}</div>
                            )}
                            {totalReturned > 0 && (
                              <div>
                                <span className="font-medium">Total Returned:</span> {(formatCurrency || defaultFormatCurrency)(totalReturned, record.currency)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Return History */}
                        {recordReturns.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Return History</h4>
                            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 max-h-32 overflow-y-auto">
                              {recordReturns.map((ret) => (
                                <div key={ret.id} className="flex justify-between">
                                  <span>{(formatCurrency || defaultFormatCurrency)(ret.amount, record.currency)}</span>
                                  <span>{formatDate(ret.return_date)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })
        )}
      </tbody>
    </table>

    {/* Delete Confirmation Modal */}
    <DeleteConfirmationModal
      isOpen={deleteModal.isOpen}
      onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      onConfirm={handleConfirmDelete}
      title="Confirm Deletion"
      message={`Are you sure you want to delete this ${deleteModal.recordType} record? This action cannot be undone.`}
      recordDetails={
        <>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="font-medium text-red-800">Record Details:</span>
          </div>
          <div className="text-sm text-red-700 space-y-1">
            <div><span className="font-medium">Person:</span> {deleteModal.recordName}</div>
            <div><span className="font-medium">Type:</span> {deleteModal.recordType === 'lend' ? 'Lend' : 'Borrow'}</div>
            <div><span className="font-medium">Amount:</span> {deleteModal.recordCurrency} {deleteModal.recordAmount.toLocaleString()}</div>
          </div>
        </>
      }
      confirmLabel="Delete Record"
      cancelLabel="Cancel"
    />
    </>
  );
}; 