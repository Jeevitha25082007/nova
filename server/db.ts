import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { calculateRisk, generateRecommendations, DEFAULT_THRESHOLDS } from './analytics.js';

const DB_DIR = path.resolve(process.cwd(), 'instance');
const DB_PATH = path.resolve(DB_DIR, 'nova.db');

// Ensure instance directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize all database tables if they do not exist
 */
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT NOT NULL,
      year INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      cgpa REAL NOT NULL,
      attendance REAL NOT NULL,
      avg_marks REAL NOT NULL,
      assignment_completion REAL NOT NULL,
      previous_gpa REAL,
      risk_score REAL NOT NULL,
      risk_category TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS AcademicRecords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      gpa REAL NOT NULL,
      attendance_pct REAL NOT NULL,
      credits_enrolled INTEGER NOT NULL,
      credits_earned INTEGER NOT NULL,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS SubjectPerformance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      internal_marks REAL NOT NULL,
      midterm_marks REAL NOT NULL,
      total_marks REAL NOT NULL,
      grade TEXT NOT NULL,
      attendance_pct REAL NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar_color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      faculty_id INTEGER,
      issue TEXT NOT NULL,
      action_plan TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date TEXT NOT NULL,
      pre_gpa REAL,
      post_gpa REAL,
      outcome TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES Faculty(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS FollowUpNotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intervention_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (intervention_id) REFERENCES Interventions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      identified_issue TEXT NOT NULL,
      explanation TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      priority TEXT NOT NULL,
      suggested_review_date TEXT NOT NULL,
      status TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Initialize default threshold settings if not set
  const checkSetting = db.prepare('SELECT value FROM Settings WHERE key = ?').get('thresholds') as { value: string } | undefined;
  if (!checkSetting) {
    db.prepare('INSERT INTO Settings (key, value) VALUES (?, ?)').run('thresholds', JSON.stringify(DEFAULT_THRESHOLDS));
  }

  // Seed demo data if database is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM Students').get() as { count: number };
  if (countRow.count === 0) {
    seedDatabase();
  }
}

/**
 * Seed realistic demo data
 */
export function seedDatabase() {
  console.log('[NOVA DB] Seeding database with realistic student cohort...');

  // 1. Seed Faculty members
  const facultyMembers = [
    { name: 'Dr. Sarah Mitchell', email: 's.mitchell@nova.edu', department: 'Computer Science', role: 'Department Head & Senior Advisor', avatar_color: '#7965E8' },
    { name: 'Prof. Marcus Vance', email: 'm.vance@nova.edu', department: 'Electrical Engineering', role: 'Academic Success Mentor', avatar_color: '#4B7BEC' },
    { name: 'Dr. Anita Desai', email: 'a.desai@nova.edu', department: 'Information Technology', role: 'Student Wellness & Progress Lead', avatar_color: '#20BF6B' },
    { name: 'Prof. David Chen', email: 'd.chen@nova.edu', department: 'Mechanical Engineering', role: 'Faculty Mentor', avatar_color: '#FA8231' },
    { name: 'Dr. Elena Rostova', email: 'e.rostova@nova.edu', department: 'Civil Engineering', role: 'First-Year Academic Coordinator', avatar_color: '#8854D0' }
  ];

  const insertFaculty = db.prepare('INSERT INTO Faculty (name, email, department, role, avatar_color) VALUES (?, ?, ?, ?, ?)');
  for (const f of facultyMembers) {
    insertFaculty.run(f.name, f.email, f.department, f.role, f.avatar_color);
  }

  // 2. Realistic student cohort definitions
  const rawStudents = [
    // High Risk Cases (Critical interventions required)
    { student_id: 'STU-2024-001', name: 'Aiden Brooks', email: 'aiden.b@nova.edu', department: 'Computer Science', year: 2, semester: 4, cgpa: 4.82, attendance: 54.2, avg_marks: 48.0, assignment_completion: 42.0, previous_gpa: 5.70 },
    { student_id: 'STU-2024-002', name: 'Maya Patel', email: 'maya.p@nova.edu', department: 'Electrical Engineering', year: 3, semester: 6, cgpa: 5.15, attendance: 58.0, avg_marks: 52.4, assignment_completion: 55.0, previous_gpa: 5.95 },
    { student_id: 'STU-2024-003', name: 'Carlos Mendez', email: 'carlos.m@nova.edu', department: 'Mechanical Engineering', year: 1, semester: 2, cgpa: 4.90, attendance: 49.5, avg_marks: 43.5, assignment_completion: 38.0, previous_gpa: null },
    { student_id: 'STU-2024-004', name: 'Zoe Washington', email: 'zoe.w@nova.edu', department: 'Information Technology', year: 2, semester: 3, cgpa: 5.40, attendance: 61.0, avg_marks: 49.8, assignment_completion: 60.0, previous_gpa: 6.20 },
    { student_id: 'STU-2024-005', name: 'Devon Kim', email: 'devon.k@nova.edu', department: 'Civil Engineering', year: 4, semester: 7, cgpa: 5.25, attendance: 55.8, avg_marks: 54.0, assignment_completion: 50.0, previous_gpa: 6.10 },

    // Moderate Risk Cases (Attendance or exam warning)
    { student_id: 'STU-2024-006', name: 'Liam O\'Connor', email: 'liam.oc@nova.edu', department: 'Computer Science', year: 3, semester: 5, cgpa: 6.45, attendance: 71.0, avg_marks: 64.2, assignment_completion: 72.0, previous_gpa: 6.80 },
    { student_id: 'STU-2024-007', name: 'Sofia Rodriguez', email: 'sofia.r@nova.edu', department: 'Information Technology', year: 2, semester: 4, cgpa: 6.70, attendance: 68.5, avg_marks: 61.5, assignment_completion: 78.0, previous_gpa: 6.90 },
    { student_id: 'STU-2024-008', name: 'Tariq Al-Mansoor', email: 'tariq.am@nova.edu', department: 'Electrical Engineering', year: 1, semester: 2, cgpa: 6.30, attendance: 74.0, avg_marks: 58.0, assignment_completion: 65.0, previous_gpa: null },
    { student_id: 'STU-2024-009', name: 'Emma Watson-Lee', email: 'emma.wl@nova.edu', department: 'Mechanical Engineering', year: 2, semester: 3, cgpa: 6.85, attendance: 73.2, avg_marks: 67.0, assignment_completion: 70.0, previous_gpa: 7.20 },
    { student_id: 'STU-2024-010', name: 'Kavita Sundaram', email: 'kavita.s@nova.edu', department: 'Civil Engineering', year: 3, semester: 6, cgpa: 6.55, attendance: 69.8, avg_marks: 63.0, assignment_completion: 68.0, previous_gpa: 6.60 },
    { student_id: 'STU-2024-011', name: 'Lucas Dubois', email: 'lucas.d@nova.edu', department: 'Computer Science', year: 4, semester: 8, cgpa: 6.90, attendance: 74.5, avg_marks: 66.8, assignment_completion: 74.0, previous_gpa: 7.00 },

    // Low Risk / High Performing Cohort
    { student_id: 'STU-2024-012', name: 'Ananya Sharma', email: 'ananya.s@nova.edu', department: 'Computer Science', year: 3, semester: 6, cgpa: 9.42, attendance: 96.5, avg_marks: 92.8, assignment_completion: 98.0, previous_gpa: 9.30 },
    { student_id: 'STU-2024-013', name: 'Ethan Huntley', email: 'ethan.h@nova.edu', department: 'Electrical Engineering', year: 4, semester: 8, cgpa: 8.95, attendance: 92.0, avg_marks: 88.5, assignment_completion: 95.0, previous_gpa: 8.80 },
    { student_id: 'STU-2024-014', name: 'Chloe Becker', email: 'chloe.b@nova.edu', department: 'Information Technology', year: 2, semester: 4, cgpa: 8.75, attendance: 91.5, avg_marks: 86.0, assignment_completion: 94.0, previous_gpa: 8.50 },
    { student_id: 'STU-2024-015', name: 'Noah Takahashi', email: 'noah.t@nova.edu', department: 'Mechanical Engineering', year: 3, semester: 5, cgpa: 9.10, attendance: 94.0, avg_marks: 89.2, assignment_completion: 96.0, previous_gpa: 9.00 },
    { student_id: 'STU-2024-016', name: 'Grace Hopper-Smith', email: 'grace.hs@nova.edu', department: 'Computer Science', year: 1, semester: 2, cgpa: 8.80, attendance: 95.0, avg_marks: 87.0, assignment_completion: 92.0, previous_gpa: null },
    { student_id: 'STU-2024-017', name: 'Rohan Gupta', email: 'rohan.g@nova.edu', department: 'Civil Engineering', year: 2, semester: 3, cgpa: 8.60, attendance: 89.5, avg_marks: 84.5, assignment_completion: 90.0, previous_gpa: 8.40 },

    // Solid Mid-Tier Performers
    { student_id: 'STU-2024-018', name: 'Olivia Martin', email: 'olivia.m@nova.edu', department: 'Computer Science', year: 2, semester: 3, cgpa: 7.65, attendance: 84.0, avg_marks: 75.0, assignment_completion: 82.0, previous_gpa: 7.50 },
    { student_id: 'STU-2024-019', name: 'Benjamin Scott', email: 'ben.s@nova.edu', department: 'Electrical Engineering', year: 3, semester: 5, cgpa: 7.80, attendance: 86.5, avg_marks: 78.2, assignment_completion: 85.0, previous_gpa: 7.70 },
    { student_id: 'STU-2024-020', name: 'Mia Kowalski', email: 'mia.k@nova.edu', department: 'Information Technology', year: 1, semester: 1, cgpa: 7.40, attendance: 82.0, avg_marks: 72.5, assignment_completion: 80.0, previous_gpa: null },
    { student_id: 'STU-2024-021', name: 'Alexander Wright', email: 'alex.w@nova.edu', department: 'Mechanical Engineering', year: 4, semester: 7, cgpa: 7.90, attendance: 88.0, avg_marks: 79.0, assignment_completion: 88.0, previous_gpa: 7.85 },
    { student_id: 'STU-2024-022', name: 'Priya Nambiar', email: 'priya.n@nova.edu', department: 'Civil Engineering', year: 2, semester: 4, cgpa: 7.50, attendance: 85.2, avg_marks: 76.0, assignment_completion: 83.0, previous_gpa: 7.30 }
  ];

  const now = new Date().toISOString();

  const insertStudent = db.prepare(`
    INSERT INTO Students (
      student_id, name, email, department, year, semester,
      cgpa, attendance, avg_marks, assignment_completion, previous_gpa,
      risk_score, risk_category, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAcademic = db.prepare(`
    INSERT INTO AcademicRecords (
      student_id, semester, gpa, attendance_pct, credits_enrolled, credits_earned, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSubject = db.prepare(`
    INSERT INTO SubjectPerformance (
      student_id, subject_code, subject_name, internal_marks, midterm_marks, total_marks, grade, attendance_pct, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRec = db.prepare(`
    INSERT INTO Recommendations (
      student_id, identified_issue, explanation, recommended_action, priority, suggested_review_date, status, category, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertIntervention = db.prepare(`
    INSERT INTO Interventions (
      student_id, faculty_id, issue, action_plan, priority, status, due_date, pre_gpa, post_gpa, outcome, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO FollowUpNotes (intervention_id, author_name, note, created_at)
    VALUES (?, ?, ?, ?)
  `);

  // Subjects blueprint per department
  const subjectsMap: Record<string, Array<{ code: string; name: string }>> = {
    'Computer Science': [
      { code: 'CS201', name: 'Data Structures & Algorithms' },
      { code: 'CS202', name: 'Database Management Systems' },
      { code: 'CS203', name: 'Computer Architecture' },
      { code: 'CS204', name: 'Operating Systems' }
    ],
    'Electrical Engineering': [
      { code: 'EE201', name: 'Signals and Systems' },
      { code: 'EE202', name: 'Circuit Theory' },
      { code: 'EE203', name: 'Electromagnetics' },
      { code: 'EE204', name: 'Digital Logic Design' }
    ],
    'Information Technology': [
      { code: 'IT201', name: 'Web Application Architecture' },
      { code: 'IT202', name: 'Computer Networks' },
      { code: 'IT203', name: 'Information Security Fundamentals' },
      { code: 'IT204', name: 'Cloud Computing Infrastructure' }
    ],
    'Mechanical Engineering': [
      { code: 'ME201', name: 'Thermodynamics' },
      { code: 'ME202', name: 'Fluid Mechanics' },
      { code: 'ME203', name: 'Mechanics of Materials' },
      { code: 'ME204', name: 'Kinematics of Machinery' }
    ],
    'Civil Engineering': [
      { code: 'CE201', name: 'Structural Analysis' },
      { code: 'CE202', name: 'Geotechnical Engineering' },
      { code: 'CE203', name: 'Surveying & Geomatics' },
      { code: 'CE204', name: 'Environmental Engineering' }
    ]
  };

  for (const s of rawStudents) {
    const riskAnalysis = calculateRisk({
      attendance: s.attendance,
      avgMarks: s.avg_marks,
      cgpa: s.cgpa,
      assignmentCompletion: s.assignment_completion,
      previousGpa: s.previous_gpa
    });

    const studentResult = insertStudent.run(
      s.student_id,
      s.name,
      s.email,
      s.department,
      s.year,
      s.semester,
      s.cgpa,
      s.attendance,
      s.avg_marks,
      s.assignment_completion,
      s.previous_gpa,
      riskAnalysis.riskScore,
      riskAnalysis.riskCategory,
      now,
      now
    );

    const studentDbId = Number(studentResult.lastInsertRowid);

    // Seed historical semesters
    for (let sem = 1; sem <= s.semester; sem++) {
      const semGpa = sem === s.semester ? s.cgpa : Math.max(4.0, Math.min(10.0, s.cgpa + (Math.random() * 0.6 - 0.3)));
      const semAtt = sem === s.semester ? s.attendance : Math.max(50, Math.min(100, s.attendance + (Math.random() * 8 - 4)));
      insertAcademic.run(
        studentDbId,
        sem,
        Number(semGpa.toFixed(2)),
        Number(semAtt.toFixed(1)),
        20,
        s.cgpa < 5.0 ? 16 : 20,
        `2024-0${sem}-15`
      );
    }

    // Seed current semester subjects
    const deptSubjects = subjectsMap[s.department] || subjectsMap['Computer Science'];
    const generatedSubjects = deptSubjects.map((sub, idx) => {
      // Scale marks based on student average marks
      const variance = (idx % 2 === 0 ? 1 : -1) * (idx * 4);
      const totalMarks = Math.min(100, Math.max(30, Number((s.avg_marks + variance).toFixed(1))));
      const internalMarks = Number((totalMarks * 0.4).toFixed(1));
      const midtermMarks = Number((totalMarks * 0.6).toFixed(1));
      const subAtt = Math.min(100, Math.max(40, Number((s.attendance + (Math.random() * 6 - 3)).toFixed(1))));

      let grade = 'B';
      if (totalMarks >= 90) grade = 'A+';
      else if (totalMarks >= 80) grade = 'A';
      else if (totalMarks >= 70) grade = 'B+';
      else if (totalMarks >= 60) grade = 'B';
      else if (totalMarks >= 50) grade = 'C';
      else if (totalMarks >= 40) grade = 'D';
      else grade = 'F';

      insertSubject.run(
        studentDbId,
        sub.code,
        sub.name,
        internalMarks,
        midtermMarks,
        totalMarks,
        grade,
        subAtt,
        totalMarks >= 50 ? 'Passing' : 'At Risk'
      );

      return {
        subjectName: sub.name,
        totalMarks,
        attendancePct: subAtt
      };
    });

    // Seed Personalized Recommendations
    const recs = generateRecommendations(
      {
        id: studentDbId,
        name: s.name,
        attendance: s.attendance,
        avgMarks: s.avg_marks,
        cgpa: s.cgpa,
        assignmentCompletion: s.assignment_completion,
        previousGpa: s.previous_gpa
      },
      riskAnalysis,
      generatedSubjects
    );

    for (const r of recs) {
      insertRec.run(
        studentDbId,
        r.identifiedIssue,
        r.explanation,
        r.recommendedAction,
        r.priority,
        r.suggestedReviewDate,
        r.status,
        r.category,
        now
      );
    }

    // Seed Interventions for high/moderate risk students
    if (riskAnalysis.riskCategory === 'High') {
      const facultyId = (studentDbId % 5) + 1;
      const interventionResult = insertIntervention.run(
        studentDbId,
        facultyId,
        `Academic Debarment Warning: Critical Attendance & Failing Grade Hazard`,
        `Mandatory weekly advisor check-ins; academic recovery contract signed; paired with senior honors tutor.`,
        'Critical',
        studentDbId === 1 ? 'In Progress' : (studentDbId === 2 ? 'Pending' : 'In Progress'),
        '2026-10-25',
        s.cgpa,
        null,
        'Bi-weekly progress check underway; attendance monitored via digital log.',
        now,
        now
      );
      const intId = Number(interventionResult.lastInsertRowid);
      insertNote.run(intId, 'Dr. Sarah Mitchell', 'Initial diagnostic meeting held. Student reported transport difficulty and part-time job schedule conflicts. Revised schedule agreed.', now);
      if (studentDbId === 1) {
        insertNote.run(intId, 'Dr. Sarah Mitchell', 'Follow-up check: Student attended 4 out of 4 lecture blocks this past week. Progress on track.', now);
      }
    } else if (studentDbId === 6 || studentDbId === 8) {
      const facultyId = (studentDbId % 5) + 1;
      const interventionResult = insertIntervention.run(
        studentDbId,
        facultyId,
        `Midterm Exam Deficit in Core Prerequisites`,
        `Assigned remedial lab practice sets and mandatory office hour attendance before mid-term test 2.`,
        'Medium',
        'In Progress',
        '2026-10-30',
        s.cgpa,
        null,
        null,
        now,
        now
      );
      const intId = Number(interventionResult.lastInsertRowid);
      insertNote.run(intId, 'Prof. Marcus Vance', 'Enrolled in Saturday problem-solving clinic.', now);
    } else if (studentDbId === 10) {
      // Completed intervention example for tracking before/after
      const facultyId = 3;
      const interventionResult = insertIntervention.run(
        studentDbId,
        facultyId,
        `Attendance Drop in Fluid Mechanics (CE202)`,
        `Biometric attendance tracking and remedial tutorial support provided.`,
        'High',
        'Completed',
        '2026-09-15',
        5.80,
        6.55,
        'Successfully completed. Attendance recovered from 61% to 69.8%, and semester GPA improved by +0.75 points.',
        '2026-09-01T10:00:00Z',
        '2026-09-20T14:30:00Z'
      );
      const intId = Number(interventionResult.lastInsertRowid);
      insertNote.run(intId, 'Dr. Anita Desai', 'Student successfully sat all makeup laboratory evaluations.', '2026-09-18T11:00:00Z');
    }
  }

  console.log('[NOVA DB] Database seeded successfully with 22 students and realistic academic history!');
}
