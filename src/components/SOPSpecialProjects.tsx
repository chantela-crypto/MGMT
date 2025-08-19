import React, { useState } from 'react';
import { Employee } from '../types/employee';
import { Division, User } from '../types/division';
import { FileText, CheckCircle, AlertCircle, Clock, Plus, Target, Calendar, User as UserIcon, Filter, Settings } from 'lucide-react';

interface SOPProject {
  id: string;
  title: string;
  type: 'sop-update' | 'training-module' | 'event-launch' | 'promotion-launch' | 'service-launch' | 'marketing-prep';
  description: string;
  assignedTo: string;
  createdBy: string;
  createdAt: Date;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'requested' | 'in-review' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  requiresApproval: boolean;
  managementApproval?: {
    approvedBy: string;
    approvedAt: Date;
    comments: string;
  };
  checklist: ChecklistItem[];
  completionPercentage: number;
  estimatedHours: number;
  actualHours?: number;
}

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  requiresSignOff: boolean;
  signedOffBy?: string;
  signedOffAt?: Date;
}

interface SOPSpecialProjectsProps {
  employees: Employee[];
  divisions: Division[];
  currentUser: User;
}

const SOPSpecialProjects: React.FC<SOPSpecialProjectsProps> = ({
  employees,
  divisions,
  currentUser,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [showProjectForm, setShowProjectForm] = useState<boolean>(false);

  // Sample SOP projects data
  const [sopProjects, setSOPProjects] = useState<SOPProject[]>([
    {
      id: 'sop-001',
      title: 'Update VISIA Skin Analysis Protocol',
      type: 'sop-update',
      description: 'Comprehensive update to VISIA skin analysis procedures including new compliance requirements and documentation standards',
      assignedTo: 'TERRI',
      createdBy: currentUser.id,
      createdAt: new Date('2025-01-10'),
      dueDate: new Date('2025-01-25'),
      priority: 'high',
      status: 'approved',
      requiresApproval: true,
      managementApproval: {
        approvedBy: 'Chantel Allen',
        approvedAt: new Date('2025-01-12'),
        comments: 'Critical update for compliance. Prioritize completion.'
      },
      checklist: [
        {
          id: 'check-001',
          task: 'Review current VISIA protocol documentation',
          completed: true,
          completedBy: 'TERRI',
          completedAt: new Date('2025-01-13'),
          requiresSignOff: false,
        },
        {
          id: 'check-002',
          task: 'Consult with medical director on new requirements',
          completed: true,
          completedBy: 'TERRI',
          completedAt: new Date('2025-01-14'),
          requiresSignOff: true,
          signedOffBy: 'Dr. Binns',
          signedOffAt: new Date('2025-01-14'),
        },
        {
          id: 'check-003',
          task: 'Draft updated protocol document',
          completed: false,
          requiresSignOff: true,
        },
        {
          id: 'check-004',
          task: 'Train all front desk staff on new protocol',
          completed: false,
          requiresSignOff: true,
        }
      ],
      completionPercentage: 50,
      estimatedHours: 16,
      actualHours: 8,
    },
    {
      id: 'sop-002',
      title: 'Valentine\'s Day Promotion Launch',
      type: 'promotion-launch',
      description: 'Launch comprehensive Valentine\'s Day promotion including couples packages and gift certificates',
      assignedTo: 'CAITIE',
      createdBy: currentUser.id,
      createdAt: new Date('2025-01-08'),
      dueDate: new Date('2025-02-01'),
      priority: 'medium',
      status: 'in-progress',
      requiresApproval: false,
      checklist: [
        {
          id: 'check-005',
          task: 'Design promotional materials',
          completed: true,
          completedBy: 'CAITIE',
          completedAt: new Date('2025-01-12'),
          requiresSignOff: false,
        },
        {
          id: 'check-006',
          task: 'Set up booking system for couples packages',
          completed: true,
          completedBy: 'CAITIE',
          completedAt: new Date('2025-01-15'),
          requiresSignOff: false,
        },
        {
          id: 'check-007',
          task: 'Train staff on promotion details',
          completed: false,
          requiresSignOff: true,
        },
        {
          id: 'check-008',
          task: 'Launch social media campaign',
          completed: false,
          requiresSignOff: false,
        }
      ],
      completionPercentage: 50,
      estimatedHours: 12,
      actualHours: 6,
    },
    {
      id: 'sop-003',
      title: 'New Injectable Service Launch - Sculptra',
      type: 'service-launch',
      description: 'Complete launch of Sculptra injectable service including staff training, protocols, and marketing',
      assignedTo: 'KAITLIN',
      createdBy: currentUser.id,
      createdAt: new Date('2025-01-05'),
      dueDate: new Date('2025-02-15'),
      priority: 'high',
      status: 'in-review',
      requiresApproval: true,
      checklist: [
        {
          id: 'check-009',
          task: 'Complete Sculptra certification training',
          completed: true,
          completedBy: 'KAITLIN',
          completedAt: new Date('2025-01-10'),
          requiresSignOff: true,
          signedOffBy: 'Dr. Binns',
          signedOffAt: new Date('2025-01-10'),
        },
        {
          id: 'check-010',
          task: 'Develop treatment protocols and pricing',
          completed: false,
          requiresSignOff: true,
        },
        {
          id: 'check-011',
          task: 'Order initial inventory and supplies',
          completed: false,
          requiresSignOff: true,
        },
        {
          id: 'check-012',
          task: 'Create marketing materials and patient education',
          completed: false,
          requiresSignOff: false,
        }
      ],
      completionPercentage: 25,
      estimatedHours: 24,
      actualHours: 6,
    }
  ]);

  const projectTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'sop-update', label: 'SOP Updates' },
    { value: 'training-module', label: 'Training Modules' },
    { value: 'event-launch', label: 'Event Launches' },
    { value: 'promotion-launch', label: 'Promotion Launches' },
    { value: 'service-launch', label: 'Service Launches' },
    { value: 'marketing-prep', label: 'Marketing Preparation' }
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'requested', label: 'Requested' },
    { value: 'in-review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  const filteredProjects = sopProjects.filter(project => {
    const typeMatch = selectedType === 'all' || project.type === selectedType;
    const statusMatch = selectedStatus === 'all' || project.status === selectedStatus;
    const assigneeMatch = selectedAssignee === 'all' || project.assignedTo === selectedAssignee;
    return typeMatch && statusMatch && assigneeMatch;
  });

  const pendingApprovals = sopProjects.filter(project => 
    project.requiresApproval && !project.managementApproval && project.status === 'in-review'
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">SOP & Special Projects</h2>
          </div>
          
          <button
            onClick={() => setShowProjectForm(true)}
            className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </button>
        </div>

        {/* Pending Approvals Alert */}
        {pendingApprovals.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Pending Management Approvals</h4>
                <p className="text-sm text-yellow-700">
                  {pendingApprovals.length} project{pendingApprovals.length !== 1 ? 's' : ''} awaiting management approval
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Project Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              {projectTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Staff</option>
              {employees.filter(emp => emp.isActive).map(employee => (
                <option key={employee.id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
            <div className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-md">
              {filteredProjects.length} projects found
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Projects</p>
                <p className="text-2xl font-bold">{sopProjects.length}</p>
              </div>
              <FileText className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
              </div>
              <Clock className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Completed</p>
                <p className="text-2xl font-bold">
                  {sopProjects.filter(project => project.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">In Progress</p>
                <p className="text-2xl font-bold">
                  {sopProjects.filter(project => project.status === 'in-progress').length}
                </p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{project.title}</h4>
                <p className="text-sm text-gray-600 capitalize">{project.type.replace('-', ' ')}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  project.priority === 'high' ? 'bg-red-100 text-red-800' :
                  project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {project.priority}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Assigned to:</span>
                <span className="font-medium">{project.assignedTo}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{project.dueDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress:</span>
                <span className="font-medium">{project.completionPercentage}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Est. Hours:</span>
                <span className="font-medium">{project.estimatedHours}h</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Approval Status */}
            {project.requiresApproval && (
              <div className="mb-4">
                {project.managementApproval ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="flex items-center text-sm text-green-800">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Approved: {project.managementApproval.approvedBy}</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {project.managementApproval.approvedAt.toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-center text-sm text-yellow-800">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Awaiting Management Approval</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-sm text-gray-600 mb-4">
              <p className="line-clamp-2">{project.description}</p>
            </div>

            {/* Checklist Preview */}
            <div className="bg-gray-50 rounded p-3 mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Checklist Progress</h5>
              <div className="space-y-1">
                {project.checklist.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center text-xs">
                    {item.completed ? (
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    ) : (
                      <div className="h-3 w-3 border border-gray-300 rounded-full mr-2" />
                    )}
                    <span className={item.completed ? 'text-gray-900' : 'text-gray-600'}>
                      {item.task}
                    </span>
                  </div>
                ))}
                {project.checklist.length > 3 && (
                  <div className="text-xs text-gray-500 ml-5">
                    +{project.checklist.length - 3} more items
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Created: {project.createdAt.toLocaleDateString()}</span>
              <span className={`px-2 py-1 rounded-full ${
                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                project.status === 'approved' ? 'bg-purple-100 text-purple-800' :
                project.status === 'in-review' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {project.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SOPSpecialProjects;