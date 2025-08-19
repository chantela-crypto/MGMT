import React, { useState } from 'react';
import { KPIData, Division, KPITarget } from '../types/division';
import { getScoreLevel, getScoreColor, getScorePercentage, formatCurrency, formatPercentage } from '../utils/scoring';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAsyncOperation } from '../hooks/useAsyncOperation';

interface ReportsProps {
  kpiData: KPIData[];
  divisions: Division[];
  targets: KPITarget[];
}

const Reports: React.FC<ReportsProps> = ({ kpiData, divisions, targets }) => {
  const { isLoading, error, execute } = useAsyncOperation();
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const currentMonthData = kpiData.filter(
    data => data.month === selectedMonth && data.year === selectedYear
  );

  const generatePDF = async () => {
    await execute(async () => {
      const element = document.getElementById('report-content');
      if (!element) {
        throw new Error('Report content not found');
      }

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `True-Balance-Report-${selectedMonth}-${selectedYear}.pdf`;
      pdf.save(fileName);
      
      return fileName;
    }, (fileName) => {
      setSuccessMessage(`Report "${fileName}" downloaded successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>

            <button
              onClick={generatePDF}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              type="button"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-800">{successMessage}</div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800">Error: {error}</div>
          </div>
        )}

        <div id="report-content" className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">True Balance Longevity Inc.</h1>
            <h2 className="text-xl text-gray-700">Division Performance Report</h2>
            <p className="text-gray-600">
              {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleString('default', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>

          {/* Report Summary Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Total Divisions</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{divisions.length}</div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Report Period</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Data Points</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{currentMonthData.length}</div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Generated</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{new Date().toLocaleDateString()}</div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productivity Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retail %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {divisions.map(division => {
                  const data = currentMonthData.find(d => d.divisionId === division.id);
                  const target = targets.find(t => t.divisionId === division.id);

                  if (!data || !target) {
                    return (
                      <tr key={division.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {division.name}
                        </td>
                        <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          No data available
                        </td>
                      </tr>
                    );
                  }

                  const productivityScore = getScorePercentage(data.productivityRate, target.productivityRate);
                  const retailScore = getScorePercentage(data.retailPercentage, target.retailPercentage);
                  const clientsScore = getScorePercentage(data.newClients, target.newClients);
                  const ticketScore = getScorePercentage(data.averageTicket, target.averageTicket);
                  const hoursScore = getScorePercentage(data.hoursSold, target.hoursSold);
                  
                  const overallScore = Math.round(
                    (productivityScore + retailScore + clientsScore + ticketScore + hoursScore) / 5
                  );
                  
                  const scoreLevel = getScoreLevel(overallScore, 100);
                  const scoreColor = getScoreColor(scoreLevel);

                  return (
                    <tr key={division.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {division.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(data.productivityRate)}
                        <span className="ml-2 text-xs" style={{ color: getScoreColor(getScoreLevel(data.productivityRate, target.productivityRate)) }}>
                          ({productivityScore}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(data.retailPercentage)}
                        <span className="ml-2 text-xs" style={{ color: getScoreColor(getScoreLevel(data.retailPercentage, target.retailPercentage)) }}>
                          ({retailScore}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.newClients}
                        <span className="ml-2 text-xs" style={{ color: getScoreColor(getScoreLevel(data.newClients, target.newClients)) }}>
                          ({clientsScore}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(data.averageTicket)}
                        <span className="ml-2 text-xs" style={{ color: getScoreColor(getScoreLevel(data.averageTicket, target.averageTicket)) }}>
                          ({ticketScore}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.hoursSold}
                        <span className="ml-2 text-xs" style={{ color: getScoreColor(getScoreLevel(data.hoursSold, target.hoursSold)) }}>
                          ({hoursScore}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: scoreColor }}
                          />
                          <span className="text-sm font-medium" style={{ color: scoreColor }}>
                            {overallScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;