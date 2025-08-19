import React, { useMemo } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division } from '../types/division';
import { 
  BarChart3, TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  Target, Award, Zap, Shield, Eye, Activity, Star, Users,
  Brain, Lightbulb, TrendingDown as Decline, TrendingUp as Improve
} from 'lucide-react';

interface PerformanceInsightsTabProps {
  employee: Employee;
  division: Division;
  employeeKPIData: EmployeeKPIData[];
  selectedMonth: string;
  selectedYear: number;
}

interface PerformanceInsights {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  strengths: Array<{
    metric: string;
    score: number;
    description: string;
  }>;
  improvements: Array<{
    metric: string;
    score: number;
    description: string;
    recommendation: string;
  }>;
  recommendations: Array<{
    type: 'immediate' | 'short-term' | 'long-term';
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }>;
  trendAnalysis: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
}

const PerformanceInsightsTab: React.FC<PerformanceInsightsTabProps> = ({
  employee,
  division,
  employeeKPIData,
  selectedMonth,
  selectedYear,
}) => {
  // Calculate comprehensive performance insights
  const performanceInsights = useMemo((): PerformanceInsights => {
    const currentData = employeeKPIData.find(data => 
      data.employeeId === employee.id && 
      data.month === selectedMonth && 
      data.year === selectedYear
    );

    const previousData = employeeKPIData.find(data => 
      data.employeeId === employee.id && 
      data.month === (parseInt(selectedMonth) - 1).toString().padStart(2, '0') && 
      data.year === selectedYear
    );

    if (!currentData) {
      return {
        overallScore: 0,
        riskLevel: 'high',
        strengths: [],
        improvements: [],
        recommendations: [],
        trendAnalysis: { improving: [], declining: [], stable: [] },
      };
    }

    // Define performance metrics with weights and targets
    const metrics = [
      { 
        key: 'productivityRate', 
        name: 'Productivity Rate',
        weight: 0.25, 
        target: 85, 
        description: 'Efficiency in converting scheduled hours to booked hours'
      },
      { 
        key: 'retailPercentage', 
        name: 'Retail Sales',
        weight: 0.20, 
        target: 25, 
        description: 'Success in retail product sales and upselling'
      },
      { 
        key: 'happinessScore', 
        name: 'Employee Satisfaction',
        weight: 0.15, 
        target: 8.5, 
        multiplier: 10,
        description: 'Overall job satisfaction and workplace happiness'
      },
      { 
        key: 'attendanceRate', 
        name: 'Attendance',
        weight: 0.15, 
        target: 95,
        description: 'Reliability and consistency in attendance'
      },
      { 
        key: 'customerSatisfactionScore', 
        name: 'Customer Satisfaction',
        weight: 0.15, 
        target: 9.0, 
        multiplier: 10,
        description: 'Client satisfaction and service quality'
      },
      { 
        key: 'newClients', 
        name: 'New Client Acquisition',
        weight: 0.10, 
        target: 30,
        description: 'Success in attracting and converting new clients'
      },
    ];

    let totalScore = 0;
    const strengths: PerformanceInsights['strengths'] = [];
    const improvements: PerformanceInsights['improvements'] = [];
    const trendAnalysis = { improving: [] as string[], declining: [] as string[], stable: [] as string[] };

    metrics.forEach(metric => {
      const currentValue = currentData[metric.key as keyof EmployeeKPIData] as number;
      const previousValue = previousData?.[metric.key as keyof EmployeeKPIData] as number;
      const adjustedValue = metric.multiplier ? currentValue * metric.multiplier : currentValue;
      const score = Math.min((adjustedValue / metric.target) * 100, 120);
      totalScore += score * metric.weight;

      // Identify strengths (>110% of target)
      if (score >= 110) {
        strengths.push({
          metric: metric.name,
          score: Math.round(score),
          description: `Exceptional performance in ${metric.description.toLowerCase()}`,
        });
      }

      // Identify improvement areas (<80% of target)
      if (score < 80) {
        const recommendations = {
          'productivityRate': 'Focus on time management and booking optimization',
          'retailPercentage': 'Enhance product knowledge and sales techniques',
          'happinessScore': 'Address workplace satisfaction and engagement',
          'attendanceRate': 'Improve reliability and schedule adherence',
          'customerSatisfactionScore': 'Enhance service delivery and client communication',
          'newClients': 'Develop client acquisition and conversion skills',
        };

        improvements.push({
          metric: metric.name,
          score: Math.round(score),
          description: `Below target performance in ${metric.description.toLowerCase()}`,
          recommendation: recommendations[metric.key as keyof typeof recommendations] || 'Focus on improvement',
        });
      }

      // Trend analysis
      if (previousValue) {
        const previousAdjusted = metric.multiplier ? previousValue * metric.multiplier : previousValue;
        const change = ((adjustedValue - previousAdjusted) / previousAdjusted) * 100;
        
        if (change > 5) {
          trendAnalysis.improving.push(metric.name);
        } else if (change < -5) {
          trendAnalysis.declining.push(metric.name);
        } else {
          trendAnalysis.stable.push(metric.name);
        }
      }
    });

    const overallScore = Math.round(totalScore);
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (overallScore >= 100) riskLevel = 'low';
    else if (overallScore >= 80) riskLevel = 'medium';
    else riskLevel = 'high';

    // Generate tailored recommendations
    const recommendations: PerformanceInsights['recommendations'] = [];
    
    if (overallScore >= 110) {
      recommendations.push({
        type: 'immediate',
        action: 'Consider for leadership development opportunities',
        priority: 'medium',
        expectedImpact: 'Career advancement and team leadership skills',
      });
      recommendations.push({
        type: 'short-term',
        action: 'Assign mentoring responsibilities for junior staff',
        priority: 'low',
        expectedImpact: 'Knowledge transfer and team development',
      });
    } else if (overallScore >= 100) {
      recommendations.push({
        type: 'immediate',
        action: 'Maintain current performance levels with regular check-ins',
        priority: 'low',
        expectedImpact: 'Sustained high performance',
      });
      recommendations.push({
        type: 'short-term',
        action: 'Focus on consistency across all performance metrics',
        priority: 'medium',
        expectedImpact: 'Balanced performance improvement',
      });
    } else if (overallScore >= 80) {
      recommendations.push({
        type: 'immediate',
        action: 'Implement targeted coaching in underperforming areas',
        priority: 'high',
        expectedImpact: 'Focused improvement in weak areas',
      });
      recommendations.push({
        type: 'short-term',
        action: 'Provide additional training and resources',
        priority: 'medium',
        expectedImpact: 'Skill development and knowledge enhancement',
      });
    } else {
      recommendations.push({
        type: 'immediate',
        action: 'Develop comprehensive performance improvement plan',
        priority: 'high',
        expectedImpact: 'Significant performance recovery',
      });
      recommendations.push({
        type: 'immediate',
        action: 'Schedule weekly one-on-one coaching sessions',
        priority: 'high',
        expectedImpact: 'Close monitoring and rapid improvement',
      });
      recommendations.push({
        type: 'short-term',
        action: 'Consider additional support resources and training',
        priority: 'high',
        expectedImpact: 'Comprehensive skill and performance development',
      });
    }

    return {
      overallScore,
      riskLevel,
      strengths,
      improvements,
      recommendations,
      trendAnalysis,
    };
  }, [employee, employeeKPIData, selectedMonth, selectedYear]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'high': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4"
              style={{ backgroundColor: division.color }}
            >
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{employee.name}</h3>
              <p className="text-lg text-gray-600">{employee.position}</p>
              <p className="text-sm text-gray-500">{division.name}</p>
            </div>
          </div>
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3 ${getRiskBgColor(performanceInsights.riskLevel)}`}>
              <span className={`text-3xl font-bold ${getRiskColor(performanceInsights.riskLevel)}`}>
                {performanceInsights.overallScore}%
              </span>
            </div>
            <div className={`text-lg font-medium ${getRiskColor(performanceInsights.riskLevel)}`}>
              {performanceInsights.riskLevel.toUpperCase()} RISK
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Overall Performance Score
            </div>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Award className="h-6 w-6 text-green-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-900">Key Strengths</h4>
            </div>
            <div className="space-y-3">
              {performanceInsights.strengths.length > 0 ? (
                performanceInsights.strengths.map((strength, index) => (
                  <div key={index} className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">{strength.metric}</span>
                      <span className="text-lg font-bold text-green-700">{strength.score}%</span>
                    </div>
                    <p className="text-xs text-green-700">{strength.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p>No exceptional strengths identified</p>
                  <p className="text-xs mt-1">Performance above 110% of target needed</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-900">Improvement Areas</h4>
            </div>
            <div className="space-y-3">
              {performanceInsights.improvements.length > 0 ? (
                performanceInsights.improvements.map((improvement, index) => (
                  <div key={index} className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-900">{improvement.metric}</span>
                      <span className="text-lg font-bold text-orange-700">{improvement.score}%</span>
                    </div>
                    <p className="text-xs text-orange-700 mb-2">{improvement.description}</p>
                    <p className="text-xs text-orange-600 font-medium bg-orange-100 rounded px-2 py-1">
                      💡 {improvement.recommendation}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p>All areas performing at or above target</p>
                  <p className="text-xs mt-1">No metrics below 80% threshold</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Activity className="h-6 w-6 text-blue-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-900">Trend Analysis</h4>
            </div>
            <div className="space-y-4">
              {performanceInsights.trendAnalysis.improving.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <Improve className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-700">Improving</span>
                  </div>
                  <div className="space-y-1">
                    {performanceInsights.trendAnalysis.improving.map((metric, index) => (
                      <div key={index} className="text-xs text-green-600 bg-green-50 rounded px-2 py-1">
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {performanceInsights.trendAnalysis.declining.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <Decline className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-red-700">Declining</span>
                  </div>
                  <div className="space-y-1">
                    {performanceInsights.trendAnalysis.declining.map((metric, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {performanceInsights.trendAnalysis.stable.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <Target className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Stable</span>
                  </div>
                  <div className="space-y-1">
                    {performanceInsights.trendAnalysis.stable.slice(0, 2).map((metric, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {performanceInsights.trendAnalysis.improving.length === 0 && 
               performanceInsights.trendAnalysis.declining.length === 0 && 
               performanceInsights.trendAnalysis.stable.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  <BarChart3 className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p>No trend data available</p>
                  <p className="text-xs mt-1">Need previous month data for comparison</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Management Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center mb-6">
          <Brain className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">AI-Powered Management Recommendations</h3>
        </div>

        <div className="space-y-4">
          {performanceInsights.recommendations.map((rec, index) => (
            <div key={index} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-sm font-medium text-gray-700 capitalize bg-white px-3 py-1 rounded-full">
                    {rec.type.replace('-', ' ')} Action
                  </span>
                </div>
                <div className="flex items-center">
                  {rec.type === 'immediate' && <Zap className="h-5 w-5 text-red-500" />}
                  {rec.type === 'short-term' && <Clock className="h-5 w-5 text-yellow-500" />}
                  {rec.type === 'long-term' && <Target className="h-5 w-5 text-blue-500" />}
                </div>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Lightbulb className="h-5 w-5 text-purple-600 mr-2" />
                {rec.action}
              </h4>
              <p className="text-sm text-gray-700 bg-white/60 rounded-lg p-3">
                <strong>Expected Impact:</strong> {rec.expectedImpact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment Summary */}
      <div className={`rounded-xl border-2 p-8 ${
        performanceInsights.riskLevel === 'low' ? 'border-green-200 bg-green-50' :
        performanceInsights.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' :
        'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center mb-6">
          <Shield className={`h-8 w-8 mr-3 ${getRiskColor(performanceInsights.riskLevel)}`} />
          <h3 className={`text-2xl font-bold ${getRiskColor(performanceInsights.riskLevel)}`}>
            Risk Assessment: {performanceInsights.riskLevel.toUpperCase()}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h4>
            <div className="space-y-3">
              {performanceInsights.riskLevel === 'high' && (
                <>
                  <div className="flex items-center text-red-700 bg-white rounded-lg p-3">
                    <AlertCircle className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">Performance significantly below targets</span>
                  </div>
                  <div className="flex items-center text-red-700 bg-white rounded-lg p-3">
                    <Zap className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">Immediate intervention required</span>
                  </div>
                  <div className="flex items-center text-red-700 bg-white rounded-lg p-3">
                    <Users className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">May require additional support resources</span>
                  </div>
                </>
              )}
              {performanceInsights.riskLevel === 'medium' && (
                <>
                  <div className="flex items-center text-yellow-700 bg-white rounded-lg p-3">
                    <AlertCircle className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">Some metrics below target</span>
                  </div>
                  <div className="flex items-center text-yellow-700 bg-white rounded-lg p-3">
                    <Target className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">Coaching and support recommended</span>
                  </div>
                  <div className="flex items-center text-yellow-700 bg-white rounded-lg p-3">
                    <TrendingUp className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">Good potential for improvement</span>
                  </div>
                </>
              )}
              {performanceInsights.riskLevel === 'low' && (
                <>
                  <div className="flex items-center text-green-700 bg-white rounded-lg p-3">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">All metrics at or above target</span>
                  </div>
                  <div className="flex items-center text-green-700 bg-white rounded-lg p-3">
                    <Star className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">Consistent high performance</span>
                  </div>
                  <div className="flex items-center text-green-700 bg-white rounded-lg p-3">
                    <Award className="h-5 w-5 mr-3" />
                    <span className="text-sm font-medium">Ready for advanced opportunities</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h4>
            <div className="space-y-3">
              {performanceInsights.recommendations.slice(0, 4).map((rec, index) => (
                <div key={index} className="flex items-start bg-white rounded-lg p-3">
                  <div className={`w-3 h-3 rounded-full mt-2 mr-3 flex-shrink-0 ${
                    rec.priority === 'high' ? 'bg-red-500' :
                    rec.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{rec.action}</span>
                    <p className="text-xs text-gray-600 mt-1">{rec.expectedImpact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Score Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Score Breakdown</h3>
        
        <div className="space-y-6">
          {[
            { key: 'productivityRate', name: 'Productivity Rate', weight: 25, target: 85, icon: BarChart3, color: 'blue' },
            { key: 'retailPercentage', name: 'Retail Sales', weight: 20, target: 25, icon: TrendingUp, color: 'green' },
            { key: 'happinessScore', name: 'Employee Satisfaction', weight: 15, target: 8.5, multiplier: 10, icon: Star, color: 'yellow' },
            { key: 'attendanceRate', name: 'Attendance', weight: 15, target: 95, icon: CheckCircle, color: 'purple' },
            { key: 'customerSatisfactionScore', name: 'Customer Satisfaction', weight: 15, target: 9.0, multiplier: 10, icon: Award, color: 'pink' },
            { key: 'newClients', name: 'New Client Acquisition', weight: 10, target: 30, icon: Users, color: 'indigo' },
          ].map(metric => {
            const currentData = employeeKPIData.find(data => 
              data.employeeId === employee.id && 
              data.month === selectedMonth && 
              data.year === selectedYear
            );

            if (!currentData) return null;

            const value = currentData[metric.key as keyof EmployeeKPIData] as number;
            const adjustedValue = metric.multiplier ? value * metric.multiplier : value;
            const score = Math.min((adjustedValue / metric.target) * 100, 120);
            const weightedScore = score * (metric.weight / 100);

            return (
              <div key={metric.key} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-xl bg-${metric.color}-100 flex items-center justify-center mr-4`}>
                      <metric.icon className={`h-6 w-6 text-${metric.color}-600`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{metric.name}</h4>
                      <p className="text-sm text-gray-600">{metric.weight}% of overall score</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      score >= 110 ? 'text-green-600' :
                      score >= 100 ? 'text-blue-600' :
                      score >= 80 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {score.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-500">Performance Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {value}{metric.key.includes('Score') ? '/10' : metric.key.includes('Rate') || metric.key.includes('Percentage') ? '%' : ''}
                    </div>
                    <div className="text-xs text-gray-600">Actual</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {metric.target}{metric.key.includes('Score') ? '/10' : metric.key.includes('Rate') || metric.key.includes('Percentage') ? '%' : ''}
                    </div>
                    <div className="text-xs text-gray-600">Target</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      +{weightedScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600">Points</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      score >= 110 ? 'bg-green-500' :
                      score >= 100 ? 'bg-blue-500' :
                      score >= 80 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0%</span>
                  <span>Target (100%)</span>
                  <span>Exceptional (120%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Risk Indicators */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Visual Risk Indicators</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={`rounded-xl p-8 border-2 ${
            performanceInsights.riskLevel === 'low' ? 'border-green-500 bg-green-50' :
            performanceInsights.riskLevel === 'medium' ? 'border-yellow-500 bg-yellow-50' :
            'border-red-500 bg-red-50'
          }`}>
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                performanceInsights.riskLevel === 'low' ? 'bg-green-100' :
                performanceInsights.riskLevel === 'medium' ? 'bg-yellow-100' :
                'bg-red-100'
              }`}>
                {performanceInsights.riskLevel === 'low' ? (
                  <CheckCircle className="h-10 w-10 text-green-600" />
                ) : performanceInsights.riskLevel === 'medium' ? (
                  <AlertCircle className="h-10 w-10 text-yellow-600" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-red-600" />
                )}
              </div>
              <h4 className={`text-xl font-bold ${getRiskColor(performanceInsights.riskLevel)}`}>
                {performanceInsights.riskLevel.toUpperCase()} RISK
              </h4>
              <p className="text-sm text-gray-600 mt-2">
                {performanceInsights.riskLevel === 'low' ? 'Excellent performance across all metrics' :
                 performanceInsights.riskLevel === 'medium' ? 'Some areas need attention and support' :
                 'Immediate action and intervention required'}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Indicators</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Strengths Identified:</span>
                <span className="text-xl font-bold text-green-600">{performanceInsights.strengths.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Areas for Improvement:</span>
                <span className="text-xl font-bold text-orange-600">{performanceInsights.improvements.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Action Items:</span>
                <span className="text-xl font-bold text-purple-600">{performanceInsights.recommendations.length}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm font-medium text-gray-900">Overall Score:</span>
                <span className={`text-xl font-bold ${getRiskColor(performanceInsights.riskLevel)}`}>
                  {performanceInsights.overallScore}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Progress Tracking</h4>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {performanceInsights.overallScore}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
                <div className="text-xs text-gray-500 mt-1">
                  Scale: 0-120% (120% = exceptional)
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    performanceInsights.overallScore >= 110 ? 'bg-green-500' :
                    performanceInsights.overallScore >= 100 ? 'bg-blue-500' :
                    performanceInsights.overallScore >= 80 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(performanceInsights.overallScore, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>Target</span>
                <span>Exceptional</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceInsightsTab;