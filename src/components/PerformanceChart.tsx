import React from 'react';
import { KPIData, Division } from '../types/division';
import { TrendingUp, Target, Users, BarChart3 } from 'lucide-react';

interface PerformanceChartProps {
  data: KPIData[];
  divisions: Division[];
  metric: keyof Omit<KPIData, 'divisionId' | 'month' | 'year'>;
  title: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  divisions,
  metric,
  title,
}) => {
  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    const totalDivisions = divisions.length;
    const dataPoints = data.length;
    const avgMetricValue = data.length > 0 
      ? Math.round(data.reduce((sum, d) => sum + (d[metric] as number), 0) / data.length)
      : 0;
    
    return {
      totalDivisions,
      dataPoints,
      avgMetricValue,
    };
  }, [data, divisions, metric]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">
          Performance summary across {summaryMetrics.totalDivisions} division{summaryMetrics.totalDivisions !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Divisions</p>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalDivisions}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Points</p>
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.dataPoints}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average {title.split(' ')[0]}</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryMetrics.avgMetricValue}
                {metric.includes('Rate') || metric.includes('Percentage') ? '%' : ''}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;