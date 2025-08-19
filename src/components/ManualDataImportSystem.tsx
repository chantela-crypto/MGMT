import React, { useState, useMemo } from 'react';
import { User } from '../types/division';
import { Employee, EmployeeKPIData } from '../types/employee';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatCurrency } from '../utils/scoring';
import { 
  Upload, Download, Save, X, Plus, Edit, Trash2, FileText, 
  Calendar, User as UserIcon, Building2, Target, BarChart3,
  CheckCircle, AlertCircle, Clock, Filter, Search, Grid, List,
  TrendingUp, DollarSign, Users, Activity, Eye, Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ManualDataEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  divisionId: string;
  month: string;
  year: number;
  productivityRate: number;
  prebookRate: number;
  firstTimeRetentionRate: number;
  repeatRetentionRate: number;
  retailPercentage: number;
  newClients: number;
  averageTicket: number;
  serviceSalesPerHour: number;
  clientsRetailPercentage: number;
  hoursSold: number;
  happinessScore: number;
  netCashPercentage: number;
  attendanceRate: number;
  trainingHours: number;
  customerSatisfactionScore: number;
  enteredBy: string;
  enteredAt: Date;
  lastModified: Date;
  isValidated: boolean;
  validationErrors: string[];
}

interface ImportBatch {
  id: string;
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  recordCount: number;
  successCount: number;
  errorCount: number;
  status: 'processing' | 'completed' | 'failed';
  errors: string[];
}

interface ManualDataImportSystemProps {
  currentUser: User;
}

const ManualDataImportSystem: React.FC<ManualDataImportSystemProps> = ({
  currentUser,
}) => {
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [divisions] = useLocalStorage<any[]>('divisions', []);
  const [manualEntries, setManualEntries] = useLocalStorage<ManualDataEntry[]>('manualDataEntries', []);
  const [importBatches, setImportBatches] = useLocalStorage<ImportBatch[]>('importBatches', []);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'manual-entry' | 'bulk-import' | 'validation' | 'export'>('manual-entry');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Form states
  const [showEntryForm, setShowEntryForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<ManualDataEntry | null>(null);
  const [entryForm, setEntryForm] = useState<Partial<ManualDataEntry>>({});
  
  // Upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = manualEntries.filter(entry => 
      entry.month === selectedMonth && entry.year === selectedYear
    );
    
    if (selectedDivision !== 'all') {
      filtered = filtered.filter(entry => entry.divisionId === selectedDivision);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [manualEntries, selectedMonth, selectedYear, selectedDivision, searchTerm]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const validatedEntries = filteredEntries.filter(entry => entry.isValidated).length;
    const entriesWithErrors = filteredEntries.filter(entry => entry.validationErrors.length > 0).length;
    
    const avgProductivity = filteredEntries.length > 0 
      ? Math.round(filteredEntries.reduce((sum, entry) => sum + entry.productivityRate, 0) / filteredEntries.length)
      : 0;
    
    const totalRevenue = filteredEntries.reduce((sum, entry) => 
      sum + (entry.averageTicket * entry.newClients), 0
    );

    return {
      totalEntries,
      validatedEntries,
      entriesWithErrors,
      avgProductivity,
      totalRevenue,
      validationRate: totalEntries > 0 ? Math.round((validatedEntries / totalEntries) * 100) : 0,
    };
  }, [filteredEntries]);

  // Validate entry data
  const validateEntry = (entry: Partial<ManualDataEntry>): string[] => {
    const errors: string[] = [];
    
    if (!entry.employeeId) errors.push('Employee is required');
    if ((entry.productivityRate || 0) < 0 || (entry.productivityRate || 0) > 100) {
      errors.push('Productivity rate must be between 0-100%');
    }
    if ((entry.happinessScore || 0) < 1 || (entry.happinessScore || 0) > 10) {
      errors.push('Happiness score must be between 1-10');
    }
    if ((entry.attendanceRate || 0) < 0 || (entry.attendanceRate || 0) > 100) {
      errors.push('Attendance rate must be between 0-100%');
    }
    
    return errors;
  };

  // Handle manual entry
  const handleSaveEntry = () => {
    if (!entryForm.employeeId) {
      alert('Please select an employee');
      return;
    }

    const employee = employees.find(emp => emp.id === entryForm.employeeId);
    if (!employee) {
      alert('Selected employee not found');
      return;
    }

    const validationErrors = validateEntry(entryForm);
    
    const newEntry: ManualDataEntry = {
      id: editingEntry?.id || `manual-${Date.now()}`,
      employeeId: entryForm.employeeId,
      employeeName: employee.name,
      divisionId: employee.divisionId,
      month: selectedMonth,
      year: selectedYear,
      productivityRate: entryForm.productivityRate || 0,
      prebookRate: entryForm.prebookRate || 0,
      firstTimeRetentionRate: entryForm.firstTimeRetentionRate || 0,
      repeatRetentionRate: entryForm.repeatRetentionRate || 0,
      retailPercentage: entryForm.retailPercentage || 0,
      newClients: entryForm.newClients || 0,
      averageTicket: entryForm.averageTicket || 0,
      serviceSalesPerHour: entryForm.serviceSalesPerHour || 0,
      clientsRetailPercentage: entryForm.clientsRetailPercentage || 0,
      hoursSold: entryForm.hoursSold || 0,
      happinessScore: entryForm.happinessScore || 0,
      netCashPercentage: entryForm.netCashPercentage || 0,
      attendanceRate: entryForm.attendanceRate || 0,
      trainingHours: entryForm.trainingHours || 0,
      customerSatisfactionScore: entryForm.customerSatisfactionScore || 0,
      enteredBy: currentUser.id,
      enteredAt: editingEntry?.enteredAt || new Date(),
      lastModified: new Date(),
      isValidated: validationErrors.length === 0,
      validationErrors,
    };

    setManualEntries(prev => {
      const filtered = prev.filter(entry => 
        !(entry.employeeId === newEntry.employeeId && 
          entry.month === newEntry.month && 
          entry.year === newEntry.year)
      );
      return [...filtered, newEntry];
    });

    setShowEntryForm(false);
    setEditingEntry(null);
    setEntryForm({});
  };

  // Handle bulk import
  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('processing');
    setUploadMessage('Processing file...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const batch: ImportBatch = {
        id: `batch-${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date(),
        uploadedBy: currentUser.id,
        recordCount: jsonData.length,
        successCount: 0,
        errorCount: 0,
        status: 'processing',
        errors: [],
      };

      const newEntries: ManualDataEntry[] = [];
      const errors: string[] = [];

      jsonData.forEach((row: any, index) => {
        try {
          const employee = employees.find(emp => 
            emp.name.toLowerCase() === (row.EmployeeName || '').toLowerCase() ||
            emp.email.toLowerCase() === (row.Email || '').toLowerCase()
          );

          if (!employee) {
            errors.push(`Row ${index + 1}: Employee not found - ${row.EmployeeName || row.Email}`);
            return;
          }

          const entry: Partial<ManualDataEntry> = {
            employeeId: employee.id,
            employeeName: employee.name,
            divisionId: employee.divisionId,
            month: selectedMonth,
            year: selectedYear,
            productivityRate: parseFloat(row.ProductivityRate) || 0,
            prebookRate: parseFloat(row.PrebookRate) || 0,
            firstTimeRetentionRate: parseFloat(row.FirstTimeRetentionRate) || 0,
            repeatRetentionRate: parseFloat(row.RepeatRetentionRate) || 0,
            retailPercentage: parseFloat(row.RetailPercentage) || 0,
            newClients: parseInt(row.NewClients) || 0,
            averageTicket: parseFloat(row.AverageTicket) || 0,
            serviceSalesPerHour: parseFloat(row.ServiceSalesPerHour) || 0,
            clientsRetailPercentage: parseFloat(row.ClientsRetailPercentage) || 0,
            hoursSold: parseFloat(row.HoursSold) || 0,
            happinessScore: parseFloat(row.HappinessScore) || 0,
            netCashPercentage: parseFloat(row.NetCashPercentage) || 0,
            attendanceRate: parseFloat(row.AttendanceRate) || 0,
            trainingHours: parseFloat(row.TrainingHours) || 0,
            customerSatisfactionScore: parseFloat(row.CustomerSatisfactionScore) || 0,
          };

          const validationErrors = validateEntry(entry);
          
          const newEntry: ManualDataEntry = {
            id: `import-${Date.now()}-${index}`,
            ...entry,
            enteredBy: currentUser.id,
            enteredAt: new Date(),
            lastModified: new Date(),
            isValidated: validationErrors.length === 0,
            validationErrors,
          } as ManualDataEntry;

          newEntries.push(newEntry);
          
          if (validationErrors.length === 0) {
            batch.successCount++;
          } else {
            batch.errorCount++;
            errors.push(`Row ${index + 1}: ${validationErrors.join(', ')}`);
          }
        } catch (error) {
          batch.errorCount++;
          errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      batch.status = batch.errorCount === 0 ? 'completed' : 'completed';
      batch.errors = errors;

      setManualEntries(prev => [...prev, ...newEntries]);
      setImportBatches(prev => [...prev, batch]);

      setUploadStatus('success');
      setUploadMessage(`Import completed: ${batch.successCount} successful, ${batch.errorCount} errors`);
      
      event.target.value = '';
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Export data
  const handleExport = (format: 'csv' | 'xlsx') => {
    const exportData = filteredEntries.map(entry => ({
      EmployeeName: entry.employeeName,
      Division: divisions.find(d => d.id === entry.divisionId)?.name || 'Unknown',
      Month: new Date(entry.year, parseInt(entry.month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      ProductivityRate: entry.productivityRate,
      PrebookRate: entry.prebookRate,
      FirstTimeRetentionRate: entry.firstTimeRetentionRate,
      RepeatRetentionRate: entry.repeatRetentionRate,
      RetailPercentage: entry.retailPercentage,
      NewClients: entry.newClients,
      AverageTicket: entry.averageTicket,
      ServiceSalesPerHour: entry.serviceSalesPerHour,
      ClientsRetailPercentage: entry.clientsRetailPercentage,
      HoursSold: entry.hoursSold,
      HappinessScore: entry.happinessScore,
      NetCashPercentage: entry.netCashPercentage,
      AttendanceRate: entry.attendanceRate,
      TrainingHours: entry.trainingHours,
      CustomerSatisfactionScore: entry.customerSatisfactionScore,
      EnteredBy: entry.enteredBy,
      EnteredAt: entry.enteredAt.toLocaleDateString(),
      IsValidated: entry.isValidated ? 'Yes' : 'No',
      ValidationErrors: entry.validationErrors.join('; '),
    }));

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee-data-${selectedMonth}-${selectedYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employee Data');
      XLSX.writeFile(wb, `employee-data-${selectedMonth}-${selectedYear}.xlsx`);
    }
  };

  const formFields = [
    { key: 'productivityRate', label: 'Productivity Rate (%)', type: 'percentage' },
    { key: 'prebookRate', label: 'Prebook Rate (%)', type: 'percentage' },
    { key: 'firstTimeRetentionRate', label: 'First-Time Retention Rate (%)', type: 'percentage' },
    { key: 'repeatRetentionRate', label: 'Repeat Retention Rate (%)', type: 'percentage' },
    { key: 'retailPercentage', label: 'Retail % of Total Sales', type: 'percentage' },
    { key: 'newClients', label: 'Number of New Clients', type: 'number' },
    { key: 'averageTicket', label: 'Average Ticket ($)', type: 'currency' },
    { key: 'serviceSalesPerHour', label: 'Service Sales per Hour ($)', type: 'currency' },
    { key: 'clientsRetailPercentage', label: '% of Clients Purchasing Retail', type: 'percentage' },
    { key: 'hoursSold', label: 'Number of Hours Sold', type: 'number' },
    { key: 'happinessScore', label: 'Happiness Score (1-10)', type: 'score' },
    { key: 'netCashPercentage', label: 'Net Cash % / Profit Contribution', type: 'percentage' },
    { key: 'attendanceRate', label: 'Attendance Rate (%)', type: 'percentage' },
    { key: 'trainingHours', label: 'Training Hours Completed', type: 'number' },
    { key: 'customerSatisfactionScore', label: 'Customer Satisfaction Score (1-10)', type: 'score' },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Data Import</h1>
              <p className="text-white/80 text-lg">Manual employee KPI data entry and bulk import system</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Data Entries</div>
            <div className="text-xl font-bold">{summaryMetrics.totalEntries}</div>
            <div className="text-sm text-white/70">
              {summaryMetrics.validationRate}% validated
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Entries</h3>
                <div className="text-3xl font-bold text-white mb-1">{summaryMetrics.totalEntries}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Manual data entries</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Validated</h3>
                <div className="text-3xl font-bold text-white mb-1">{summaryMetrics.validatedEntries}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Passed validation</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Avg Productivity</h3>
                <div className="text-3xl font-bold text-white mb-1">{summaryMetrics.avgProductivity}%</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Team average</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Revenue</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summaryMetrics.totalRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">From manual entries</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'manual-entry', label: 'Manual Entry', icon: Edit, description: 'Individual employee data entry' },
              { id: 'bulk-import', label: 'Bulk Import', icon: Upload, description: 'CSV/Excel file upload' },
              { id: 'validation', label: 'Data Validation', icon: CheckCircle, description: 'Review and validate entries' },
              { id: 'export', label: 'Export Tools', icon: Download, description: 'Export data and reports' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-[#f4647d] text-[#f4647d]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-500 font-normal">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                <option value="all">All Divisions</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'cards' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4 mr-2" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'table' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                Table
              </button>
            </div>

            {activeTab === 'manual-entry' && (
              <button
                onClick={() => setShowEntryForm(true)}
                className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-lg hover:bg-[#fd8585] transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'manual-entry' && (
        <div className="space-y-6">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.map(entry => {
                const division = divisions.find(d => d.id === entry.divisionId);
                
                return (
                  <div key={entry.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                          style={{ backgroundColor: division?.color }}
                        >
                          {entry.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{entry.employeeName}</h4>
                          <p className="text-sm text-gray-600">{division?.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {entry.isValidated ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setEntryForm(entry);
                            setShowEntryForm(true);
                          }}
                          className="text-gray-400 hover:text-[#f4647d]"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">Productivity</div>
                        <div className="font-semibold">{entry.productivityRate}%</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">New Clients</div>
                        <div className="font-semibold">{entry.newClients}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">Avg Ticket</div>
                        <div className="font-semibold">{formatCurrency(entry.averageTicket)}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">Happiness</div>
                        <div className="font-semibold">{entry.happinessScore}/10</div>
                      </div>
                    </div>

                    {entry.validationErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                        <div className="text-xs text-red-800">
                          <strong>Validation Errors:</strong>
                          <ul className="mt-1 list-disc list-inside">
                            {entry.validationErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Entered: {entry.enteredAt.toLocaleDateString()} by {entry.enteredBy}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Division</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Productivity</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">New Clients</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Ticket</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Happiness</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEntries.map(entry => {
                      const division = divisions.find(d => d.id === entry.divisionId);
                      
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium mr-3"
                                style={{ backgroundColor: division?.color }}
                              >
                                {entry.employeeName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{entry.employeeName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${division?.color}20`, 
                                color: division?.color 
                              }}
                            >
                              {division?.name}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                            {entry.productivityRate}%
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                            {entry.newClients}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                            {formatCurrency(entry.averageTicket)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                            {entry.happinessScore}/10
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {entry.isValidated ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                setEditingEntry(entry);
                                setEntryForm(entry);
                                setShowEntryForm(true);
                              }}
                              className="text-[#f4647d] hover:text-[#fd8585]"
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
          )}
        </div>
      )}

      {/* Bulk Import Tab */}
      {activeTab === 'bulk-import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Bulk Data Import</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Upload className="h-6 w-6 text-blue-600 mr-3" />
                    <h4 className="text-lg font-semibold text-blue-900">Upload Employee Data</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleBulkImport}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    
                    <div className="text-sm text-blue-800">
                      <p className="mb-2"><strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)</p>
                      <p><strong>Required columns:</strong> EmployeeName, ProductivityRate, NewClients, AverageTicket, HappinessScore</p>
                    </div>
                  </div>

                  {uploadStatus !== 'idle' && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${
                      uploadStatus === 'success' ? 'bg-green-100 text-green-800' :
                      uploadStatus === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {uploadStatus === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> :
                       uploadStatus === 'error' ? <AlertCircle className="h-5 w-5 mr-2" /> :
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />}
                      <span className="text-sm">{uploadMessage}</span>
                    </div>
                  )}
                </div>

                {/* Template Download */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Download Template</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Download a template file with the correct column headers and sample data.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        const template = [{
                          EmployeeName: 'John Doe',
                          ProductivityRate: 85,
                          PrebookRate: 75,
                          FirstTimeRetentionRate: 80,
                          RepeatRetentionRate: 90,
                          RetailPercentage: 25,
                          NewClients: 30,
                          AverageTicket: 250,
                          ServiceSalesPerHour: 150,
                          ClientsRetailPercentage: 60,
                          HoursSold: 120,
                          HappinessScore: 8.5,
                          NetCashPercentage: 70,
                          AttendanceRate: 95,
                          TrainingHours: 8,
                          CustomerSatisfactionScore: 9.0,
                        }];
                        
                        const ws = XLSX.utils.json_to_sheet(template);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Template');
                        XLSX.writeFile(wb, 'employee-data-template.xlsx');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Excel Template
                    </button>
                    
                    <button
                      onClick={() => {
                        const csvContent = [
                          'EmployeeName,ProductivityRate,PrebookRate,FirstTimeRetentionRate,RepeatRetentionRate,RetailPercentage,NewClients,AverageTicket,ServiceSalesPerHour,ClientsRetailPercentage,HoursSold,HappinessScore,NetCashPercentage,AttendanceRate,TrainingHours,CustomerSatisfactionScore',
                          'John Doe,85,75,80,90,25,30,250,150,60,120,8.5,70,95,8,9.0'
                        ].join('\n');
                        
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'employee-data-template.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Import History */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Imports</h4>
                  
                  <div className="space-y-3">
                    {importBatches.slice(-5).reverse().map(batch => (
                      <div key={batch.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">{batch.fileName}</h5>
                            <p className="text-sm text-gray-600">{batch.uploadedAt.toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                            batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {batch.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-1 font-medium">{batch.recordCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Success:</span>
                            <span className="ml-1 font-medium text-green-600">{batch.successCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Errors:</span>
                            <span className="ml-1 font-medium text-red-600">{batch.errorCount}</span>
                          </div>
                        </div>
                        
                        {batch.errors.length > 0 && (
                          <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-800">
                            <details>
                              <summary className="cursor-pointer">View Errors ({batch.errors.length})</summary>
                              <ul className="mt-2 list-disc list-inside">
                                {batch.errors.slice(0, 5).map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                                {batch.errors.length > 5 && (
                                  <li>... and {batch.errors.length - 5} more errors</li>
                                )}
                              </ul>
                            </details>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {importBatches.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No import history available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Export Tools</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Download className="h-6 w-6 text-green-600 mr-3" />
                  <h4 className="text-lg font-semibold text-green-900">Export Current Data</h4>
                </div>
                
                <p className="text-sm text-green-800 mb-4">
                  Export all manual entries for the selected period in your preferred format.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </button>
                  
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Export as Excel
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                  <h4 className="text-lg font-semibold text-blue-900">Export Summary</h4>
                </div>
                
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Total Entries:</span>
                    <span className="font-medium">{summaryMetrics.totalEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validated Entries:</span>
                    <span className="font-medium">{summaryMetrics.validatedEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entries with Errors:</span>
                    <span className="font-medium">{summaryMetrics.entriesWithErrors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period:</span>
                    <span className="font-medium">
                      {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingEntry ? 'Edit Manual Entry' : 'Add Manual Entry'}
                </h3>
                <p className="text-gray-600">
                  {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowEntryForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee *</label>
                <select
                  value={entryForm.employeeId || ''}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value);
                    setEntryForm(prev => ({ 
                      ...prev, 
                      employeeId: e.target.value,
                      employeeName: employee?.name || '',
                      divisionId: employee?.divisionId || '',
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  disabled={!!editingEntry}
                >
                  <option value="">Select Employee</option>
                  {employees.filter(emp => emp.isActive).map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* KPI Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      step={field.type === 'percentage' || field.type === 'score' ? '0.1' : '1'}
                      min="0"
                      max={field.type === 'score' ? '10' : field.type === 'percentage' ? '100' : undefined}
                      value={entryForm[field.key as keyof ManualDataEntry] || ''}
                      onChange={(e) => setEntryForm(prev => ({
                        ...prev,
                        [field.key]: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    />
                  </div>
                ))}
              </div>

              {/* Validation Preview */}
              {entryForm.employeeId && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Validation Preview</h4>
                  <div className="space-y-2">
                    {validateEntry(entryForm).map((error, index) => (
                      <div key={index} className="flex items-center text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {error}
                      </div>
                    ))}
                    {validateEntry(entryForm).length === 0 && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        All validations passed
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEntryForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  disabled={!entryForm.employeeId}
                  className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] disabled:bg-gray-400 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingEntry ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualDataImportSystem;