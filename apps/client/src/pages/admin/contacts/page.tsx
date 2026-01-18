// app/admin/contacts/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { t } from '@lingui/macro';
import { useUser } from "@/client/services/user";
import {
  Search,
  Mail,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Send,
  Trash2,
  ChevronDown,
  Copy,
  Archive,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  MailOpen,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Define TypeScript interfaces
interface ContactUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  user?: ContactUser;
}

interface ContactStats {
  total: number;
  todayCount: number;
  byStatus: Array<{ status: string; _count: number }>;
  bySubject: Array<{ subject: string; _count: number }>;
}

interface ColorVariant {
  bg: string;
  text: string;
  border: string;
}

const AdminContactsPage = () => {
  // Properly typed states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [replyModalOpen, setReplyModalOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const { user } = useUser();

  // Status colors with proper typing
  const statusColors: Record<string, ColorVariant> = {
    NEW: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800'
    },
    IN_PROGRESS: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    RESPONDED: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    CLOSED: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    }
  };

  // Subject colors with proper typing
  const subjectColors: Record<string, ColorVariant> = {
    SUPPORT: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800'
    },
    BILLING: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800'
    },
    FEEDBACK: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800'
    },
    BUSINESS: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    OTHER: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    }
  };

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contact', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      // Type-safe data extraction
      let contactsData: Contact[] = [];
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) {
          contactsData = data.data;
        } else if (Array.isArray(data)) {
          contactsData = data;
        }
      }
      
      setContacts(contactsData);
      setFilteredContacts(contactsData);
    } catch (error) {
      toast.error(t`Failed to load contacts`);
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contact/statistics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Type-safe stats extraction
        const statsData: ContactStats = {
          total: data?.data?.total || data?.total || 0,
          todayCount: data?.data?.todayCount || data?.todayCount || 0,
          byStatus: data?.data?.byStatus || data?.byStatus || [],
          bySubject: data?.data?.bySubject || data?.bySubject || []
        };
        setStats(statsData);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [fetchContacts, fetchStats]);

  // Filter logic with proper typing
  useEffect(() => {
    let result = [...contacts];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(contact =>
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.message.toLowerCase().includes(searchLower) ||
        contact.subject.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(contact => contact.status === statusFilter);
    }

    // Subject filter
    if (subjectFilter !== 'ALL') {
      result = result.filter(contact => contact.subject === subjectFilter);
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredContacts(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [contacts, search, statusFilter, subjectFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContacts = filteredContacts.slice(startIndex, endIndex);

  const handleStatusUpdate = async (id: string, status: string, notes?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contact/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (response.ok) {
        toast.success(t`Status updated successfully`);
        fetchContacts();
        fetchStats();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast.error(t`Failed to update status`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t`Are you sure you want to delete this contact?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(t`Contact deleted successfully`);
        fetchContacts();
        fetchStats();
        if (selectedContact?.id === id) {
          setViewModalOpen(false);
          setSelectedContact(null);
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast.error(t`Failed to delete contact`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    if (!confirm(t`Are you sure you want to delete ${selectedRows.length} contacts?`)) return;

    try {
      const token = localStorage.getItem('token');
      const results = await Promise.allSettled(
        selectedRows.map(id =>
          fetch(`/api/contact/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      toast.success(t`Deleted ${successful} contacts`);
      setSelectedRows([]);
      fetchContacts();
      fetchStats();
    } catch (error) {
      toast.error(t`Failed to delete contacts`);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRows.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const results = await Promise.allSettled(
        selectedRows.map(id =>
          fetch(`/api/contact/${id}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
          })
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      toast.success(t`Updated ${successful} contacts`);
      setSelectedRows([]);
      fetchContacts();
      fetchStats();
    } catch (error) {
      toast.error(t`Failed to update contacts`);
    }
  };

  const handleSendReply = async () => {
    if (!selectedContact || !replyMessage.trim()) return;

    try {
      setSendingReply(true);
      // Simulate sending reply
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update contact status
      await handleStatusUpdate(selectedContact.id, 'RESPONDED', `Replied: ${replyMessage}`);
      
      toast.success(t`Reply sent successfully`);
      setReplyModalOpen(false);
      setReplyMessage('');
    } catch (error) {
      toast.error(t`Failed to send reply`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Subject', 'Status', 'Message', 'Created At', 'IP Address'];
    const csvData = filteredContacts.map(contact => [
      contact.id,
      contact.name,
      contact.email,
      contact.subject,
      contact.status,
      `"${contact.message.replace(/"/g, '""')}"`,
      contact.createdAt,
      contact.ipAddress || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t`Copied to clipboard`);
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentContacts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentContacts.map(c => c.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Helper function to safely get color variant
  const getColorVariant = (record: Record<string, ColorVariant>, key: string): ColorVariant => {
    return record[key] || record.OTHER || { bg: '', text: '', border: '' };
  };

  // Safely access stats
  const getStatusCount = (status: string): number => {
    return stats?.byStatus?.find(s => s.status === status)?._count || 0;
  };

  // Safely format date
  const formatDate = (dateString: string, formatString: string): string => {
    try {
      return format(new Date(dateString), formatString);
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t`Contact Messages`}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t`Manage and respond to user inquiries`}
        </p>
      </div>

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-300">
                {selectedRows.length} {t`selected`}
              </span>
            </div>
            <button
              onClick={() => setSelectedRows([])}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {t`Clear selection`}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              onChange={(e) => handleBulkStatusUpdate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            >
              <option value="">{t`Update status`}</option>
              <option value="NEW">{t`Mark as New`}</option>
              <option value="IN_PROGRESS">{t`Mark as In Progress`}</option>
              <option value="RESPONDED">{t`Mark as Responded`}</option>
              <option value="CLOSED">{t`Mark as Closed`}</option>
            </select>
            
            <button
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t`Delete Selected`}
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Contacts Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t`Total Contacts`}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center">
                <MailOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* New Today Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t`New Today`}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.todayCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t`Pending`}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {getStatusCount('NEW')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-800/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Responded Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t`Responded`}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {getStatusCount('RESPONDED')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t`Search by name, email, or message...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {t`Filters`}
              {showFilters ? <ChevronDown className="w-4 h-4 transform rotate-180" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t`Export`}
            </button>

            <button
              onClick={fetchContacts}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t`Refresh`}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-wrap gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t`Status`}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                >
                  <option value="ALL">{t`All Status`}</option>
                  <option value="NEW">{t`New`}</option>
                  <option value="IN_PROGRESS">{t`In Progress`}</option>
                  <option value="RESPONDED">{t`Responded`}</option>
                  <option value="CLOSED">{t`Closed`}</option>
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t`Subject`}
                </label>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                >
                  <option value="ALL">{t`All Subjects`}</option>
                  <option value="SUPPORT">{t`Support`}</option>
                  <option value="BILLING">{t`Billing`}</option>
                  <option value="FEEDBACK">{t`Feedback`}</option>
                  <option value="BUSINESS">{t`Business`}</option>
                  <option value="OTHER">{t`Other`}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t`Contact Messages`} ({filteredContacts.length})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t`Showing ${currentContacts.length} of ${filteredContacts.length}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {selectedRows.length === currentContacts.length ? t`Deselect All` : t`Select All`}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t`Loading contacts...`}</p>
              </div>
            </div>
          ) : currentContacts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t`No contacts found`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t`Try adjusting your filters or search criteria`}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === currentContacts.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t`Name`}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t`Email`}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t`Subject`}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t`Status`}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t`Date`}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t`Actions`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentContacts.map((contact) => {
                  const subjectColor = getColorVariant(subjectColors, contact.subject);
                  const statusColor = getColorVariant(statusColors, contact.status);
                  
                  return (
                    <tr 
                      key={contact.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        selectedRows.includes(contact.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(contact.id)}
                          onChange={() => toggleSelectRow(contact.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {contact.name}
                            </div>
                            {contact.user && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {t`User`}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${subjectColor.bg} ${subjectColor.text} ${subjectColor.border}`}>
                          {contact.subject}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                            {contact.status.replace('_', ' ')}
                          </span>
                          
                          <select
                            value={contact.status}
                            onChange={(e) => handleStatusUpdate(contact.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="NEW">{t`New`}</option>
                            <option value="IN_PROGRESS">{t`In Progress`}</option>
                            <option value="RESPONDED">{t`Responded`}</option>
                            <option value="CLOSED">{t`Closed`}</option>
                          </select>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(contact.createdAt, 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(contact.createdAt, 'h:mm a')}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setViewModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title={t`View details`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <a
                            href={`mailto:${contact.email}`}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title={t`Send email`}
                          >
                            <Send className="w-4 h-4" />
                          </a>
                          
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title={t`Delete`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {currentContacts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t`Showing ${startIndex + 1}-${Math.min(endIndex, filteredContacts.length)} of ${filteredContacts.length}`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded border ${
                  currentPage === 1
                    ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 rounded border text-sm ${
                      currentPage === pageNum
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded border ${
                  currentPage === totalPages
                    ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Contact Modal */}
      {viewModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setViewModalOpen(false)}
            ></div>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Modal header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t`Contact Details`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t`From`} {selectedContact.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal content */}
              <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Contact info cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Name card */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t`Name`}
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {selectedContact.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Email card */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t`Email`}
                          </p>
                          <a
                            href={`mailto:${selectedContact.email}`}
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {selectedContact.email}
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date card */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t`Submitted`}
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatDate(selectedContact.createdAt, 'PPpp')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subject and Status */}
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                        {t`Subject:`}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        subjectColors[selectedContact.subject]?.bg || subjectColors.OTHER.bg
                      } ${subjectColors[selectedContact.subject]?.text || subjectColors.OTHER.text}
                      ${subjectColors[selectedContact.subject]?.border || subjectColors.OTHER.border}`}>
                        {selectedContact.subject}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                        {t`Status:`}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[selectedContact.status]?.bg || statusColors.CLOSED.bg
                      } ${statusColors[selectedContact.status]?.text || statusColors.CLOSED.text}
                      ${statusColors[selectedContact.status]?.border || statusColors.CLOSED.border}`}>
                        {selectedContact.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {selectedContact.ipAddress && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                          {t`IP Address:`}
                        </span>
                        <code className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700">
                          {selectedContact.ipAddress}
                        </code>
                      </div>
                    )}
                  </div>
                  
                  {/* Message */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      {t`Message`}
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
                      {selectedContact.message}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => copyToClipboard(selectedContact.message)}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        {t`Copy Message`}
                      </button>
                    </div>
                  </div>
                  
                  {/* User info if registered */}
                  {selectedContact.user && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        {t`User Information`}
                      </h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-4">
                          {selectedContact.user.picture ? (
                            <img
                              src={selectedContact.user.picture}
                              alt={selectedContact.user.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {selectedContact.user.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedContact.user.email}
                            </p>
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300">
                              {t`Registered User`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setViewModalOpen(false);
                        setReplyModalOpen(true);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {t`Reply`}
                    </button>
                    
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      {t`Open in Email`}
                    </a>
                    
                    <select
                      value={selectedContact.status}
                      onChange={(e) => handleStatusUpdate(selectedContact.id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <option value="NEW">{t`Mark as New`}</option>
                      <option value="IN_PROGRESS">{t`Mark as In Progress`}</option>
                      <option value="RESPONDED">{t`Mark as Responded`}</option>
                      <option value="CLOSED">{t`Mark as Closed`}</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        setViewModalOpen(false);
                        handleDelete(selectedContact.id);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t`Delete`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setReplyModalOpen(false)}
            ></div>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t`Send Reply`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t`To`} {selectedContact.name} ({selectedContact.email})
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyModalOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t`Your Reply`}
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder={t`Type your response here...`}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 resize-none"
                    />
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          {t`Note`}
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          {t`This will mark the contact as "Responded" and send an email to the user.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setReplyModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {t`Cancel`}
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || sendingReply}
                    className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                      !replyMessage.trim() || sendingReply
                        ? 'bg-green-400 dark:bg-green-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
                    }`}
                  >
                    {sendingReply ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t`Sending...`}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t`Send Reply`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactsPage;