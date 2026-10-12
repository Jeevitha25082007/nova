import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase, db } from './server/db.js';
import { calculateRisk, generateRecommendations, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, ThresholdConfig } from './server/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database and tables
initDatabase();

const app = express();
app.use(express.json());

// CORS and security headers for API
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Helper to get active thresholds
function getActiveThresholds(): ThresholdConfig {
  try {
    const row = db.prepare('SELECT value FROM Settings WHERE key = ?').get('thresholds') as { value: string } | undefined;
    if (row && row.value) {
      return JSON.parse(row.value);
    }
  } catch (err) {
    console.error('Failed to parse threshold settings:', err);
  }
  return DEFAULT_THRESHOLDS;
}

// ==========================================
// 1. DASHBOARD OVERVIEW API
// ==========================================
app.get('/api/dashboard', (req, res) => {
  try {
    const thresholds = getActiveThresholds();

    // Total students
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM Students').get() as { count: number };
    const totalStudents = totalRow.count;

    // Averages
    const avgRow = db.prepare(`
      SELECT 
        AVG(cgpa) as avgCgpa,
        AVG(attendance) as avgAttendance,
        AVG(avg_marks) as avgMarks,
        AVG(assignment_completion) as avgAssignments
      FROM Students
    `).get() as { avgCgpa: number; avgAttendance: number; avgMarks: number; avgAssignments: number };

    // Support counts by risk category
    const highRiskRow = db.prepare("SELECT COUNT(*) as count FROM Students WHERE risk_category = 'High'").get() as { count: number };
    const modRiskRow = db.prepare("SELECT COUNT(*) as count FROM Students WHERE risk_category = 'Moderate'").get() as { count: number };
    const lowRiskRow = db.prepare("SELECT COUNT(*) as count FROM Students WHERE risk_category = 'Low'").get() as { count: number };

    // Interventions stats
    const pendingInterventionsRow = db.prepare("SELECT COUNT(*) as count FROM Interventions WHERE status IN ('Pending', 'In Progress')").get() as { count: number };
    const completedInterventionsRow = db.prepare("SELECT COUNT(*) as count FROM Interventions WHERE status = 'Completed'").get() as { count: number };

    // Performance distribution (CGPA brackets: <6.0, 6.0-7.5, 7.5-8.5, 8.5-10)
    const perfDistribution = [
      { bracket: '< 6.0 (At-Risk)', count: (db.prepare('SELECT COUNT(*) as c FROM Students WHERE cgpa < 6.0').get() as { c: number }).c },
      { bracket: '6.0 - 7.5 (Average)', count: (db.prepare('SELECT COUNT(*) as c FROM Students WHERE cgpa >= 6.0 AND cgpa < 7.5').get() as { c: number }).c },
      { bracket: '7.5 - 8.5 (Good)', count: (db.prepare('SELECT COUNT(*) as c FROM Students WHERE cgpa >= 7.5 AND cgpa < 8.5').get() as { c: number }).c },
      { bracket: '8.5 - 10.0 (Honors)', count: (db.prepare('SELECT COUNT(*) as c FROM Students WHERE cgpa >= 8.5').get() as { c: number }).c }
    ];

    // Attendance vs Marks scatter data
    const scatterData = db.prepare(`
      SELECT id, student_id, name, department, attendance, avg_marks, cgpa, risk_category 
      FROM Students 
      ORDER BY id ASC
    `).all();

    // Department-wise performance
    const deptRows = db.prepare(`
      SELECT 
        department,
        COUNT(*) as total,
        ROUND(AVG(cgpa), 2) as avgCgpa,
        ROUND(AVG(attendance), 1) as avgAttendance,
        ROUND(AVG(avg_marks), 1) as avgMarks,
        SUM(CASE WHEN risk_category = 'High' THEN 1 ELSE 0 END) as highRiskCount,
        SUM(CASE WHEN risk_category = 'Moderate' THEN 1 ELSE 0 END) as moderateRiskCount,
        SUM(CASE WHEN risk_category = 'Low' THEN 1 ELSE 0 END) as lowRiskCount
      FROM Students
      GROUP BY department
    `).all();

    // Monthly / Semester trend aggregates
    const trendRows = db.prepare(`
      SELECT 
        semester,
        ROUND(AVG(gpa), 2) as avgGpa,
        ROUND(AVG(attendance_pct), 1) as avgAttendance
      FROM AcademicRecords
      GROUP BY semester
      ORDER BY semester ASC
    `).all();

    // Recent activities (interventions and notes)
    const recentActivities = db.prepare(`
      SELECT 
        i.id as intervention_id,
        i.issue,
        i.status,
        i.priority,
        i.created_at,
        s.id as student_id_int,
        s.student_id,
        s.name as student_name,
        f.name as faculty_name
      FROM Interventions i
      JOIN Students s ON i.student_id = s.id
      LEFT JOIN Faculty f ON i.faculty_id = f.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `).all();

    // Critical Alerts
    const criticalStudents = db.prepare(`
      SELECT id, student_id, name, department, attendance, cgpa, avg_marks, risk_score
      FROM Students
      WHERE risk_category = 'High'
      ORDER BY risk_score DESC
      LIMIT 4
    `).all();

    res.json({
      summary: {
        totalStudents,
        avgCgpa: Number((avgRow.avgCgpa || 0).toFixed(2)),
        avgAttendance: Number((avgRow.avgAttendance || 0).toFixed(1)),
        avgMarks: Number((avgRow.avgMarks || 0).toFixed(1)),
        avgAssignments: Number((avgRow.avgAssignments || 0).toFixed(1)),
        needingSupport: highRiskRow.count + modRiskRow.count,
        highRiskCount: highRiskRow.count,
        moderateRiskCount: modRiskRow.count,
        performingWell: lowRiskRow.count,
        pendingInterventions: pendingInterventionsRow.count,
        completedInterventions: completedInterventionsRow.count,
      },
      charts: {
        performanceDistribution: perfDistribution,
        attendanceVsMarks: scatterData,
        departmentPerformance: deptRows,
        semesterTrends: trendRows,
        riskDistribution: [
          { name: 'Low Risk', value: lowRiskRow.count, color: '#20BF6B' },
          { name: 'Moderate Risk', value: modRiskRow.count, color: '#FA8231' },
          { name: 'High Risk', value: highRiskRow.count, color: '#EB3B5A' },
        ]
      },
      recentActivities,
      criticalAlerts: criticalStudents,
      thresholds
    });
  } catch (error) {
    console.error('Error in /api/dashboard:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
});

// ==========================================
// 2. STUDENTS DIRECTORY & CRUD API
// ==========================================
app.get('/api/students', (req, res) => {
  try {
    const { search, department, year, risk, page = '1', limit = '10', sortBy = 'id', sortOrder = 'ASC' } = req.query;

    let query = 'SELECT * FROM Students WHERE 1=1';
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ' AND (name LIKE ? OR student_id LIKE ? OR email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (department && department !== 'All') {
      query += ' AND department = ?';
      params.push(department);
    }

    if (year && year !== 'All') {
      query += ' AND year = ?';
      params.push(Number(year));
    }

    if (risk && risk !== 'All') {
      query += ' AND risk_category = ?';
      params.push(risk);
    }

    // Total count for pagination
    const countSql = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const totalCountRow = db.prepare(countSql).get(...params) as { count: number };
    const total = totalCountRow.count;

    // Sorting
    const safeSortCols = ['id', 'name', 'student_id', 'department', 'year', 'cgpa', 'attendance', 'avg_marks', 'risk_score'];
    const orderCol = safeSortCols.includes(String(sortBy)) ? String(sortBy) : 'id';
    const orderDir = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY ${orderCol} ${orderDir}`;

    // Pagination
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const students = db.prepare(query).all(...params);

    res.json({
      students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
});

// Create new student
app.post('/api/students', (req, res) => {
  try {
    const { student_id, name, email, department, year, semester, cgpa, attendance, avg_marks, assignment_completion, previous_gpa } = req.body;

    // Validation
    if (!student_id || !name || !email || !department) {
      return res.status(400).json({ error: 'Student ID, Name, Email, and Department are required.' });
    }

    // Check duplicate student_id
    const existing = db.prepare('SELECT id FROM Students WHERE student_id = ?').get(student_id.trim());
    if (existing) {
      return res.status(409).json({ error: `Student ID "${student_id}" is already assigned to another student.` });
    }

    const parsedYear = Number(year) || 1;
    const parsedSem = Number(semester) || 1;
    const parsedCgpa = Math.min(10, Math.max(0, Number(cgpa) || 0));
    const parsedAtt = Math.min(100, Math.max(0, Number(attendance) || 0));
    const parsedMarks = Math.min(100, Math.max(0, Number(avg_marks) || 0));
    const parsedAssign = Math.min(100, Math.max(0, Number(assignment_completion) || 0));
    const parsedPrevGpa = previous_gpa !== undefined && previous_gpa !== null && previous_gpa !== '' ? Number(previous_gpa) : null;

    const thresholds = getActiveThresholds();
    const riskAnalysis = calculateRisk({
      attendance: parsedAtt,
      avgMarks: parsedMarks,
      cgpa: parsedCgpa,
      assignmentCompletion: parsedAssign,
      previousGpa: parsedPrevGpa
    }, thresholds);

    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO Students (
        student_id, name, email, department, year, semester,
        cgpa, attendance, avg_marks, assignment_completion, previous_gpa,
        risk_score, risk_category, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      student_id.trim(),
      name.trim(),
      email.trim(),
      department,
      parsedYear,
      parsedSem,
      parsedCgpa,
      parsedAtt,
      parsedMarks,
      parsedAssign,
      parsedPrevGpa,
      riskAnalysis.riskScore,
      riskAnalysis.riskCategory,
      now,
      now
    );

    const newId = Number(result.lastInsertRowid);

    // Create baseline academic record
    db.prepare(`
      INSERT INTO AcademicRecords (student_id, semester, gpa, attendance_pct, credits_enrolled, credits_earned, recorded_at)
      VALUES (?, ?, ?, ?, 20, ?, ?)
    `).run(newId, parsedSem, parsedCgpa, parsedAtt, parsedCgpa >= 5.0 ? 20 : 16, now.split('T')[0]);

    // Create 3 standard departmental subject records
    const sampleSubjects = [
      { code: 'SUB101', name: 'Core Foundations I' },
      { code: 'SUB102', name: 'Technical Analysis & Lab' },
      { code: 'SUB103', name: 'Applied Systems Theory' }
    ];

    for (const sub of sampleSubjects) {
      const tot = parsedMarks;
      let grade = 'B';
      if (tot >= 90) grade = 'A+';
      else if (tot >= 80) grade = 'A';
      else if (tot >= 70) grade = 'B+';
      else if (tot >= 60) grade = 'B';
      else if (tot >= 50) grade = 'C';
      else grade = 'F';

      db.prepare(`
        INSERT INTO SubjectPerformance (student_id, subject_code, subject_name, internal_marks, midterm_marks, total_marks, grade, attendance_pct, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newId, sub.code, sub.name, Number((tot * 0.4).toFixed(1)), Number((tot * 0.6).toFixed(1)), tot, grade, parsedAtt, tot >= 50 ? 'Passing' : 'At Risk');
    }

    // Generate initial recommendations
    const recs = generateRecommendations(
      {
        id: newId,
        name: name.trim(),
        attendance: parsedAtt,
        avgMarks: parsedMarks,
        cgpa: parsedCgpa,
        assignmentCompletion: parsedAssign,
        previousGpa: parsedPrevGpa
      },
      riskAnalysis
    );

    const insertRec = db.prepare(`
      INSERT INTO Recommendations (student_id, identified_issue, explanation, recommended_action, priority, suggested_review_date, status, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of recs) {
      insertRec.run(newId, r.identifiedIssue, r.explanation, r.recommendedAction, r.priority, r.suggestedReviewDate, r.status, r.category, now);
    }

    const createdStudent = db.prepare('SELECT * FROM Students WHERE id = ?').get(newId);
    res.status(201).json({ success: true, student: createdStudent });
  } catch (error: any) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: error.message || 'Failed to create student' });
  }
});

// Get single student full profile
app.get('/api/students/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const student = db.prepare('SELECT * FROM Students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const academicRecords = db.prepare('SELECT * FROM AcademicRecords WHERE student_id = ? ORDER BY semester ASC').all(id);
    const subjects = db.prepare('SELECT * FROM SubjectPerformance WHERE student_id = ? ORDER BY id ASC').all(id);
    const recommendations = db.prepare('SELECT * FROM Recommendations WHERE student_id = ? ORDER BY id DESC').all(id);
    const interventions = db.prepare(`
      SELECT 
        i.*,
        f.name as faculty_name,
        f.email as faculty_email,
        f.role as faculty_role
      FROM Interventions i
      LEFT JOIN Faculty f ON i.faculty_id = f.id
      WHERE i.student_id = ?
      ORDER BY i.created_at DESC
    `).all(id);

    // Fetch notes for all interventions
    for (const intv of interventions as any[]) {
      intv.notes = db.prepare('SELECT * FROM FollowUpNotes WHERE intervention_id = ? ORDER BY created_at ASC').all(intv.id);
    }

    const thresholds = getActiveThresholds();
    const riskAnalysis = calculateRisk({
      attendance: (student as any).attendance,
      avgMarks: (student as any).avg_marks,
      cgpa: (student as any).cgpa,
      assignmentCompletion: (student as any).assignment_completion,
      previousGpa: (student as any).previous_gpa
    }, thresholds);

    res.json({
      student,
      academicRecords,
      subjects,
      recommendations,
      interventions,
      riskAnalysis
    });
  } catch (error) {
    console.error('Error getting student profile:', error);
    res.status(500).json({ error: 'Failed to retrieve student profile' });
  }
});

// Update student record
app.put('/api/students/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const current = db.prepare('SELECT * FROM Students WHERE id = ?').get(id) as any;
    if (!current) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const { name, email, department, year, semester, cgpa, attendance, avg_marks, assignment_completion, previous_gpa } = req.body;

    const updatedCgpa = cgpa !== undefined ? Math.min(10, Math.max(0, Number(cgpa))) : current.cgpa;
    const updatedAtt = attendance !== undefined ? Math.min(100, Math.max(0, Number(attendance))) : current.attendance;
    const updatedMarks = avg_marks !== undefined ? Math.min(100, Math.max(0, Number(avg_marks))) : current.avg_marks;
    const updatedAssign = assignment_completion !== undefined ? Math.min(100, Math.max(0, Number(assignment_completion))) : current.assignment_completion;
    const updatedPrevGpa = previous_gpa !== undefined ? (previous_gpa === null || previous_gpa === '' ? null : Number(previous_gpa)) : current.previous_gpa;

    const thresholds = getActiveThresholds();
    const riskAnalysis = calculateRisk({
      attendance: updatedAtt,
      avgMarks: updatedMarks,
      cgpa: updatedCgpa,
      assignmentCompletion: updatedAssign,
      previousGpa: updatedPrevGpa
    }, thresholds);

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE Students SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        department = COALESCE(?, department),
        year = COALESCE(?, year),
        semester = COALESCE(?, semester),
        cgpa = ?,
        attendance = ?,
        avg_marks = ?,
        assignment_completion = ?,
        previous_gpa = ?,
        risk_score = ?,
        risk_category = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      email ? email.trim() : null,
      department || null,
      year ? Number(year) : null,
      semester ? Number(semester) : null,
      updatedCgpa,
      updatedAtt,
      updatedMarks,
      updatedAssign,
      updatedPrevGpa,
      riskAnalysis.riskScore,
      riskAnalysis.riskCategory,
      now,
      id
    );

    // Refresh recommendations based on new data
    const subjects = db.prepare('SELECT subject_name as subjectName, total_marks as totalMarks, attendance_pct as attendancePct FROM SubjectPerformance WHERE student_id = ?').all(id) as any[];
    const freshRecs = generateRecommendations(
      {
        id,
        name: name || current.name,
        attendance: updatedAtt,
        avgMarks: updatedMarks,
        cgpa: updatedCgpa,
        assignmentCompletion: updatedAssign,
        previousGpa: updatedPrevGpa
      },
      riskAnalysis,
      subjects
    );

    // Mark previous pending recommendations as replaced, then add fresh
    db.prepare("DELETE FROM Recommendations WHERE student_id = ? AND status = 'Pending'").run(id);
    const insertRec = db.prepare(`
      INSERT INTO Recommendations (student_id, identified_issue, explanation, recommended_action, priority, suggested_review_date, status, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of freshRecs) {
      insertRec.run(id, r.identifiedIssue, r.explanation, r.recommendedAction, r.priority, r.suggestedReviewDate, r.status, r.category, now);
    }

    const updated = db.prepare('SELECT * FROM Students WHERE id = ?').get(id);
    res.json({ success: true, student: updated, riskAnalysis });
  } catch (error: any) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: error.message || 'Failed to update student' });
  }
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT id, name FROM Students WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    db.prepare('DELETE FROM Students WHERE id = ?').run(id);
    res.json({ success: true, message: `Student ${(existing as any).name} deleted successfully.` });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student record' });
  }
});

// Student risk endpoint
app.get('/api/students/:id/risk', (req, res) => {
  try {
    const id = Number(req.params.id);
    const student = db.prepare('SELECT * FROM Students WHERE id = ?').get(id) as any;
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const thresholds = getActiveThresholds();
    const riskAnalysis = calculateRisk({
      attendance: student.attendance,
      avgMarks: student.avg_marks,
      cgpa: student.cgpa,
      assignmentCompletion: student.assignment_completion,
      previousGpa: student.previous_gpa
    }, thresholds);

    res.json(riskAnalysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate risk analysis' });
  }
});

// Student recommendations endpoint
app.get('/api/students/:id/recommendations', (req, res) => {
  try {
    const id = Number(req.params.id);
    const recs = db.prepare('SELECT * FROM Recommendations WHERE student_id = ? ORDER BY id DESC').all(id);
    res.json(recs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
});

// ==========================================
// 3. FACULTY INTERVENTIONS API
// ==========================================
app.get('/api/interventions', (req, res) => {
  try {
    const { status, priority, faculty_id } = req.query;
    let query = `
      SELECT 
        i.*,
        s.student_id as student_code,
        s.name as student_name,
        s.department as student_department,
        s.attendance as student_attendance,
        s.cgpa as student_cgpa,
        f.name as faculty_name,
        f.role as faculty_role,
        f.avatar_color
      FROM Interventions i
      JOIN Students s ON i.student_id = s.id
      LEFT JOIN Faculty f ON i.faculty_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'All') {
      query += ' AND i.priority = ?';
      params.push(priority);
    }

    if (faculty_id && faculty_id !== 'All') {
      query += ' AND i.faculty_id = ?';
      params.push(Number(faculty_id));
    }

    query += ' ORDER BY CASE i.status WHEN "Pending" THEN 1 WHEN "In Progress" THEN 2 ELSE 3 END, i.due_date ASC';

    const interventions = db.prepare(query).all(...params);

    // Fetch notes for each
    for (const intv of interventions as any[]) {
      intv.notes = db.prepare('SELECT * FROM FollowUpNotes WHERE intervention_id = ? ORDER BY created_at ASC').all(intv.id);
    }

    res.json(interventions);
  } catch (error) {
    console.error('Error fetching interventions:', error);
    res.status(500).json({ error: 'Failed to retrieve interventions' });
  }
});

app.post('/api/interventions', (req, res) => {
  try {
    const { student_id, faculty_id, issue, action_plan, priority, due_date } = req.body;

    if (!student_id || !issue || !action_plan || !due_date) {
      return res.status(400).json({ error: 'Student, Issue, Planned Action, and Due Date are required.' });
    }

    const student = db.prepare('SELECT cgpa FROM Students WHERE id = ?').get(Number(student_id)) as any;
    if (!student) {
      return res.status(404).json({ error: 'Selected student does not exist.' });
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO Interventions (
        student_id, faculty_id, issue, action_plan, priority, status, due_date, pre_gpa, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?)
    `).run(
      Number(student_id),
      faculty_id ? Number(faculty_id) : null,
      issue.trim(),
      action_plan.trim(),
      priority || 'Medium',
      due_date,
      student.cgpa,
      now,
      now
    );

    const created = db.prepare(`
      SELECT 
        i.*,
        s.student_id as student_code,
        s.name as student_name,
        f.name as faculty_name
      FROM Interventions i
      JOIN Students s ON i.student_id = s.id
      LEFT JOIN Faculty f ON i.faculty_id = f.id
      WHERE i.id = ?
    `).get(Number(result.lastInsertRowid));

    res.status(201).json({ success: true, intervention: created });
  } catch (error: any) {
    console.error('Error creating intervention:', error);
    res.status(500).json({ error: error.message || 'Failed to create intervention' });
  }
});

app.put('/api/interventions/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM Interventions WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Intervention not found.' });
    }

    const { status, outcome, post_gpa, priority, action_plan, due_date } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE Interventions SET
        status = COALESCE(?, status),
        outcome = COALESCE(?, outcome),
        post_gpa = COALESCE(?, post_gpa),
        priority = COALESCE(?, priority),
        action_plan = COALESCE(?, action_plan),
        due_date = COALESCE(?, due_date),
        updated_at = ?
      WHERE id = ?
    `).run(
      status || null,
      outcome !== undefined ? outcome : null,
      post_gpa !== undefined ? (post_gpa === null || post_gpa === '' ? null : Number(post_gpa)) : null,
      priority || null,
      action_plan || null,
      due_date || null,
      now,
      id
    );

    const updated = db.prepare(`
      SELECT 
        i.*,
        s.student_id as student_code,
        s.name as student_name,
        f.name as faculty_name
      FROM Interventions i
      JOIN Students s ON i.student_id = s.id
      LEFT JOIN Faculty f ON i.faculty_id = f.id
      WHERE i.id = ?
    `).get(id);

    res.json({ success: true, intervention: updated });
  } catch (error: any) {
    console.error('Error updating intervention:', error);
    res.status(500).json({ error: error.message || 'Failed to update intervention' });
  }
});

app.post('/api/interventions/:id/notes', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { author_name, note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note text cannot be empty.' });
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO FollowUpNotes (intervention_id, author_name, note, created_at)
      VALUES (?, ?, ?, ?)
    `).run(
      id,
      author_name && author_name.trim() ? author_name.trim() : 'Faculty Member',
      note.trim(),
      now
    );

    const createdNote = db.prepare('SELECT * FROM FollowUpNotes WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({ success: true, note: createdNote });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add follow-up note' });
  }
});

// ==========================================
// 4. WHAT-IF ACADEMIC SIMULATOR API
// ==========================================
app.post('/api/simulate', (req, res) => {
  try {
    const { studentId, attendance, avgMarks, cgpa, assignmentCompletion } = req.body;

    const thresholds = getActiveThresholds();

    // If studentId provided, compare with current student record
    let baselineData = null;
    let baselineRisk = null;

    if (studentId) {
      const student = db.prepare('SELECT * FROM Students WHERE id = ?').get(Number(studentId)) as any;
      if (student) {
        baselineData = {
          attendance: student.attendance,
          avgMarks: student.avg_marks,
          cgpa: student.cgpa,
          assignmentCompletion: student.assignment_completion,
          previousGpa: student.previous_gpa
        };
        baselineRisk = calculateRisk(baselineData, thresholds);
      }
    }

    const simulatedData = {
      attendance: Number(attendance),
      avgMarks: Number(avgMarks),
      cgpa: Number(cgpa),
      assignmentCompletion: Number(assignmentCompletion),
      previousGpa: baselineData?.previousGpa || null
    };

    const simulatedRisk = calculateRisk(simulatedData, thresholds);

    // Delta calculation
    let delta = 0;
    if (baselineRisk) {
      delta = Number((simulatedRisk.riskScore - baselineRisk.riskScore).toFixed(1));
    }

    // Suggested actions based on simulated trajectory
    const simulatedRecs = generateRecommendations(
      {
        id: studentId || 0,
        name: 'Simulated Student',
        attendance: Number(attendance),
        avgMarks: Number(avgMarks),
        cgpa: Number(cgpa),
        assignmentCompletion: Number(assignmentCompletion),
        previousGpa: baselineData?.previousGpa || null
      },
      simulatedRisk
    );

    res.json({
      baseline: baselineRisk,
      simulated: simulatedRisk,
      delta, // Negative delta means risk decreased (improvement)
      factorsChanged: baselineData ? {
        attendanceDelta: Number((Number(attendance) - baselineData.attendance).toFixed(1)),
        avgMarksDelta: Number((Number(avgMarks) - baselineData.avgMarks).toFixed(1)),
        cgpaDelta: Number((Number(cgpa) - baselineData.cgpa).toFixed(2)),
        assignmentsDelta: Number((Number(assignmentCompletion) - baselineData.assignmentCompletion).toFixed(1)),
      } : null,
      suggestedActions: simulatedRecs
    });
  } catch (error) {
    console.error('Error in /api/simulate:', error);
    res.status(500).json({ error: 'Failed to compute academic simulation' });
  }
});

// ==========================================
// 5. FACULTY & SETTINGS API
// ==========================================
app.get('/api/faculty', (req, res) => {
  try {
    const faculty = db.prepare('SELECT * FROM Faculty ORDER BY name ASC').all();
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve faculty directory' });
  }
});

app.get('/api/settings/thresholds', (req, res) => {
  try {
    res.json({
      thresholds: getActiveThresholds(),
      weights: DEFAULT_WEIGHTS
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

app.put('/api/settings/thresholds', (req, res) => {
  try {
    const newThresholds = req.body;
    db.prepare('INSERT OR REPLACE INTO Settings (key, value) VALUES (?, ?)').run('thresholds', JSON.stringify(newThresholds));

    // Recalculate risk for all students in database
    const students = db.prepare('SELECT id, attendance, avg_marks, cgpa, assignment_completion, previous_gpa FROM Students').all() as any[];
    const updateStmt = db.prepare('UPDATE Students SET risk_score = ?, risk_category = ? WHERE id = ?');

    for (const s of students) {
      const risk = calculateRisk({
        attendance: s.attendance,
        avgMarks: s.avg_marks,
        cgpa: s.cgpa,
        assignmentCompletion: s.assignment_completion,
        previousGpa: s.previous_gpa
      }, newThresholds);

      updateStmt.run(risk.riskScore, risk.riskCategory, s.id);
    }

    res.json({ success: true, message: 'Thresholds updated and all student risk scores recalculated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update thresholds' });
  }
});

// ==========================================
// 6. SERVE FRONTEND (Vite Middleware in Dev)
// ==========================================
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NOVA Platform] Backend and frontend server live on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[NOVA Platform] Server failed to start:', err);
  process.exit(1);
});
