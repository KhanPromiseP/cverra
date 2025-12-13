import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/client/api/axios';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  EnvelopeOpenIcon,
  CreditCardIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  emailVerified: boolean;
  _count: {
    resumes: number;
    coverLetters: number;
    payments: number;
    subscriptions: number;
  };
}

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN' | 'SUPER_ADMIN'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      setShowDeleteConfirm(null);
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users and their permissions</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg">
          <UserPlusIcon className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm">
          <div className="text-2xl font-bold text-foreground">{users.length}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
        <div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm">
          <div className="text-2xl font-bold text-foreground">
            {users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}
          </div>
          <div className="text-sm text-muted-foreground">Admins</div>
        </div>
        <div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm">
          <div className="text-2xl font-bold text-foreground">
            {users.reduce((acc, user) => acc + user._count.resumes, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Resumes</div>
        </div>
        <div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm">
          <div className="text-2xl font-bold text-foreground">
            {users.reduce((acc, user) => acc + user._count.coverLetters, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Letters</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">Users</option>
              <option value="ADMIN">Admins</option>
              <option value="SUPER_ADMIN">Super Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                  Statistics
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">
                          {getInitials(user.name)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-base font-semibold text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          {user.email}
                          {!user.emailVerified && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full border">
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                      className="text-sm border border-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-foreground">
                        <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                        <span>{user._count.resumes} resumes</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <EnvelopeOpenIcon className="h-4 w-4 text-green-500" />
                        <span>{user._count.coverLetters} letters</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <CreditCardIcon className="h-4 w-4 text-purple-500" />
                        <span>{user._count.payments} payments</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <BellIcon className="h-4 w-4 text-orange-500" />
                        <span>{user._count.subscriptions} subs</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <UsersIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-2xl border shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">User Details</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {getInitials(selectedUser.name)}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{selectedUser.name}</h4>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Role:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Email Verified:</span>
                    <span className={`ml-2 font-medium ${selectedUser.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedUser.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Resumes:</span>
                    <span className="ml-2 font-semibold">{selectedUser._count.resumes}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Cover Letters:</span>
                    <span className="ml-2 font-semibold">{selectedUser._count.coverLetters}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h5 className="font-semibold text-sm text-foreground mb-2">Activity Summary</h5>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payments:</span>
                    <span className="font-semibold">{selectedUser._count.payments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subscriptions:</span>
                    <span className="font-semibold">{selectedUser._count.subscriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2 text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Add edit functionality here
                  setSelectedUser(null);
                }}
                className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-2xl border shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">Confirm Deletion</h3>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-2 text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(showDeleteConfirm)}
                  className="px-6 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};