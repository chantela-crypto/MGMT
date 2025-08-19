import { HormoneUnit } from '../types/hormoneUnit';

export const hormoneUnits: HormoneUnit[] = [
  {
    unitId: 'unit-001',
    unitName: 'St. Albert Hormone Unit',
    npIds: ['emp-038'], // DANA, NP
    specialistIds: ['emp-045', 'emp-047'], // WENDY, MACKENZIE
    patientCareSpecialistId: 'emp-032', // KAITLIN-KIT
    adminTeamMemberId: 'emp-021', // TERRI
    guestCareId: 'emp-022', // AINSLEY
    location: 'St. Albert',
    customStaffMembers: [],
  },
  {
    unitId: 'unit-002',
    unitName: 'Spruce Grove Hormone Unit',
    npIds: ['emp-039'], // KATE P, NP
    specialistIds: ['emp-046'], // SHELLEY
    patientCareSpecialistId: 'emp-035', // LOUISE
    adminTeamMemberId: 'emp-026', // DEBBIE
    guestCareId: 'emp-023', // NICOLE
    location: 'Spruce Grove',
    customStaffMembers: [],
  },
  {
    unitId: 'unit-003',
    unitName: 'Sherwood Park Hormone Unit',
    npIds: ['emp-040'], // BRIGIT, NP
    specialistIds: ['emp-047'], // MACKENZIE
    patientCareSpecialistId: 'emp-033', // CAITIE
    adminTeamMemberId: 'emp-030', // ADRIANA
    guestCareId: 'emp-024', // KAITLYN
    location: 'Sherwood Park',
    customStaffMembers: [],
  },
  {
    unitId: 'unit-004',
    unitName: 'Advanced Hormone Therapy Unit',
    npIds: ['emp-041'], // CHARITY, NP
    specialistIds: ['emp-042', 'emp-043'], // MAYA, AMBER
    patientCareSpecialistId: 'emp-034', // SYDNEY
    adminTeamMemberId: 'emp-049', // LAUREN CLARK
    guestCareId: 'emp-027', // HAYLEE
    location: 'St. Albert',
    customStaffMembers: [],
  },
];