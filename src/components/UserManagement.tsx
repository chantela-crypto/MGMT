import React, { useState } from 'react';
import { User, UserRole } from '../types/division';
import { Division } from '../types/division';
import { Users, UserPlus, Edit, Save, X, Trash2, Shield, Mail, Calendar, Filter, Search } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
  divisions: Division[];
}

interface PlatformUser extends User {
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  permissions: string[];
}

const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  divisions,
}) => {
  const [users, setUsers] = useState<PlatformUser[]>([
    {
      id: '1',
      name: 'Chantel Allen',
      email: 'chantel@truebalance.com',
      role: 'admin',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2025-01-15'),
      isActive: true,
      permissions: ['all'],
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@truebalance.com',
      role: 'division-manager',
      divisionId: 'laser',
      createdAt: new Date('2024-03-20'),
      lastLogin: new Date('2025-01-14'),
      isActive: true,
      permissions: ['view-division', 'edit-division'],
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'michael@truebalance.com',
      role: 'executive',
      createdAt: new Date('2024-02-10'),
      lastLogin: new Date('2025-01-13'),
      isActive: true,
      permissions: ['view-all', 'reports'],
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [editingUser, setEditingUser] = useState<boolean>(false);
  const [addingUser, setAddingUser] = useState<boolean>(false);
  const [userForm, setUserForm] = useState<Partial<PlatformUser>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { 
      value: 'admin', 
      label: 'Administrator', 
      description: 'Full access to all features and data' 
    },
    { 
      value: 'division-manager', 
      label: 'Division Manager', 
      description: 'Manage specific division data and team' 
    },
    { 
      value: 'executive', 
      label: 'Executive', 
      description: 'View-only access to reports and analytics' 
    },
  ];

  const permissionOptions = [
    { id: 'view-all', label: 'View All Data', description: 'Access to view all division data' },
    { id: 'edit-all', label: 'Edit All Data', description: 'Permission to modify all data' },
    { id: 'view-division', label: 'View Division Data', description: 'Access to specific division data' },
    { id: 'edit-division', label: 'Edit Division Data', description: 'Modify specific division data' },
    { id: 'reports', label: 'Generate Reports', description: 'Create and export reports' },
    { id: 'user-management', label: 'Manage Users', description: 'Add, edit, and remove users' },
    { id: 'settings', label: 'System Settings', description: 'Configure system settings' },
  ];

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserClick = (user: PlatformUser) => {
    setSelectedUser(user);
    setUserForm(user);
  };

  const handleSaveUser = () => {
    if (userForm.id) {
      setUsers(prev => prev.map(user => 
        user.id === userForm.id ? { ...user, ...userForm } as PlatformUser : user
      ));
      setSelectedUser(userForm as PlatformUser);
      setEditingUser(false);
    }
  };

  const handleAddUser = () => {
    if (userForm.name && userForm.email && userForm.role) {
      const newUser: PlatformUser = {
        id: `user-${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        divisionId: userForm.divisionId,
        createdAt: new Date(),
        isActive: true,
        permissions: userForm.permissions || [],
      };
      setUsers(prev => [...prev, newUser]);
      setAddingUser(false);
      setUserForm({});
    }
  };

  const handleDeactivateUser = () => {
    if (!selectedUser) return;
    
    if (!selectedUser.id) {
      console.error('Cannot deactivate user without ID');
      return;
    }
    
    if (selectedUser.id === currentUser.id) {
      alert('You cannot deactivate your own account');
      return;
    }
    
    if (window.confirm(`Are you sure you want to deactivate ${selectedUser.name}?`)) {
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { ...user, isActive: false } : user
      ));
      setSelectedUser(null);
    }
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    if (!selectedUser.id) {
      console.error('Cannot delete user without ID');
      return;
    }
    
    if (selectedUser.id === currentUser.id) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (window.confirm(`Are you sure you want to permanently delete ${selectedUser.name}? This action cannot be undone.`)) {
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setSelectedUser(null);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'division-manager': return 'bg-blue-100 text-blue-800';
      case 'executive': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          </div>
          
          <button
            onClick={() => setAddingUser(true)}
            className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            />
          </div>

          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="division-manager">Division Manager</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredUsers.length}</span>
            <span className="ml-1">users found</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
              <Shield className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Administrators</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <Shield className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Division Managers</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'division-manager').length}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => {
                const division = user.divisionId ? divisions.find(d => d.id === user.divisionId) : null;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#f4647d] flex items-center justify-center text-white font-medium mr-3">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {roleOptions.find(r => r.value === user.role)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {division ? (
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${division.color}20`, color: division.color }}
                        >
                          {division.name}
                        </span>
                      ) : (
                        <span className="text-gray-500">All Divisions</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleUserClick(user)}
                        className="text-[#f4647d] hover:text-[#fd8585] mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            handleDeactivateUser();
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-[#f4647d] flex items-center justify-center text-white text-xl font-bold mr-4">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-lg text-gray-600">{selectedUser.email}</p>
                  <p className="text-sm text-gray-500">
                    {roleOptions.find(r => r.value === selectedUser.role)?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingUser(!editingUser)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editingUser ? 'Cancel Edit' : 'Edit User'}
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - User Details */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                  
                  {editingUser ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={userForm.name || ''}
                          onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={userForm.email || ''}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={userForm.role || ''}
                          onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        >
                          {roleOptions.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {userForm.role === 'division-manager' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                          <select
                            value={userForm.divisionId || ''}
                            onChange={(e) => setUserForm(prev => ({ ...prev, divisionId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                          >
                            <option value="">Select Division</option>
                            {divisions.map(division => (
                              <option key={division.id} value={division.id}>
                                {division.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userForm.isActive || false}
                          onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Active User</label>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={handleSaveUser}
                          className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </button>
                        
                        {selectedUser.id !== currentUser.id && (
                          <button
                            onClick={handleDeactivateUser}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deactivate User
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium">{roleOptions.find(r => r.value === selectedUser.role)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{selectedUser.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login:</span>
                        <span className="font-medium">{selectedUser.lastLogin?.toLocaleDateString() || 'Never'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {selectedUser.divisionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Division:</span>
                          <span className="font-medium">
                            {divisions.find(d => d.id === selectedUser.divisionId)?.name || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Permissions */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions & Access</h3>
                  
                  <div className="space-y-3">
                    {permissionOptions.map(permission => {
                      const hasPermission = selectedUser.permissions.includes(permission.id) || 
                                          selectedUser.permissions.includes('all');
                      
                      return (
                        <div key={permission.id} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={(e) => {
                                if (editingUser) {
                                  const newPermissions = e.target.checked
                                    ? [...(userForm.permissions || []), permission.id]
                                    : (userForm.permissions || []).filter(p => p !== permission.id);
                                  setUserForm(prev => ({ ...prev, permissions: newPermissions }));
                                }
                              }}
                              disabled={!editingUser || selectedUser.role === 'admin'}
                              className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3">
                            <label className="text-sm font-medium text-gray-700">
                              {permission.label}
                            </label>
                            <p className="text-xs text-gray-500">{permission.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedUser.role === 'admin' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <Shield className="h-4 w-4 inline mr-1" />
                        Administrators have full access to all features and data.
                      </p>
                    </div>
                  )}
                </div>

                {/* Activity Log */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Account created: {selectedUser.createdAt.toLocaleDateString()}</span>
                    </div>
                    {selectedUser.lastLogin && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Last login: {selectedUser.lastLogin.toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Activity logs would be displayed here in a production system.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
              <button
                onClick={() => setAddingUser(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={userForm.name || ''}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={userForm.email || ''}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={userForm.role || ''}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                >
                  <option value="">Select Role</option>
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {userForm.role && (
                  <p className="text-xs text-gray-500 mt-1">
                    {roleOptions.find(r => r.value === userForm.role)?.description}
                  </p>
                )}
              </div>

              {userForm.role === 'division-manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                  <select
                    value={userForm.divisionId || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, divisionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  >
                    <option value="">Select Division</option>
                    {divisions.map(division => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {permissionOptions.map(permission => (
                    <div key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(userForm.permissions || []).includes(permission.id)}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...(userForm.permissions || []), permission.id]
                            : (userForm.permissions || []).filter(p => p !== permission.id);
                          setUserForm(prev => ({ ...prev, permissions: newPermissions }));
                        }}
                        className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">{permission.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setAddingUser(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={!userForm.name || !userForm.email || !userForm.role}
                className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] disabled:bg-gray-400 flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;