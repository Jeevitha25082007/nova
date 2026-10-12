import { DashboardData, Student, Intervention, Faculty, RiskAnalysis, SimulationResult } from './types';

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to load dashboard metrics');
  return res.json();
}

export async function fetchStudents(params: {
  search?: string;
  department?: string;
  year?: string;
  risk?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
} = {}): Promise<{
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.department) query.set('department', params.department);
  if (params.year) query.set('year', params.year);
  if (params.risk) query.set('risk', params.risk);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await fetch(`/api/students?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch students list');
  return res.json();
}

export async function fetchStudentProfile(id: number): Promise<{
  student: Student;
  academicRecords: any[];
  subjects: any[];
  recommendations: any[];
  interventions: Intervention[];
  riskAnalysis: RiskAnalysis;
}> {
  const res = await fetch(`/api/students/${id}`);
  if (!res.ok) throw new Error('Failed to fetch student profile');
  return res.json();
}

export async function createStudent(data: Partial<Student>): Promise<{ success: boolean; student: Student }> {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create student');
  return json;
}

export async function updateStudent(id: number, data: Partial<Student>): Promise<{ success: boolean; student: Student; riskAnalysis: RiskAnalysis }> {
  const res = await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update student');
  return json;
}

export async function deleteStudent(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/students/${id}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete student');
  return json;
}

export async function fetchInterventions(params: {
  status?: string;
  priority?: string;
  faculty_id?: string;
} = {}): Promise<Intervention[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.faculty_id) query.set('faculty_id', params.faculty_id);

  const res = await fetch(`/api/interventions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch interventions');
  return res.json();
}

export async function createIntervention(data: {
  student_id: number;
  faculty_id?: number | null;
  issue: string;
  action_plan: string;
  priority: string;
  due_date: string;
}): Promise<{ success: boolean; intervention: Intervention }> {
  const res = await fetch('/api/interventions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create intervention');
  return json;
}

export async function updateIntervention(id: number, data: Partial<Intervention>): Promise<{ success: boolean; intervention: Intervention }> {
  const res = await fetch(`/api/interventions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update intervention');
  return json;
}

export async function addInterventionNote(id: number, note: string, author_name?: string): Promise<{ success: boolean; note: any }> {
  const res = await fetch(`/api/interventions/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, author_name }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to add note');
  return json;
}

export async function runSimulation(data: {
  studentId?: number | null;
  attendance: number;
  avgMarks: number;
  cgpa: number;
  assignmentCompletion: number;
}): Promise<SimulationResult> {
  const res = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Simulation calculation failed');
  return json;
}

export async function fetchFaculty(): Promise<Faculty[]> {
  const res = await fetch('/api/faculty');
  if (!res.ok) throw new Error('Failed to load faculty directory');
  return res.json();
}

export async function fetchSettings(): Promise<{ thresholds: any; weights: any }> {
  const res = await fetch('/api/settings/thresholds');
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export async function updateSettings(thresholds: any): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/settings/thresholds', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(thresholds),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update threshold settings');
  return json;
}
