import React, { useState, useEffect } from 'react';
import { User } from '../types/division';
import { Employee } from '../types/employee';
import { Mail, Clock, AlertCircle, CheckCircle, Send, Calendar, Users } from 'lucide-react';

interface ReminderLog {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: Date;
  triggerType: '3-days' | '1-day' | 'final-warning';
  month: string;
  year: number;
  status: 'sent' | 'failed' | 'pending';
}

interface AutoReminderSystemProps {
  currentUser: User;
  employees: Employee[];
  onSendReminder?: (log: ReminderLog) => void;
}

const AutoReminderSystem: React.FC<AutoReminderSystemProps> = ({
  currentUser,
  employees,
  onSendReminder,
}) => {
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [isSystemActive, setIsSystemActive] = useState<boolean>(true);
  const [testMode, setTestMode] = useState<boolean>(false);

  // Get division managers
  const divisionManagers = employees.filter(emp => 
    emp.category === 'management' && emp.isActive
  );

  // Calculate days until 25th
  const getDaysUntil25th = (): number => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lockDate = new Date(currentYear, currentMonth, 25);
    
    if (now.getDate() > 25) {
      // Next month's 25th
      const nextMonth = new Date(currentYear, currentMonth + 1, 25);
      return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // This month's 25th
      return Math.ceil((lockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  };

  const daysUntil25th = getDaysUntil25th();

  // Generate reminder email content
  const generateReminderEmail = (manager: Employee, triggerType: '3-days' | '1-day' | 'final-warning') => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthName = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Use consistent subject line for all reminders
    const subject = `Staff Scheduling Reminder - Due by 25th`;

    const body = `Hi Division Leads:

This is a friendly reminder that all staff scheduling for the upcoming month is due by the 25th.

Please ensure all shifts have been entered and finalized in the Scheduling Calendar. After the 25th, no edits will be allowed unless approved by Chantel.

Thank you for staying on top of your division's planning.

– True Balance`;

    return {
      subject,
      body,
    };
  };

  // Send reminder (mock implementation)
  const sendReminder = (manager: Employee, triggerType: '3-days' | '1-day' | 'final-warning') => {
    const { subject, body } = generateReminderEmail(manager, triggerType);
    const now = new Date();
    
    const reminderLog: ReminderLog = {
      id: `reminder-${Date.now()}-${manager.id}`,
      recipientId: manager.id,
      recipientName: manager.name,
      recipientEmail: manager.email,
      subject,
      body,
      sentAt: now,
      triggerType,
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: now.getFullYear(),
      status: 'sent',
    };

    setReminderLogs(prev => [...prev, reminderLog]);
    
    if (onSendReminder) {
      onSendReminder(reminderLog);
    }

    // In real implementation, this would send actual emails
  };

  // Auto-trigger reminders based on date
  useEffect(() => {
    if (!isSystemActive) return;

    const checkAndSendReminders = () => {
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Check if we should send reminders
      const shouldSend3Day = currentDay === 22; // 3 days before 25th
      const shouldSend1Day = currentDay === 24; // 1 day before 25th
      const shouldSendFinal = currentDay === 25; // Morning of 25th

      divisionManagers.forEach(manager => {
        // Check if reminder already sent this month
        const alreadySent3Day = reminderLogs.some(log => 
          log.recipientId === manager.id && 
          log.triggerType === '3-days' && 
          log.month === (currentMonth + 1).toString().padStart(2, '0') && 
          log.year === currentYear
        );
        
        const alreadySent1Day = reminderLogs.some(log => 
          log.recipientId === manager.id && 
          log.triggerType === '1-day' && 
          log.month === (currentMonth + 1).toString().padStart(2, '0') && 
          log.year === currentYear
        );
        
        const alreadySentFinal = reminderLogs.some(log => 
          log.recipientId === manager.id && 
          log.triggerType === 'final-warning' && 
          log.month === (currentMonth + 1).toString().padStart(2, '0') && 
          log.year === currentYear
        );

        if (shouldSend3Day && !alreadySent3Day) {
          sendReminder(manager, '3-days');
        } else if (shouldSend1Day && !alreadySent1Day) {
          sendReminder(manager, '1-day');
        } else if (shouldSendFinal && !alreadySentFinal) {
          sendReminder(manager, 'final-warning');
        }
      });
    };

    // Check daily at 9 AM (in production, this would be a server-side cron job)
    const interval = setInterval(checkAndSendReminders, 60 * 60 * 1000); // Check every hour for demo
    
    // Initial check
    checkAndSendReminders();

    return () => clearInterval(interval);
  }, [isSystemActive, divisionManagers, reminderLogs]);

  // Test reminder function
  const sendTestReminder = (triggerType: '3-days' | '1-day' | 'final-warning') => {
    if (divisionManagers.length > 0) {
      sendReminder(divisionManagers[0], triggerType);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Mail className="h-6 w-6 text-[#f4647d] mr-2" />
            <h3 className="text-xl font-bold text-gray-900">Auto Reminder System</h3>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isSystemActive}
                onChange={(e) => setIsSystemActive(e.target.checked)}
                className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">System Active</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Test Mode</label>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Days Until 25th</p>
                <p className="text-2xl font-bold">{daysUntil25th}</p>
              </div>
              <Calendar className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Division Managers</p>
                <p className="text-2xl font-bold">{divisionManagers.length}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Reminders Sent</p>
                <p className="text-2xl font-bold">{reminderLogs.length}</p>
              </div>
              <Mail className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">System Status</p>
                <p className="text-lg font-bold">{isSystemActive ? 'Active' : 'Inactive'}</p>
              </div>
              {isSystemActive ? (
                <CheckCircle className="h-8 w-8 opacity-80" />
              ) : (
                <AlertCircle className="h-8 w-8 opacity-80" />
              )}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        {testMode && currentUser.role === 'admin' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-yellow-800 mb-3">Test Reminder System</h4>
            <p className="text-sm text-yellow-700 mb-3">
              Test the automated reminder system by sending sample emails to division managers.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => sendTestReminder('3-days')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Test 22nd Reminder
              </button>
              <button
                onClick={() => sendTestReminder('1-day')}
                className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
              >
                Test 24th Reminder
              </button>
              <button
                onClick={() => sendTestReminder('final-warning')}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Test 25th Final
              </button>
            </div>
          </div>
        )}

        {/* Reminder Schedule */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Reminder Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-3 border">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">3 Days Before (22nd)</span>
              </div>
              <p className="text-xs text-gray-600">Friendly reminder about upcoming deadline</p>
            </div>
            
            <div className="bg-white rounded p-3 border">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-orange-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">1 Day Before (24th)</span>
              </div>
              <p className="text-xs text-gray-600">Second reminder about deadline</p>
            </div>
            
            <div className="bg-white rounded p-3 border">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">Final Warning (25th)</span>
              </div>
              <p className="text-xs text-gray-600">Morning of deadline - final reminder</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900">Reminder History</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
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
              {reminderLogs
                .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
                .map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.recipientName}</div>
                      <div className="text-sm text-gray-500">{log.recipientEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.triggerType === '3-days' ? 'bg-blue-100 text-blue-800' :
                      log.triggerType === '1-day' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.triggerType === '3-days' ? '3-Day Notice' :
                       log.triggerType === '1-day' ? 'Urgent' :
                       'Final Warning'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.sentAt.toLocaleDateString()} {log.sentAt.toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {log.status === 'sent' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        log.status === 'sent' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        // Show email preview
                        alert(`Subject: ${log.subject}\n\n${log.body}`);
                      }}
                      className="text-[#f4647d] hover:text-[#fd8585]"
                    >
                      View Email
                    </button>
                  </td>
                </tr>
              ))}
              {reminderLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No reminders sent yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AutoReminderSystem;