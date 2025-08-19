export interface HormoneUnit {
  unitId: string;
  unitName: string;
  npIds: string[];
  specialistIds: string[];
  patientCareSpecialistId?: string;
  adminTeamMemberId?: string;
  guestCareId?: string;
  location: string;
  customStaffMembers: string[];
}