import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Users, DollarSign, Target, Clock, X, BarChart3 } from 'lucide-react';
import { Employee } from '../types/employee';
import { Division } from '../types/division';
import { formatCurrency } from '../utils/scoring';

interface SalesProjectionCalculatorProps {
  employees: Employee[];
  divisions: Division[];
}

interface ProjectionInputs {
  selectedDivision: string;
  selectedEmployee: string;
  serviceSalesPerHour: number;
  estimatedProductivity: number;
  monthlyScheduledHours: number;
  retailPercentage: number;
}

interface ProjectionResults {
  effectiveHours: number;
  projectedServiceRevenue: number;
  projectedRetailRevenue: number;
  totalProjectedRevenue: number;
  revenuePerEmployee: number;
  teamSize: number;
  goalVsActual: number;
}

const SalesProjectionCalculator: React.FC<SalesProjectionCalculatorProps> = ({
  employees,
  divisions,
}) => {
  const [calculatorMode, setCalculatorMode] = useState<'division' | 'individual'>('division');
  const [inputs, setInputs] = useState<ProjectionInputs>({
    selectedDivision: 'all',
    selectedEmployee: '',
    serviceSalesPerHour: 224,
    estimatedProductivity: 85,
    monthlyScheduledHours: 160,
    retailPercentage: 20,
  });

  // Filter employees based on selected division
  const filteredEmployees = useMemo(() => {
    if (inputs.selectedDivision === 'all') {
      return employees.filter(emp => emp.isActive);
    }
    return employees.filter(emp => emp.divisionId === inputs.selectedDivision && emp.isActive);
  }, [employees, inputs.selectedDivision]);

  // Calculate projections
  const projectionResults = useMemo((): ProjectionResults => {
    let teamSize = 1;
    let totalScheduledHours = inputs.monthlyScheduledHours;

    if (calculatorMode === 'division') {
      teamSize = filteredEmployees.length;
      totalScheduledHours = inputs.monthlyScheduledHours * teamSize;
    } else if (inputs.selectedEmployee) {
      teamSize = 1;
      totalScheduledHours = inputs.monthlyScheduledHours;
    }

    const effectiveHours = Math.round(totalScheduledHours * (inputs.estimatedProductivity / 100));
    const projectedServiceRevenue = effectiveHours * inputs.serviceSalesPerHour;
    const projectedRetailRevenue = Math.round(projectedServiceRevenue * (inputs.retailPercentage / 100));
    const totalProjectedRevenue = projectedServiceRevenue + projectedRetailRevenue;
    const revenuePerEmployee = teamSize > 0 ? Math.round(totalProjectedRevenue / teamSize) : 0;

    // Mock target for goal comparison (would come from actual targets in real system)
    const monthlyTarget = calculatorMode === 'division' ? 250000 : 5000;
    const goalVsActual = monthlyTarget > 0 ? Math.round((totalProjectedRevenue / monthlyTarget) * 100) : 0;

    return {
      effectiveHours: Math.round(effectiveHours / teamSize * 10) / 10, // Per employee
      projectedServiceRevenue,
      projectedRetailRevenue,
      totalProjectedRevenue,
      revenuePerEmployee,
      teamSize,
      goalVsActual,
    };
  }, [inputs, calculatorMode, filteredEmployees]);

  const handleInputChange = (field: keyof ProjectionInputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const selectedDivisionName = inputs.selectedDivision === 'all' 
    ? 'All Divisions' 
    : divisions.find(d => d.id === inputs.selectedDivision)?.name || 'Unknown';

  const selectedEmployeeName = inputs.selectedEmployee 
    ? employees.find(emp => emp.id === inputs.selectedEmployee)?.name || 'Unknown'
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calculator className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Sales Projection Calculator</h2>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCalculatorMode('division')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                calculatorMode === 'division' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Division
            </button>
            <button
              onClick={() => setCalculatorMode('individual')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                calculatorMode === 'individual' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Individual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projection Inputs */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Projection Inputs</h3>
              
              <div className="space-y-4">
                {/* Division/Employee Selection */}
                {calculatorMode === 'division' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                    <select
                      value={inputs.selectedDivision}
                      onChange={(e) => handleInputChange('selectedDivision', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    >
                      <option value="all">All Divisions</option>
                      {divisions.map(division => (
                        <option key={division.id} value={division.id}>
                          {division.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                      <select
                        value={inputs.selectedDivision}
                        onChange={(e) => handleInputChange('selectedDivision', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        <option value="all">All Divisions</option>
                        {divisions.map(division => (
                          <option key={division.id} value={division.id}>
                            {division.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                      <select
                        value={inputs.selectedEmployee}
                        onChange={(e) => handleInputChange('selectedEmployee', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        <option value="">Select Employee</option>
                        {filteredEmployees.map(employee => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} - {employee.position}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Service Sales per Hour */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Service Sales per Hour ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.serviceSalesPerHour}
                    onChange={(e) => handleInputChange('serviceSalesPerHour', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    placeholder="224"
                  />
                </div>

                {/* Estimated Productivity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Productivity (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inputs.estimatedProductivity}
                    onChange={(e) => handleInputChange('estimatedProductivity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    placeholder="85"
                  />
                </div>

                {/* Monthly Scheduled Hours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Scheduled Hours {calculatorMode === 'division' ? '(per employee)' : ''}
                  </label>
                  <input
                    type="number"
                    value={inputs.monthlyScheduledHours}
                    onChange={(e) => handleInputChange('monthlyScheduledHours', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    placeholder="160"
                  />
                </div>

                {/* Retail Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retail Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inputs.retailPercentage}
                    onChange={(e) => handleInputChange('retailPercentage', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    placeholder="20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Projected Results */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Projected Results</h3>
              
              <div className="space-y-4">
                {/* Results Cards */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Effective Hours per Employee:
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {projectionResults.effectiveHours}h
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Projected Revenue per Employee:
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(projectionResults.revenuePerEmployee)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Team Size:
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {projectionResults.teamSize} {projectionResults.teamSize === 1 ? 'employee' : 'employees'}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">
                        Projected {calculatorMode === 'division' ? 'Division' : 'Individual'} Revenue:
                      </span>
                    </div>
                    <span className="text-xl font-bold">
                      {formatCurrency(projectionResults.totalProjectedRevenue)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Goal vs Projected:
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${
                      projectionResults.goalVsActual >= 100 ? 'text-green-600' :
                      projectionResults.goalVsActual >= 80 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {projectionResults.goalVsActual}% of target
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assumptions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Assumptions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Based on current team size and productivity trends</li>
                <li>• Assumes consistent booking patterns</li>
                <li>• Does not account for seasonal variations</li>
                <li>• Revenue calculated on service sales only</li>
                <li>• Retail percentage applied to service revenue</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Revenue Breakdown</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Service Revenue</h4>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(projectionResults.projectedServiceRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {projectionResults.effectiveHours * projectionResults.teamSize}h × ${inputs.serviceSalesPerHour}/h
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Retail Revenue</h4>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(projectionResults.projectedRetailRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {inputs.retailPercentage}% of service revenue
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Total Hours</h4>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {(projectionResults.effectiveHours * projectionResults.teamSize).toLocaleString()}h
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {inputs.monthlyScheduledHours}h × {inputs.estimatedProductivity}% × {projectionResults.teamSize}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Revenue/Hour</h4>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(inputs.serviceSalesPerHour)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Base service sales rate
            </p>
          </div>
        </div>

        {/* Calculation Formula */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Calculation Formula</h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">1. Effective Hours:</span>
              <span className="font-mono bg-white px-2 py-1 rounded">
                {inputs.monthlyScheduledHours}h × {inputs.estimatedProductivity}% = {projectionResults.effectiveHours}h per employee
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">2. Service Revenue:</span>
              <span className="font-mono bg-white px-2 py-1 rounded">
                {projectionResults.effectiveHours}h × {projectionResults.teamSize} × ${inputs.serviceSalesPerHour} = {formatCurrency(projectionResults.projectedServiceRevenue)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">3. Retail Revenue:</span>
              <span className="font-mono bg-white px-2 py-1 rounded">
                {formatCurrency(projectionResults.projectedServiceRevenue)} × {inputs.retailPercentage}% = {formatCurrency(projectionResults.projectedRetailRevenue)}
              </span>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-200 pt-3">
              <span className="text-gray-900 font-semibold">Total Projected Revenue:</span>
              <span className="font-mono bg-[#f4647d] text-white px-3 py-2 rounded font-bold">
                {formatCurrency(projectionResults.totalProjectedRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Breakdown (Division Mode Only) */}
      {calculatorMode === 'division' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Team Breakdown - {selectedDivisionName}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projected Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue/Hour
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map(employee => {
                  const division = divisions.find(d => d.id === employee.divisionId);
                  const effectiveHours = Math.round(inputs.monthlyScheduledHours * (inputs.estimatedProductivity / 100));
                  const serviceRevenue = effectiveHours * inputs.serviceSalesPerHour;
                  const retailRevenue = Math.round(serviceRevenue * (inputs.retailPercentage / 100));
                  const totalRevenue = serviceRevenue + retailRevenue;
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                            style={{ backgroundColor: division?.color }}
                          >
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{division?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inputs.monthlyScheduledHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {effectiveHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(inputs.serviceSalesPerHour)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Employee Details (Individual Mode Only) */}
      {calculatorMode === 'individual' && inputs.selectedEmployee && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Individual Projection - {selectedEmployeeName}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Service Revenue Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Scheduled Hours:</span>
                  <span className="font-medium">{inputs.monthlyScheduledHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Productivity Rate:</span>
                  <span className="font-medium">{inputs.estimatedProductivity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Effective Hours:</span>
                  <span className="font-medium">{projectionResults.effectiveHours}h</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-blue-900 font-semibold">Service Revenue:</span>
                  <span className="font-bold">{formatCurrency(projectionResults.projectedServiceRevenue)}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">Retail Revenue Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Service Revenue:</span>
                  <span className="font-medium">{formatCurrency(projectionResults.projectedServiceRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Retail Percentage:</span>
                  <span className="font-medium">{inputs.retailPercentage}%</span>
                </div>
                <div className="flex justify-between border-t border-green-200 pt-2">
                  <span className="text-green-900 font-semibold">Retail Revenue:</span>
                  <span className="font-bold">{formatCurrency(projectionResults.projectedRetailRevenue)}</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-900 mb-2">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Revenue/Hour:</span>
                  <span className="font-medium">{formatCurrency(inputs.serviceSalesPerHour)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Total Revenue:</span>
                  <span className="font-medium">{formatCurrency(projectionResults.totalProjectedRevenue)}</span>
                </div>
                <div className="flex justify-between border-t border-purple-200 pt-2">
                  <span className="text-purple-900 font-semibold">Goal Achievement:</span>
                  <span className={`font-bold ${
                    projectionResults.goalVsActual >= 100 ? 'text-green-600' :
                    projectionResults.goalVsActual >= 80 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {projectionResults.goalVsActual}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Scenarios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Scenario Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Conservative', productivity: 75, salesPerHour: 180 },
            { name: 'Realistic', productivity: 85, salesPerHour: 224 },
            { name: 'Optimistic', productivity: 95, salesPerHour: 280 },
          ].map(scenario => {
            const effectiveHours = Math.round(inputs.monthlyScheduledHours * (scenario.productivity / 100));
            const serviceRevenue = effectiveHours * scenario.salesPerHour * projectionResults.teamSize;
            const retailRevenue = Math.round(serviceRevenue * (inputs.retailPercentage / 100));
            const totalRevenue = serviceRevenue + retailRevenue;
            
            return (
              <div key={scenario.name} className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="text-sm font-medium text-gray-900 mb-3">{scenario.name} Scenario</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productivity:</span>
                    <span className="font-medium">{scenario.productivity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales/Hour:</span>
                    <span className="font-medium">{formatCurrency(scenario.salesPerHour)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="text-gray-900 font-semibold">Total Revenue:</span>
                    <span className="font-bold text-[#f4647d]">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    handleInputChange('estimatedProductivity', scenario.productivity);
                    handleInputChange('serviceSalesPerHour', scenario.salesPerHour);
                  }}
                  className="w-full mt-3 px-3 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] text-sm"
                >
                  Apply Scenario
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesProjectionCalculator;