import React, { useState } from 'react';
import { Employee } from '../types/employee';
import { Division, User } from '../types/division';
import { TrendingUp, Users, Target, Eye, CheckCircle, AlertCircle, BarChart3, DollarSign, Calendar, Filter } from 'lucide-react';
import { formatCurrency } from '../utils/scoring';

interface DailySalesData {
  id: string;
  date: Date;
  location: string;
  serviceRevenue: number;
  retailRevenue: number;
  combinedRevenue: number;
  newClients: number;
  existingClients: number;
  averageTicket: number;
  recordedBy: string;
}

interface VISIATracking {
  id: string;
  clientName: string;
  date: Date;
  location: string;
  isNewClient: boolean;
  visiaCompleted: boolean;
  treatmentBooked: boolean;
  treatmentType?: string;
  treatmentValue?: number;
  assignedTo: string;
  followUpRequired: boolean;
  complianceNotes: string;
}

interface TourTracking {
  id: string;
  prospectName: string;
  date: Date;
  location: string;
  tourGivenBy: string;
  duration: number; // minutes
  areasShown: string[];
  followUpScheduled: boolean;
  bookingMade: boolean;
  serviceBooked?: string;
  bookingValue?: number;
  notes: string;
}

interface SalesGuestExperienceProps {
  employees: Employee[];
  divisions: Division[];
  currentUser: User;
}

const SalesGuestExperience: React.FC<SalesGuestExperienceProps> = ({
  employees,
  divisions,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'daily-sales' | 'visia-tracking' | 'tour-tracking'>('daily-sales');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('week');

  // Sample daily sales data
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([
    {
      id: 'sales-001',
      date: new Date('2025-01-16'),
      location: 'St. Albert',
      serviceRevenue: 15420,
      retailRevenue: 3240,
      combinedRevenue: 18660,
      newClients: 8,
      existingClients: 24,
      averageTicket: 583,
      recordedBy: 'TERRI',
    },
    {
      id: 'sales-002',
      date: new Date('2025-01-15'),
      location: 'Spruce Grove',
      serviceRevenue: 12800,
      retailRevenue: 2890,
      combinedRevenue: 15690,
      newClients: 6,
      existingClients: 19,
      averageTicket: 628,
      recordedBy: 'DEBBIE',
    },
    {
      id: 'sales-003',
      date: new Date('2025-01-14'),
      location: 'Sherwood Park',
      serviceRevenue: 18200,
      retailRevenue: 4120,
      combinedRevenue: 22320,
      newClients: 10,
      existingClients: 28,
      averageTicket: 587,
      recordedBy: 'ADRIANA',
    }
  ]);

  // Sample VISIA tracking data
  const [visiaTracking, setVisiaTracking] = useState<VISIATracking[]>([
    {
      id: 'visia-001',
      clientName: 'Sarah Johnson',
      date: new Date('2025-01-16'),
      location: 'St. Albert',
      isNewClient: true,
      visiaCompleted: true,
      treatmentBooked: true,
      treatmentType: 'Laser Facial',
      treatmentValue: 450,
      assignedTo: 'TEAGAN',
      followUpRequired: false,
      complianceNotes: 'Full VISIA analysis completed, client very interested in laser treatments'
    },
    {
      id: 'visia-002',
      clientName: 'Michael Chen',
      date: new Date('2025-01-15'),
      location: 'Spruce Grove',
      isNewClient: true,
      visiaCompleted: false,
      treatmentBooked: false,
      assignedTo: 'NICOLE',
      followUpRequired: true,
      complianceNotes: 'Client declined VISIA, need to follow up on importance for treatment planning'
    },
    {
      id: 'visia-003',
      clientName: 'Jennifer Williams',
      date: new Date('2025-01-14'),
      location: 'Sherwood Park',
      isNewClient: true,
      visiaCompleted: true,
      treatmentBooked: true,
      treatmentType: 'Injectable Consultation',
      treatmentValue: 650,
      assignedTo: 'KATE P',
      followUpRequired: false,
      complianceNotes: 'Excellent VISIA results, client booked comprehensive injectable plan'
    }
  ]);

  // Sample tour tracking data
  const [tourTracking, setTourTracking] = useState<TourTracking[]>([
    {
      id: 'tour-001',
      prospectName: 'Amanda Rodriguez',
      date: new Date('2025-01-16'),
      location: 'St. Albert',
      tourGivenBy: 'AINSLEY',
      duration: 45,
      areasShown: ['Laser Suite', 'Injectable Room', 'Retail Area', 'Consultation Rooms'],
      followUpScheduled: true,
      bookingMade: true,
      serviceBooked: 'Laser Hair Removal Package',
      bookingValue: 1200,
      notes: 'Very interested prospect, booked full leg package immediately after tour'
    },
    {
      id: 'tour-002',
      prospectName: 'David Thompson',
      date: new Date('2025-01-15'),
      location: 'Spruce Grove',
      tourGivenBy: 'NICOLE',
      duration: 30,
      areasShown: ['Hormone Therapy Suite', 'Consultation Rooms'],
      followUpScheduled: true,
      bookingMade: false,
      notes: 'Interested in hormone therapy, needs to discuss with spouse before booking'
    }
  ]);

  const locations = ['St. Albert', 'Spruce Grove', 'Sherwood Park', 'Wellness', 'Remote'];

  const filteredSalesData = dailySalesData.filter(data => 
    selectedLocation === 'all' || data.location === selectedLocation
  );

  const filteredVisiaData = visiaTracking.filter(data => 
    selectedLocation === 'all' || data.location === selectedLocation
  );

  const filteredTourData = tourTracking.filter(data => 
    selectedLocation === 'all' || data.location === selectedLocation
  );

  // Calculate VISIA compliance rate
  const visiaComplianceRate = filteredVisiaData.length > 0
    ? Math.round((filteredVisiaData.filter(v => v.visiaCompleted).length / filteredVisiaData.length) * 100)
    : 0;

  // Calculate VISIA conversion rate
  const visiaConversionRate = filteredVisiaData.filter(v => v.visiaCompleted).length > 0
    ? Math.round((filteredVisiaData.filter(v => v.visiaCompleted && v.treatmentBooked).length / filteredVisiaData.filter(v => v.visiaCompleted).length) * 100)
    : 0;

  // Calculate tour conversion rate
  const tourConversionRate = filteredTourData.length > 0
    ? Math.round((filteredTourData.filter(t => t.bookingMade).length / filteredTourData.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Sales & Guest Experience</h2>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('daily-sales')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'daily-sales'
                  ? 'border-[#f4647d] text-[#f4647d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Daily Sales Tracker
            </button>
            <button
              onClick={() => setActiveTab('visia-tracking')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'visia-tracking'
                  ? 'border-[#f4647d] text-[#f4647d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              VISIA Compliance
            </button>
            <button
              onClick={() => setActiveTab('tour-tracking')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tour-tracking'
                  ? 'border-[#f4647d] text-[#f4647d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tour Completion
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
            <div className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-md">
              {activeTab === 'daily-sales' ? `${filteredSalesData.length} sales records` :
               activeTab === 'visia-tracking' ? `${filteredVisiaData.length} VISIA records` :
               `${filteredTourData.length} tour records`}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">VISIA Compliance</p>
                <p className="text-2xl font-bold">{visiaComplianceRate}%</p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">VISIA Conversion</p>
                <p className="text-2xl font-bold">{visiaConversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Tour Conversion</p>
                <p className="text-2xl font-bold">{tourConversionRate}%</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Daily Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(filteredSalesData.reduce((sum, data) => sum + data.combinedRevenue, 0) / Math.max(filteredSalesData.length, 1))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'daily-sales' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Daily Sales Tracker</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSalesData.map(data => (
                <div key={data.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{data.location}</h4>
                      <p className="text-sm text-gray-600">{data.date.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(data.combinedRevenue)}
                      </div>
                      <div className="text-xs text-gray-500">Total Revenue</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{formatCurrency(data.serviceRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Retail:</span>
                      <span className="font-medium">{formatCurrency(data.retailRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">New Clients:</span>
                      <span className="font-medium">{data.newClients}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Existing Clients:</span>
                      <span className="font-medium">{data.existingClients}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2">
                      <span className="text-gray-900 font-semibold">Avg Ticket:</span>
                      <span className="font-bold">{formatCurrency(data.averageTicket)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Recorded by: {data.recordedBy}</span>
                    <span>Total Clients: {data.newClients + data.existingClients}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'visia-tracking' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">VISIA Skin Analysis Compliance</h3>
              <div className="text-sm text-gray-600">
                Compliance Rate: {visiaComplianceRate}% • Conversion Rate: {visiaConversionRate}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVisiaData.map(visia => (
                <div key={visia.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  visia.visiaCompleted ? 'border-green-500' : 'border-red-500'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{visia.clientName}</h4>
                      <p className="text-sm text-gray-600">{visia.location}</p>
                      <p className="text-xs text-gray-500">{visia.date.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      {visia.treatmentValue && (
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(visia.treatmentValue)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {visia.isNewClient ? 'New Client' : 'Existing'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">VISIA Completed:</span>
                      <div className="flex items-center">
                        {visia.visiaCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={visia.visiaCompleted ? 'text-green-600' : 'text-red-600'}>
                          {visia.visiaCompleted ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Treatment Booked:</span>
                      <div className="flex items-center">
                        {visia.treatmentBooked ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={visia.treatmentBooked ? 'text-green-600' : 'text-red-600'}>
                          {visia.treatmentBooked ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Assigned to:</span>
                      <span className="font-medium">{visia.assignedTo}</span>
                    </div>
                    {visia.treatmentType && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Treatment:</span>
                        <span className="font-medium">{visia.treatmentType}</span>
                      </div>
                    )}
                  </div>

                  {visia.followUpRequired && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                      <div className="flex items-center text-sm text-yellow-800">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Follow-up required</span>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600 mb-4">
                    <p className="line-clamp-2">{visia.complianceNotes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tour-tracking' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tour Completion Tracker</h3>
              <div className="text-sm text-gray-600">
                Conversion Rate: {tourConversionRate}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTourData.map(tour => (
                <div key={tour.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  tour.bookingMade ? 'border-green-500' : 'border-yellow-500'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{tour.prospectName}</h4>
                      <p className="text-sm text-gray-600">{tour.location}</p>
                      <p className="text-xs text-gray-500">{tour.date.toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      {tour.bookingValue && (
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(tour.bookingValue)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{tour.duration} min tour</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tour by:</span>
                      <span className="font-medium">{tour.tourGivenBy}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Areas shown:</span>
                      <span className="font-medium">{tour.areasShown.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Booking made:</span>
                      <div className="flex items-center">
                        {tour.bookingMade ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                        )}
                        <span className={tour.bookingMade ? 'text-green-600' : 'text-yellow-600'}>
                          {tour.bookingMade ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    {tour.serviceBooked && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium">{tour.serviceBooked}</span>
                      </div>
                    )}
                  </div>

                  {tour.followUpScheduled && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                      <div className="flex items-center text-sm text-blue-800">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Follow-up scheduled</span>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600 mb-4">
                    <p className="line-clamp-2">{tour.notes}</p>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>Areas: {tour.areasShown.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesGuestExperience;