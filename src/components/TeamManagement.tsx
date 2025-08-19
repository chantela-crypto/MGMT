import React, { useState } from 'react';
import { Employee } from '../types/employee';
import { Division, User } from '../types/division';
import { Target, Award, CheckCircle, X, Save, Edit, Plus, User as UserIcon, Calendar, Star, TrendingUp, Users, BarChart3, AlertCircle, Clock, MessageSquare, FileText } from 'lucide-react';

interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewPeriod: '30-day' | '60-day' | '90-day' | 'quarterly' | 'annual';
  reviewDate: Date;
  reviewerName: string;
  overallRating: number; // 1-10
  kpiScores: {
    productivity: number;
    salesPerformance: number;
    customerSatisfaction: number;
    teamwork: number;
    attendance: number;
    professionalDevelopment: number;
  };
  strengths: string;
  areasForImprovement: string;
  goals: PerformanceGoal[];
  actionPlan: string;
  nextReviewDate: Date;
  employeeComments: string;
  managerSignOff: {
    signedBy: string;
    signedAt: Date;
    approved: boolean;
  };
  employeeAcknowledgment: {
    acknowledgedBy: string;
    acknowledgedAt: Date;
    agreedToGoals: boolean;
  };
  status: 'draft' | 'pending-employee' | 'completed';
}

interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'sales' | 'customer-service' | 'professional-development' | 'teamwork';
  targetDate: Date;
  measurableOutcome: string;
  progress: number; // 0-100%
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  notes: string;
}

interface TeamManagementProps {
  employees: Employee[];
  divisions: Division[];
  currentUser: User;
  onUpdateEmployee: (employee: Employee) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
  employees,
  divisions,
  currentUser,
  onUpdateEmployee,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [showGoalForm, setShowGoalForm] = useState<boolean>(false);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');

  // Sample performance reviews data
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([
    {
      id: 'review-001',
      employeeId: 'emp-001',
      reviewPeriod: 'quarterly',
      reviewDate: new Date('2025-01-15'),
      reviewerName: 'Chantel Allen',
      overallRating: 8.5,
      kpiScores: {
        productivity: 9,
        salesPerformance: 8,
        customerSatisfaction: 9,
        teamwork: 8,
        attendance: 9,
        professionalDevelopment: 8,
      },
      strengths: 'Excellent technical skills, strong client relationships, consistently exceeds productivity targets',
      areasForImprovement: 'Could improve retail sales techniques, opportunity to mentor junior staff',
      goals: [
        {
          id: 'goal-001',
          title: 'Increase Retail Sales',
          description: 'Improve retail sales percentage from 15% to 25%',
          category: 'sales',
          targetDate: new Date('2025-04-15'),
          measurableOutcome: 'Achieve 25% retail sales percentage for 3 consecutive months',
          progress: 30,
          status: 'in-progress',
          notes: 'Making good progress with new product knowledge training',
        },
        {
          id: 'goal-002',
          title: 'Mentor New Team Members',
          description: 'Take on mentoring role for new laser technicians',
          category: 'professional-development',
          targetDate: new Date('2025-06-15'),
          measurableOutcome: 'Successfully mentor 2 new team members through probation',
          progress: 0,
          status: 'not-started',
          notes: 'Will begin when next new hire starts',
        }
      ],
      actionPlan: 'Focus on retail sales training, begin leadership development program, maintain current excellent performance levels',
      nextReviewDate: new Date('2025-04-15'),
      employeeComments: 'Excited about the mentoring opportunity and committed to improving retail sales',
      managerSignOff: {
        signedBy: 'Chantel Allen',
        signedAt: new Date('2025-01-15'),
        approved: true,
      },
      employeeAcknowledgment: {
        acknowledgedBy: 'TEAGAN',
        acknowledgedAt: new Date('2025-01-16'),
        agreedToGoals: true,
      },
      status: 'completed',
    }
  ]);

  const [performanceGoals, setPerformanceGoals] = useState<PerformanceGoal[]>([]);

  const filteredEmployees = selectedDivision === 'all' 
    ? employees.filter(emp => emp.isActive)
    : employees.filter(emp => emp.divisionId === selectedDivision && emp.isActive);

  const getEmployeeReviews = (employeeId: string) => {
    return performanceReviews.filter(review => review.employeeId === employeeId)
      .sort((a, b) => b.reviewDate.getTime() - a.reviewDate.getTime());
  };

  const getEmployeeGoals = (employeeId: string) => {
    const reviews = getEmployeeReviews(employeeId);
    return reviews.flatMap(review => review.goals);
  };

  const calculateOverallScore = (kpiScores: any) => {
    const scores = Object.values(kpiScores) as number[];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const getPerformanceColor = (rating: number): string => {
    if (rating >= 9) return 'text-green-600';
    if (rating >= 7) return 'text-yellow-600';
    if (rating >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (rating: number): string => {
    if (rating >= 9) return 'bg-green-100 text-green-800';
    if (rating >= 7) return 'bg-yellow-100 text-yellow-800';
    if (rating >= 5) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getGoalStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveEmployee = () => {
    if (!editingEmployee || !employeeForm.id) {
      alert('No employee selected for editing');
      return;
    }
    
    onUpdateEmployee(employeeForm as Employee);
    setSelectedEmployee(employeeForm as Employee);
    setEditingEmployee(false);
  };

  const handleCreateReview = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setEditingReview(null);
    setShowReviewForm(true);
  };

  const handleEditReview = (review: PerformanceReview) => {
    setEditingReview(review);
    setSelectedEmployee(review.employeeId);
    setShowReviewForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Performance Reviews & Goal Setting</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Divisions</option>
              {divisions.map(division => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Review
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Employees</p>
                <p className="text-2xl font-bold">{filteredEmployees.length}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Reviews Completed</p>
                <p className="text-2xl font-bold">{performanceReviews.filter(r => r.status === 'completed').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Goals</p>
                <p className="text-2xl font-bold">
                  {performanceReviews.flatMap(r => r.goals).filter(g => g.status === 'in-progress').length}
                </p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Performance</p>
                <p className="text-2xl font-bold">
                  {performanceReviews.length > 0 
                    ? (performanceReviews.reduce((sum, r) => sum + r.overallRating, 0) / performanceReviews.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <Award className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Employee Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map(employee => {
          const division = divisions.find(d => d.id === employee.divisionId);
          const recentReview = getEmployeeReviews(employee.id)[0];
          const employeeGoals = getEmployeeGoals(employee.id);
          const activeGoals = employeeGoals.filter(goal => goal.status === 'in-progress');
          const completedGoals = employeeGoals.filter(goal => goal.status === 'completed');

          return (
            <div 
              key={employee.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 p-6"
              style={{ borderLeftColor: division?.color }}
            >
              <div className="flex items-center mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-3"
                  style={{ backgroundColor: division?.color }}
                >
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                  <p className="text-xs text-gray-500">{division?.name}</p>
                </div>
              </div>

              {/* Performance Summary */}
              {recentReview ? (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Rating:</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className={`font-bold ${getPerformanceColor(recentReview.overallRating)}`}>
                        {recentReview.overallRating}/10
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Review:</span>
                    <span className="text-sm font-medium">{recentReview.reviewDate.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Next Review:</span>
                    <span className="text-sm font-medium">{recentReview.nextReviewDate.toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Goals:</span>
                    <span className="text-sm font-medium">{activeGoals.length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Goals:</span>
                    <span className="text-sm font-medium text-green-600">{completedGoals.length}</span>
                  </div>

                  {/* Performance Badge */}
                  <div className="flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceBadge(recentReview.overallRating)}`}>
                      {recentReview.overallRating >= 9 ? 'Exceptional' :
                       recentReview.overallRating >= 7 ? 'Meets Expectations' :
                       recentReview.overallRating >= 5 ? 'Needs Improvement' : 'Below Expectations'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm text-amber-600">No performance review</p>
                  <p className="text-xs text-gray-500">Click to create first review</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleCreateReview(employee.id)}
                  className="w-full px-3 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] text-sm flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {recentReview ? 'New Review' : 'Create Review'}
                </button>
                
                {recentReview && (
                  <button
                    onClick={() => handleEditReview(recentReview)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Review
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setSelectedEmployee(employee.id);
                    setShowGoalForm(true);
                  }}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center justify-center"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Set Goals
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Performance Reviews</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key Strengths
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Goals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Review
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
              {performanceReviews
                .filter(review => {
                  const employee = employees.find(emp => emp.id === review.employeeId);
                  return selectedDivision === 'all' || employee?.divisionId === selectedDivision;
                })
                .map(review => {
                  const employee = employees.find(emp => emp.id === review.employeeId);
                  const division = divisions.find(d => d.id === employee?.divisionId);
                  const activeGoals = review.goals.filter(goal => goal.status === 'in-progress');
                  
                  return (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                            style={{ backgroundColor: division?.color }}
                          >
                            {employee?.name.split(' ').map(n => n[0]).join('') || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{employee?.position || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {review.reviewPeriod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className={`font-bold ${getPerformanceColor(review.overallRating)}`}>
                            {review.overallRating}/10
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {review.strengths}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900">{activeGoals.length}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {review.nextReviewDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          review.status === 'completed' ? 'bg-green-100 text-green-800' :
                          review.status === 'pending-employee' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {review.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="text-[#f4647d] hover:text-[#fd8585] mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goal Tracking Dashboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Goal Tracking Dashboard</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performanceReviews.flatMap(review => review.goals).map(goal => {
            const employee = employees.find(emp => emp.id === performanceReviews.find(r => r.goals.includes(goal))?.employeeId);
            const division = divisions.find(d => d.id === employee?.divisionId);
            const isOverdue = new Date() > goal.targetDate && goal.status !== 'completed';
            
            return (
              <div key={goal.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGoalStatusColor(goal.status)}`}>
                    {goal.status.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Employee:</span>
                    <span className="font-medium">{employee?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{goal.category.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Target Date:</span>
                    <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {goal.targetDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.status === 'completed' ? 'bg-green-500' :
                        goal.progress >= 75 ? 'bg-blue-500' :
                        goal.progress >= 50 ? 'bg-yellow-500' :
                        goal.progress >= 25 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <p className="line-clamp-2">{goal.description}</p>
                </div>

                {isOverdue && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                    <div className="flex items-center text-xs text-red-800">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Overdue</span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p><strong>Outcome:</strong> {goal.measurableOutcome}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingReview ? 'Edit Performance Review' : 'Create Performance Review'}
                </h3>
                <p className="text-gray-600">
                  {selectedEmployee ? employees.find(emp => emp.id === selectedEmployee)?.name : 'Select Employee'}
                </p>
              </div>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Employee Selection */}
              {!editingReview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  >
                    <option value="">Choose an employee</option>
                    {filteredEmployees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Review Period and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review Period</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]">
                    <option value="30-day">30-Day Review</option>
                    <option value="60-day">60-Day Review</option>
                    <option value="90-day">90-Day Review</option>
                    <option value="quarterly">Quarterly Review</option>
                    <option value="annual">Annual Review</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review Date</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  />
                </div>
              </div>

              {/* KPI Scores */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">KPI Performance Scores (1-10)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'productivity', label: 'Productivity' },
                    { key: 'salesPerformance', label: 'Sales Performance' },
                    { key: 'customerSatisfaction', label: 'Customer Satisfaction' },
                    { key: 'teamwork', label: 'Teamwork' },
                    { key: 'attendance', label: 'Attendance' },
                    { key: 'professionalDevelopment', label: 'Professional Development' },
                  ].map(score => (
                    <div key={score.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{score.label}</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        defaultValue={editingReview?.kpiScores[score.key as keyof typeof editingReview.kpiScores] || 5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths and Areas for Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Strengths</label>
                  <textarea
                    defaultValue={editingReview?.strengths || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    rows={4}
                    placeholder="Highlight the employee's key strengths and achievements..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Improvement</label>
                  <textarea
                    defaultValue={editingReview?.areasForImprovement || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    rows={4}
                    placeholder="Identify specific areas where the employee can grow..."
                  />
                </div>
              </div>

              {/* Action Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Plan & Development Opportunities</label>
                <textarea
                  defaultValue={editingReview?.actionPlan || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  rows={3}
                  placeholder="Outline specific actions and development opportunities..."
                />
              </div>

              {/* Next Review Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Review Date</label>
                <input
                  type="date"
                  defaultValue={editingReview?.nextReviewDate.toISOString().split('T')[0] || 
                    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                />
              </div>

              {/* Employee Comments Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Comments</label>
                <textarea
                  defaultValue={editingReview?.employeeComments || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  rows={3}
                  placeholder="Employee feedback and comments on the review..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save review logic would go here
                    setShowReviewForm(false);
                  }}
                  className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingReview ? 'Update Review' : 'Create Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Setting Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Set Performance Goals</h3>
                <p className="text-gray-600">
                  {selectedEmployee ? employees.find(emp => emp.id === selectedEmployee)?.name : 'Select Employee'}
                </p>
              </div>
              <button
                onClick={() => setShowGoalForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  placeholder="Enter a clear, specific goal title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Category</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]">
                  <option value="productivity">Productivity</option>
                  <option value="sales">Sales Performance</option>
                  <option value="customer-service">Customer Service</option>
                  <option value="professional-development">Professional Development</option>
                  <option value="teamwork">Teamwork & Collaboration</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  rows={3}
                  placeholder="Describe the goal in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Measurable Outcome</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  rows={2}
                  placeholder="Define how success will be measured..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                <input
                  type="date"
                  defaultValue={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowGoalForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save goal logic would go here
                    setShowGoalForm(false);
                  }}
                  className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Set Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;