"use client"

import { useState } from 'react'
import { Search, Filter, DollarSign, Users, Clock, XCircle, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionUser {
  id: string
  name: string
  email: string
  userType: string
  subscriptionStatus: string
  subscriptionPlan: string
  subscriptionDate: string
  subscriptionStartDate: string
  subscriptionEndDate: string
  daysRemaining: number
  joined: string
}

interface Stats {
  totalUsers: number
  activeSubscriptions: number
  freeUsers: number
  trialUsers: number
  expiredUsers: number
  monthlyRevenue: string
}

interface Props {
  initialUsers: SubscriptionUser[]
  stats: Stats
}

export function SubscriptionManagementClient({ initialUsers, stats }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<SubscriptionUser | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState<{
    status: string
    plan: string
    startDate: string
    endDate: string
  }>({ status: '', plan: '', startDate: '', endDate: '' })

  const supabase = createClient()

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.subscriptionStatus === statusFilter
    const matchesPlan = planFilter === 'all' || user.subscriptionPlan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'trial': return 'bg-blue-100 text-blue-700'
      case 'free': return 'bg-gray-100 text-gray-700'
      case 'expired': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch(plan) {
      case 'basic': return 'bg-slate-100 text-slate-700'
      case 'pro': return 'bg-purple-100 text-purple-700'
      case 'premium': return 'bg-indigo-100 text-indigo-700'
      case 'enterprise': return 'bg-pink-100 text-pink-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleView = (user: SubscriptionUser) => {
    setSelectedUser(user)
    setViewDialogOpen(true)
  }

  const handleEdit = (user: SubscriptionUser) => {
    setSelectedUser(user)
    // Convert date formats for input fields
    const startDate = user.subscriptionStartDate !== 'N/A' 
      ? new Date(user.subscriptionStartDate).toISOString().split('T')[0] 
      : ''
    const endDate = user.subscriptionEndDate !== 'N/A' 
      ? new Date(user.subscriptionEndDate).toISOString().split('T')[0] 
      : ''
    
    setEditForm({
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      startDate,
      endDate
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: editForm.status,
          subscription_plan: editForm.plan,
          subscription_start_date: editForm.startDate || null,
          subscription_end_date: editForm.endDate || null
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Calculate days remaining
      const daysRemaining = editForm.endDate 
        ? Math.ceil((new Date(editForm.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0

      // Format dates for display
      const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { 
              ...u, 
              subscriptionStatus: editForm.status,
              subscriptionPlan: editForm.plan,
              subscriptionStartDate: formatDate(editForm.startDate),
              subscriptionEndDate: formatDate(editForm.endDate),
              daysRemaining: daysRemaining > 0 ? daysRemaining : 0
            }
          : u
      ))

      showToast('success', 'Subscription updated successfully')
      setEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating subscription:', error)
      showToast('error', 'Failed to update subscription')
    } finally {
      setIsSaving(false)
    }
  }

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
      type === 'success' ? 'bg-green-600' :
      type === 'error' ? 'bg-red-600' :
      'bg-blue-600'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-1">Manage user subscriptions and billing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Paid</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</div>
            <p className="text-xs text-gray-500 mt-1">paying users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Free Users</CardTitle>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.freeUsers}</div>
            <p className="text-xs text-gray-500 mt-1">on free plan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Trial</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.trialUsers}</div>
            <p className="text-xs text-gray-500 mt-1">in trial period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expired</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.expiredUsers}</div>
            <p className="text-xs text-gray-500 mt-1">need renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₱{stats.monthlyRevenue}</div>
            <p className="text-xs text-gray-500 mt-1">recurring revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="free">Free</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic (₱299)</option>
              <option value="pro">Pro (₱599)</option>
              <option value="premium">Premium (₱999)</option>
              <option value="enterprise">Enterprise (₱1,999)</option>
              <option value="none">No Plan</option>
            </select>
            <button 
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setPlanFilter('all')
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Subscriptions ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">USER</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">PLAN</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">STATUS</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">START DATE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">END DATE</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">DAYS LEFT</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getPlanBadgeColor(user.subscriptionPlan)}`}>
                          {user.subscriptionPlan}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(user.subscriptionStatus)}`}>
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{user.subscriptionStartDate}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{user.subscriptionEndDate}</td>
                      <td className="py-4 px-4">
                        {user.daysRemaining > 0 ? (
                          <span className={`font-medium text-sm ${
                            user.daysRemaining <= 7 ? 'text-red-600' :
                            user.daysRemaining <= 30 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {user.daysRemaining} days
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleView(user)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      {viewDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Subscription Details</h2>
                <p className="text-sm text-gray-500 mt-1">View user subscription information</p>
              </div>
              <button
                onClick={() => setViewDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Plan</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedUser.subscriptionPlan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedUser.subscriptionStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Start Date</p>
                  <p className="font-medium text-gray-900">{selectedUser.subscriptionStartDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">End Date</p>
                  <p className="font-medium text-gray-900">{selectedUser.subscriptionEndDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Days Remaining</p>
                  <p className={`font-medium ${
                    selectedUser.daysRemaining <= 7 ? 'text-red-600' :
                    selectedUser.daysRemaining <= 30 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {selectedUser.daysRemaining > 0 ? `${selectedUser.daysRemaining} days` : 'Expired'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Joined</p>
                  <p className="font-medium text-gray-900">{selectedUser.joined}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setViewDialogOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialogOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Subscription</h2>
                <p className="text-sm text-gray-500 mt-1">Update subscription information</p>
              </div>
              <button
                onClick={() => setEditDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="free">Free</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="none">No Plan</option>
                  <option value="basic">Basic (₱299/month)</option>
                  <option value="pro">Pro (₱599/month)</option>
                  <option value="premium">Premium (₱999/month)</option>
                  <option value="enterprise">Enterprise (₱1,999/month)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setEditDialogOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}