import React, { useState } from 'react';
import { KPIData, Division } from '../types/division';
import PerformanceChart from './PerformanceChart';
import { TrendingUp, Clock, Users, Target, DollarSign } from 'lucide-react';

interface TrendsProps {
  kpiData: KPIData[];
  divisions: Division[];
}

const Trends: React.FC<TrendsProps> = ({ kpiData, divisions }) => {
  const [selectedMetric, setSelectedMetric] = useState<keyof Omit<KPIData, 'divisionId' | 'month' | 'year'>>('productivityRate');

  const metrics = [
    { key: 'productivityRate', label: 'Productivity Rate' },
    { key: 'prebookRate', label: 'Prebook Rate' },
    { key: 'firstTimeRetentionRate', label: 'First-Time Retention Rate' },
    { key: 'repeatRetentionRate', label: 'Repeat Retention Rate' },
    { key: 'retailPercentage', label: 'Retail Percentage' },
    { key: 'newClients', label: 'New Clients' },
    { key: 'averageTicket', label: 'Average Ticket' },
    { key: 'serviceSalesPerHour', label: 'Service Sales per Hour' },
    { key: 'clientsRetailPercentage', label: 'Clients Retail Percentage' },
    { key: 'hoursSold', label: 'Hours Sold' },
    { key: 'happinessScore', label: 'Happiness Score' },
    { key: 'netCashPercentage', label: 'Net Cash Percentage' },
  ];

  // Get current month data
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const currentMonthData = kpiData.filter(
    data => data.month === currentMonth && data.year === currentYear
  );

  // Calculate overall metrics
  const getOverallMetrics = () => {
    if (currentMonthData.length === 0) return null;

    const totalHoursSold = currentMonthData.reduce((sum, d) => sum + d.hoursSold, 0);
    const totalNewClients = currentMonthData.reduce((sum, d) => sum + d.newClients, 0);
    const avgProductivity = currentMonthData.reduce((sum, d) => sum + d.productivityRate, 0) / currentMonthData.length;
    const avgRetailPercentage = currentMonthData.reduce((sum, d) => sum + d.retailPercentage, 0) / currentMonthData.length;

    return {
      totalHoursSold,
      totalNewClients,
      avgProductivity,
      avgRetailPercentage,
    };
  };

  const metrics_data = getOverallMetrics();

  const cards = [
    {
      title: 'Total Hours Sold',
      value: metrics_data?.totalHoursSold?.toLocaleString() || '0',
      target: 1200,
      icon: Clock,
      color: '#ef4444',
    },
    {
      title: 'New Clients',
      value: metrics_data?.totalNewClients?.toLocaleString() || '0',
      target: 300,
      icon: Users,
      color: '#ef4444',
    },
    {
      title: 'Avg Productivity',
      value: `${metrics_data?.avgProductivity?.toFixed(1) || '0'}%`,
      target: 85,
      icon: Target,
      color: '#ef4444',
    },
    {
      title: 'Avg Retail %',
      value: `${metrics_data?.avgRetailPercentage?.toFixed(1) || '0'}%`,
      target: 25,
      icon: DollarSign,
      color: '#ef4444',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-6 w-6 text-[#f4647d] mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Trends & Analytics</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Metric
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as keyof Omit<KPIData, 'divisionId' | 'month' | 'year'>)}
            className="max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
          >
            {metrics.map(metric => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clean Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {cards.map((card, index) => {
            const actualValue = parseFloat(card.value.replace(/[%,]/g, ''));
            const percentage = Math.min(Math.round((actualValue / card.target) * 100), 100);
            
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                {/* Header with title and icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">{card.title}</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {card.value}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${card.color}15` }}
                    >
                      <card.icon 
                        className="w-6 h-6" 
                        style={{ color: card.color }}
                      />
                    </div>
                  </div>
                </div>

                {/* Target and percentage */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    Target: {card.target.toLocaleString()}
                  </span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: card.color }}
                  >
                    {percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: card.color,
                      }}
                    />
                  </div>
                  
                  {/* Progress bar labels */}
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Chart */}
        <div className="mb-6">
          <PerformanceChart
            data={kpiData}
            divisions={divisions}
            metric={selectedMetric}
            title={`${metrics.find(m => m.key === selectedMetric)?.label} Trends`}
          />
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Divisions</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{divisions.length}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Data Points</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{kpiData.length}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Selected Metric</h3>
                <div className="text-lg font-bold text-gray-900 mb-1">{metrics.find(m => m.key === selectedMetric)?.label}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trends;