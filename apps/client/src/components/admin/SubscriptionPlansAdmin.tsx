// components/admin/SubscriptionPlansAdmin.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/client/api/axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  coins: number;
  interval: 'MONTHLY' | 'YEARLY';
  features: string[];
  isActive: boolean;
  createdAt: string;
  _count?: {
    subscriptions: number;
  };
}

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  coins: number;
  interval: 'MONTHLY' | 'YEARLY';
  features: string[];
  isActive: boolean;
}

export const SubscriptionPlansAdmin: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [newFeature, setNewFeature] = useState('');

  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 0,
    coins: 0,
    interval: 'MONTHLY',
    features: [],
    isActive: true
  });

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/admin/subscriptions/plans');
      setPlans(response.data);
    } catch (error) {
      toast.error('Failed to fetch subscription plans');
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/subscriptions/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/admin/subscriptions/plans/${editingPlan.id}`, formData);
        toast.success('Plan updated successfully');
      } else {
        await api.post('/admin/subscriptions/plans', formData);
        toast.success('Plan created successfully');
      }
      setShowForm(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: Number(plan.price),
      coins: plan.coins,
      interval: plan.interval,
      features: plan.features || [],
      isActive: plan.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      await api.delete(`/admin/subscriptions/plans/${planId}`);
      toast.success('Plan deleted successfully');
      fetchPlans();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleToggleStatus = async (planId: string) => {
    try {
      await api.post(`/admin/subscriptions/plans/${planId}/toggle-status`);
      toast.success('Plan status updated');
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update plan status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      coins: 0,
      interval: 'MONTHLY',
      features: [],
      isActive: true
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const calculateMonthlyPrice = (price: number, interval: string) => {
    return interval === 'YEARLY' ? (price / 12).toFixed(2) : price.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription plans and pricing</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPlan(null);
            resetForm();
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Plan
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Total Revenue (30d)</h3>
            <p className="text-2xl font-bold mt-2">
              ${typeof stats.monthlyRevenue === 'number' ? stats.monthlyRevenue.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Active Subscriptions</h3>
            <p className="text-2xl font-bold mt-2">
              {stats.totalStats.find((stat: any) => stat.status === 'ACTIVE')?._count?._all || 0}
            </p>
          </div>
          <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Total Plans</h3>
            <p className="text-2xl font-bold mt-2">{stats.planStats?.length || 0}</p>
          </div>
          <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Transactions</h3>
            <p className="text-2xl font-bold mt-2">{stats.monthlyTransactions || 0}</p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border-2 transition-all duration-200 bg-card text-card-foreground ${
              plan.isActive 
                ? 'border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700' 
                : 'border-border hover:border-border/80 opacity-70'
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    ${Number(plan.price).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">/{plan.interval.toLowerCase()}</span>
                </div>
                {plan.interval === 'YEARLY' && (
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                    ${calculateMonthlyPrice(Number(plan.price), plan.interval)}/month
                  </p>
                )}
                <p className="text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  {plan.coins.toLocaleString()} coins
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features?.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{plan._count?.subscriptions || 0} active subscribers</span>
                <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="border-t bg-muted/50 px-6 py-4 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit Plan"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(plan.id)}
                    className="p-2 text-muted-foreground hover:text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                    title={plan.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {plan.isActive ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <XMarkIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete Plan"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => {/* Navigate to analytics */}}
                  className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10 rounded-lg transition-colors"
                  title="View Analytics"
                >
                  <ChartBarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-2xl border shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    placeholder="e.g., Professional Plan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Interval *
                  </label>
                  <select
                    value={formData.interval}
                    onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value as 'MONTHLY' | 'YEARLY' }))}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Coins *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.coins}
                    onChange={(e) => setFormData(prev => ({ ...prev, coins: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  placeholder="Describe what this plan offers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Features
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    placeholder="Add a feature..."
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg">
                      <span className="text-sm">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm">
                  Plan is active and available for purchase
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="px-6 py-2 text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};