import React, { useState, useEffect } from 'react';
import { HormoneUnit } from '../types/hormoneUnit';
import { Employee } from '../types/employee';
import { X, Save, Users, UserCheck, Building2 } from 'lucide-react';

interface EditHormoneUnitModalProps {
  isOpen: boolean;
  unit: HormoneUnit | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (unit: HormoneUnit) => void;
}

const EditHormoneUnitModal: React.FC<EditHormoneUnitModalProps> = ({
  isOpen,
  unit,
  employees,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<HormoneUnit>>({});

  // Debug logging

  // Initialize form data when unit changes
  useEffect(() => {
    if (unit) {
      setFormData(unit);
    } else {
      setFormData({
        unitId: `unit-${Date.now()}`,
        unitName: '',
        npIds: [],
        specialistIds: [],
        patientCareSpecialistId: '',
        adminTeamMemberId: '',
        guestCareId: '',
        location: '',
        customStaffMembers: [],
      });
    }
  }, [unit]);

  // Filter employees by role and division
  const nursesPractitioners = employees.filter(emp => 
    emp.category.toLowerCase() === 'nurse practitioner' && 
    emp.divisionId === 'hormone' && 
    emp.isActive
  );

  const hormoneSpecialists = employees.filter(emp => 
    emp.category.toLowerCase() === 'hormone specialist' && 
    emp.divisionId === 'hormone' && 
    emp.isActive
  );

  const supportStaff = employees.filter(emp => 
    emp.isActive && 
    (emp.category.toLowerCase() === 'administrative' || 
     emp.category.toLowerCase() === 'guest care' ||
     emp.category.toLowerCase() === 'sales')
  );

  // Handle NP checkbox selection
  const handleNPSelection = (employeeId: string, isChecked: boolean) => {
    setFormData(prev => {
      const currentNPs = prev.npIds || [];
      
      if (isChecked) {
        // Add if not already selected and under limit
        if (!currentNPs.includes(employeeId) && currentNPs.length < 3) {
          return { ...prev, npIds: [...currentNPs, employeeId] };
        }
      } else {
        // Remove if selected
        return { ...prev, npIds: currentNPs.filter(id => id !== employeeId) };
      }
      
      return prev;
    });
  };

  // Handle Specialist checkbox selection
  const handleSpecialistSelection = (employeeId: string, isChecked: boolean) => {
    setFormData(prev => {
      const currentSpecialists = prev.specialistIds || [];
      
      if (isChecked) {
        // Add if not already selected and under limit
        if (!currentSpecialists.includes(employeeId) && currentSpecialists.length < 3) {
          return { ...prev, specialistIds: [...currentSpecialists, employeeId] };
        }
      } else {
        // Remove if selected
        return { ...prev, specialistIds: currentSpecialists.filter(id => id !== employeeId) };
      }
      
      return prev;
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.unitName) {
      alert('Please enter unit name');
      return;
    }
    
    if (!formData.location) {
      alert('Please select a location');
      return;
    }
    
    onSave(formData as HormoneUnit);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const selectedNPCount = formData.npIds?.length || 0;
  const selectedSpecialistCount = formData.specialistIds?.length || 0;


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-[#f4647d] mr-2" />
            <h3 className="text-xl font-bold text-gray-900">
              {unit ? 'Edit Hormone Unit' : 'Add New Hormone Unit'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Name *
              </label>
              <input
                type="text"
                value={formData.unitName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unitName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                placeholder="Enter unit name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <select
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                required
              >
                <option value="">Select Location</option>
                <option value="St. Albert">St. Albert</option>
                <option value="Spruce Grove">Spruce Grove</option>
                <option value="Sherwood Park">Sherwood Park</option>
              </select>
            </div>
          </div>

          {/* Nurse Practitioners Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 text-[#f4647d] mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Nurse Practitioners</h4>
              </div>
              <div className="text-sm text-gray-600">
                Selected: {selectedNPCount}/3 (3 NPs = 1 FTE)
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {nursesPractitioners.map(employee => {
                const isSelected = formData.npIds?.includes(employee.id) || false;
                const isDisabled = !isSelected && selectedNPCount >= 3;

                return (
                  <div key={employee.id} className="flex items-center p-3 bg-white rounded border">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleNPSelection(employee.id, e.target.checked)}
                      disabled={isDisabled}
                      className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.position}</div>
                    </div>
                    {isSelected && (
                      <div className="text-green-600">
                        <UserCheck className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}
              {nursesPractitioners.length === 0 && (
                <p className="text-gray-500 text-center py-4">No nurse practitioners available</p>
              )}
            </div>
          </div>

          {/* Hormone Specialists Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-[#0c5b63] mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Hormone Specialists</h4>
              </div>
              <div className="text-sm text-gray-600">
                Selected: {selectedSpecialistCount}/3
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {hormoneSpecialists.map(employee => {
                const isSelected = formData.specialistIds?.includes(employee.id) || false;
                const isDisabled = !isSelected && selectedSpecialistCount >= 3;

                return (
                  <div key={employee.id} className="flex items-center p-3 bg-white rounded border">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSpecialistSelection(employee.id, e.target.checked)}
                      disabled={isDisabled}
                      className="h-4 w-4 text-[#0c5b63] focus:ring-[#0c5b63] border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.position}</div>
                    </div>
                    {isSelected && (
                      <div className="text-green-600">
                        <UserCheck className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}
              {hormoneSpecialists.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hormone specialists available</p>
              )}
            </div>
          </div>

          {/* Support Staff Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Care Specialist
              </label>
              <select
                value={formData.patientCareSpecialistId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, patientCareSpecialistId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                <option value="">Select Patient Care Specialist</option>
                {supportStaff.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Team Member
              </label>
              <select
                value={formData.adminTeamMemberId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, adminTeamMemberId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                <option value="">Select Admin Team Member</option>
                {supportStaff.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Care
              </label>
              <select
                value={formData.guestCareId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, guestCareId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                <option value="">Select Guest Care</option>
                {supportStaff.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {unit ? 'Update Unit' : 'Create Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHormoneUnitModal;