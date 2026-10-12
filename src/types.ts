export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  semester: number;
  cgpa: number;
  attendance: number;
  avg_marks: number;
  assignment_completion: number;
  previous_gpa: number | null;
  risk_score: number;
  risk_category: 'Low' | 'Moderate' | 'High';
  created_at: string;
  updated_at: string;
}

export interface AcademicRecord {
  id: number;
  student_id: number;
  semester: number;
  gpa: number;
  attendance_pct: number;
  credits_enrolled: number;
  credits_earned: number;
  recorded_at: string;
}

export interface SubjectPerformance {
  id: number;
  student_id: number;
  subject_code: string;
  subject_name: string;
  internal_marks: number;
  midterm_marks: number;
  total_marks: number;
  grade: string;
  attendance_pct: number;
  status: string;
}

export interface Recommendation {
  id: number;
  student_id: number;
  identified_issue: string;
  explanation: string;
  recommended_action: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  suggested_review_date: string;
  status: 'Pending' | 'In Review' | 'Applied' | 'Dismissed';
  category: 'Attendance' | 'Coursework' | 'Mentorship' | 'Enrichment';
  created_at: string;
}

export interface FollowUpNote {
  id: number;
  intervention_id: number;
  author_name: string;
  note: string;
  created_at: string;
}

export interface Intervention {
  id: number;
  student_id: number;
  faculty_id: number | null;
  student_code?: string;
  student_name?: string;
  student_department?: string;
  student_attendance?: number;
  student_cgpa?: number;
  faculty_name?: string;
  faculty_email?: string;
  faculty_role?: string;
  avatar_color?: string;
  issue: string;
  action_plan: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date: string;
  pre_gpa: number | null;
  post_gpa: number | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
  notes?: FollowUpNote[];
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  avatar_color: string;
}

export interface RiskFactor {
  name: string;
  category: 'Attendance' | 'Academic Marks' | 'CGPA' | 'Assignments' | 'Performance Trend';
  currentValue: string | number;
  benchmark: string;
  scoreContribution: number;
  weight: number;
  weightedPoints: number;
  status: 'safe' | 'warning' | 'critical';
  details: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskCategory: 'Low' | 'Moderate' | 'High';
  screeningNotice: string;
  factors: RiskFactor[];
  primaryConcern: string;
  positiveIndicators: string[];
  calculatedAt: string;
  thresholdsUsed?: {
    lowRiskMax: number;
    moderateRiskMax: number;
    highRiskMin: number;
  };
}

export interface DashboardData {
  summary: {
    totalStudents: number;
    avgCgpa: number;
    avgAttendance: number;
    avgMarks: number;
    avgAssignments: number;
    needingSupport: number;
    highRiskCount: number;
    moderateRiskCount: number;
    performingWell: number;
    pendingInterventions: number;
    completedInterventions: number;
  };
  charts: {
    performanceDistribution: Array<{ bracket: string; count: number }>;
    attendanceVsMarks: Array<{
      id: number;
      student_id: string;
      name: string;
      department: string;
      attendance: number;
      avg_marks: number;
      cgpa: number;
      risk_category: 'Low' | 'Moderate' | 'High';
    }>;
    departmentPerformance: Array<{
      department: string;
      total: number;
      avgCgpa: number;
      avgAttendance: number;
      avgMarks: number;
      highRiskCount: number;
      moderateRiskCount: number;
      lowRiskCount: number;
    }>;
    semesterTrends: Array<{
      semester: number;
      avgGpa: number;
      avgAttendance: number;
    }>;
    riskDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  recentActivities: Array<{
    intervention_id: number;
    issue: string;
    status: string;
    priority: string;
    created_at: string;
    student_id_int: number;
    student_id: string;
    student_name: string;
    faculty_name: string;
  }>;
  criticalAlerts: Array<{
    id: number;
    student_id: string;
    name: string;
    department: string;
    attendance: number;
    cgpa: number;
    avg_marks: number;
    risk_score: number;
  }>;
  thresholds?: any;
}

export interface SimulationResult {
  baseline: RiskAnalysis | null;
  simulated: RiskAnalysis;
  delta: number;
  factorsChanged: {
    attendanceDelta: number;
    avgMarksDelta: number;
    cgpaDelta: number;
    assignmentsDelta: number;
  } | null;
  suggestedActions: Array<{
    identifiedIssue: string;
    explanation: string;
    recommendedAction: string;
    priority: string;
    suggestedReviewDate: string;
  }>;
}
