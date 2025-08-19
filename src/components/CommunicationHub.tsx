import React, { useState } from 'react';
import { Employee } from '../types/employee';
import { Division, User } from '../types/division';
import { MessageSquare, Heart, MessageCircle, Plus, Send, Pin, Tag, Calendar, User as UserIcon, Building2, MapPin, Filter, Video } from 'lucide-react';
import LiveClassroom from './LiveClassroom';

interface CommunicationPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPosition: string;
  content: string;
  category: 'announcement' | 'update' | 'question' | 'celebration' | 'urgent' | 'policy';
  priority: 'high' | 'medium' | 'low';
  location?: string;
  division?: string;
  isPinned: boolean;
  likes: number;
  comments: PostComment[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  attachments: string[];
}

interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  likes: number;
}

interface ManagerCheckIn {
  id: string;
  managerId: string;
  managerName: string;
  location: string;
  date: Date;
  updates: string;
  concerns: string;
  actionItems: string;
  priority: 'high' | 'medium' | 'low';
  requiresLeadershipAttention: boolean;
  followUpRequired: boolean;
}

interface CommunicationHubProps {
  employees: Employee[];
  divisions: Division[];
  currentUser: User;
}

const CommunicationHub: React.FC<CommunicationHubProps> = ({
  employees,
  divisions,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'manager-checkins' | 'live-classroom'>('posts');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showPostForm, setShowPostForm] = useState<boolean>(false);
  const [showCheckInForm, setShowCheckInForm] = useState<boolean>(false);

  // Sample communication posts data
  const [communicationPosts, setCommunicationPosts] = useState<CommunicationPost[]>([
    {
      id: 'post-001',
      authorId: currentUser.id,
      authorName: 'Chantel Allen',
      authorPosition: 'COO',
      content: '🎉 Congratulations to our Laser Division for exceeding Q4 targets by 15%! Special recognition to TEAGAN for leading the team to success. Keep up the excellent work!',
      category: 'celebration',
      priority: 'high',
      isPinned: true,
      likes: 12,
      comments: [
        {
          id: 'comment-001',
          authorId: 'emp-001',
          authorName: 'TEAGAN',
          content: 'Thank you! Couldn\'t have done it without the amazing team support 💪',
          createdAt: new Date('2025-01-16T10:30:00'),
          likes: 5,
        }
      ],
      createdAt: new Date('2025-01-16T09:00:00'),
      updatedAt: new Date('2025-01-16T09:00:00'),
      tags: ['celebration', 'laser-division', 'q4-results'],
      attachments: [],
    },
    {
      id: 'post-002',
      authorId: 'emp-021',
      authorName: 'TERRI',
      authorPosition: 'Guest Experience Manager',
      content: 'New VISIA skin analysis protocol starts Monday. All front desk staff please review the updated checklist in the shared drive. Training session scheduled for 2 PM.',
      category: 'announcement',
      priority: 'medium',
      location: 'All Locations',
      isPinned: false,
      likes: 8,
      comments: [],
      createdAt: new Date('2025-01-15T14:20:00'),
      updatedAt: new Date('2025-01-15T14:20:00'),
      tags: ['visia', 'protocol', 'training'],
      attachments: ['VISIA_Protocol_v2.1.pdf'],
    },
    {
      id: 'post-003',
      authorId: 'emp-012',
      authorName: 'KAITLIN',
      authorPosition: 'Lead Injector',
      content: 'Quick reminder: New Botox shipment arrives tomorrow. Please ensure proper storage temperature is maintained. Any questions, reach out to me directly.',
      category: 'update',
      priority: 'medium',
      division: 'injectables',
      isPinned: false,
      likes: 3,
      comments: [],
      createdAt: new Date('2025-01-14T16:45:00'),
      updatedAt: new Date('2025-01-14T16:45:00'),
      tags: ['botox', 'inventory', 'storage'],
      attachments: [],
    }
  ]);

  // Sample manager check-ins data
  const [managerCheckIns, setManagerCheckIns] = useState<ManagerCheckIn[]>([
    {
      id: 'checkin-001',
      managerId: 'emp-021',
      managerName: 'TERRI',
      location: 'St. Albert',
      date: new Date('2025-01-16'),
      updates: 'New VISIA protocol implementation going smoothly. Staff adapting well to new procedures. Retail sales up 12% this week.',
      concerns: 'Scheduling conflicts with injectable appointments during peak hours. May need to adjust booking windows.',
      actionItems: '1. Review injectable booking slots\n2. Train backup staff on VISIA\n3. Order additional retail inventory',
      priority: 'medium',
      requiresLeadershipAttention: true,
      followUpRequired: true,
    },
    {
      id: 'checkin-002',
      managerId: 'emp-026',
      managerName: 'DEBBIE',
      location: 'Spruce Grove',
      date: new Date('2025-01-15'),
      updates: 'Successful launch of new client referral program. Already seeing increased bookings from existing clients.',
      concerns: 'None at this time. Team morale is high and performance metrics are on track.',
      actionItems: '1. Continue monitoring referral program metrics\n2. Prepare monthly performance reports',
      priority: 'low',
      requiresLeadershipAttention: false,
      followUpRequired: false,
    }
  ]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'announcement', label: 'Announcements' },
    { value: 'update', label: 'Updates' },
    { value: 'question', label: 'Questions' },
    { value: 'celebration', label: 'Celebrations' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'policy', label: 'Policy' }
  ];

  const locations = ['All Locations', 'St. Albert', 'Spruce Grove', 'Sherwood Park', 'Wellness', 'Remote'];

  const filteredPosts = communicationPosts.filter(post => {
    const categoryMatch = selectedCategory === 'all' || post.category === selectedCategory;
    const locationMatch = selectedLocation === 'All Locations' || !post.location || post.location === selectedLocation;
    return categoryMatch && locationMatch;
  });

  // Sort posts: pinned first, then by date
  const sortedPosts = filteredPosts.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Communication Hub</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCheckInForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Manager Check-in
            </button>
            
            <button
              onClick={() => setShowPostForm(true)}
              className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-[#f4647d] text-[#f4647d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Internal Updates
            </button>
            <button
              onClick={() => setActiveTab('manager-checkins')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manager-checkins'
                  ? 'border-[#f4647d] text-[#f4647d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manager Check-ins
            </button>
            <button
              onClick={() => setActiveTab('live-classroom')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'live-classroom'
                  ? 'border-[#f4647d] text-[#f4647d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Video className="h-4 w-4 mr-2" />
              Live Classroom
            </button>
          </nav>
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                >
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                <div className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-md">
                  {sortedPosts.length} posts • {sortedPosts.filter(p => p.isPinned).length} pinned
                </div>
              </div>
            </div>

            {/* Facebook-style Posts */}
            <div className="space-y-4">
              {sortedPosts.map(post => (
                <div key={post.id} className={`bg-white rounded-lg shadow-md p-6 ${
                  post.isPinned ? 'border-l-4 border-blue-500' : ''
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-[#f4647d] flex items-center justify-center text-white font-medium">
                      {post.authorName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">{post.authorName}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{post.authorPosition}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{post.createdAt.toLocaleDateString()}</span>
                        {post.isPinned && (
                          <div className="flex items-center">
                            <Pin className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-xs text-blue-600 font-medium">PINNED</span>
                          </div>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.priority === 'high' ? 'bg-red-100 text-red-800' :
                          post.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {post.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 mb-3 whitespace-pre-line">{post.content}</p>
                      
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex items-center space-x-2 mb-3">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {post.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location/Division Info */}
                      {(post.location || post.division) && (
                        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                          {post.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{post.location}</span>
                            </div>
                          )}
                          {post.division && (
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              <span>{post.division}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Engagement Actions */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500 border-t border-gray-100 pt-3">
                        <button className="flex items-center space-x-1 hover:text-[#f4647d] transition-colors">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes} likes</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-[#f4647d] transition-colors">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments.length} comments</span>
                        </button>
                      </div>

                      {/* Comments */}
                      {post.comments.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {post.comments.map(comment => (
                            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">{comment.authorName}</span>
                                <span className="text-xs text-gray-500">{comment.createdAt.toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-[#f4647d]">
                                  <Heart className="h-3 w-3" />
                                  <span>{comment.likes}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manager Check-ins Tab */}
        {activeTab === 'manager-checkins' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Manager Daily Check-ins</h3>
            
            <div className="space-y-4">
              {managerCheckIns.map(checkIn => (
                <div key={checkIn.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  checkIn.requiresLeadershipAttention ? 'border-red-500' : 'border-blue-500'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{checkIn.managerName}</h4>
                      <p className="text-sm text-gray-600">{checkIn.location}</p>
                      <p className="text-xs text-gray-500">{checkIn.date.toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {checkIn.requiresLeadershipAttention && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Leadership Attention
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        checkIn.priority === 'high' ? 'bg-red-100 text-red-800' :
                        checkIn.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {checkIn.priority}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Updates</h5>
                      <p className="text-sm text-gray-600 bg-green-50 rounded p-3">{checkIn.updates}</p>
                    </div>

                    {checkIn.concerns && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Concerns</h5>
                        <p className="text-sm text-gray-600 bg-yellow-50 rounded p-3">{checkIn.concerns}</p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Action Items</h5>
                      <div className="text-sm text-gray-600 bg-blue-50 rounded p-3 whitespace-pre-line">
                        {checkIn.actionItems}
                      </div>
                    </div>
                  </div>

                  {checkIn.followUpRequired && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded p-3">
                      <div className="flex items-center text-sm text-orange-800">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Follow-up required</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Classroom Tab */}
        {activeTab === 'live-classroom' && (
          <LiveClassroom
            employees={employees}
            divisions={divisions}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
};

export default CommunicationHub;