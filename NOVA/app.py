"""
NOVA – AI-Powered Student Analytics and Success Platform
Flask Application Backend & REST API Endpoints
"""

import os
import json
from datetime import datetime
from flask import Flask, jsonify, request, render_template, abort
from database import init_db, get_db_connection
from analytics import calculate_risk, DEFAULT_THRESHOLDS
from recommendations import generate_recommendations

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Ensure database is initialized on startup
init_db()


def get_active_thresholds():
    conn = get_db_connection()
    row = conn.execute("SELECT value FROM Settings WHERE key = 'thresholds'").fetchone()
    conn.close()
    if row and row['value']:
        try:
            return json.loads(row['value'])
        except Exception:
            pass
    return DEFAULT_THRESHOLDS


# -------------------------------------------------------------
# Web Page Route Handlers (HTML Templates)
# -------------------------------------------------------------
@app.route('/')
def index_view():
    return render_template('index.html')


@app.route('/students')
def students_view():
    return render_template('students.html')


@app.route('/students/<int:student_id>')
def student_profile_view(student_id):
    return render_template('student_profile.html', student_id=student_id)


@app.route('/analytics')
def analytics_view():
    return render_template('analytics.html')


@app.route('/interventions')
def interventions_view():
    return render_template('interventions.html')


@app.route('/simulator')
def simulator_view():
    return render_template('simulator.html')


# -------------------------------------------------------------
# REST API Endpoints
# -------------------------------------------------------------
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_metrics():
    conn = get_db_connection()
    try:
        total = conn.execute("SELECT COUNT(*) FROM Students").fetchone()[0]
        avg_row = conn.execute("""
            SELECT 
                AVG(cgpa) as avg_cgpa,
                AVG(attendance) as avg_attendance,
                AVG(avg_marks) as avg_marks,
                AVG(assignment_completion) as avg_assign
            FROM Students
        """).fetchone()

        high_risk = conn.execute("SELECT COUNT(*) FROM Students WHERE risk_category = 'High'").fetchone()[0]
        mod_risk = conn.execute("SELECT COUNT(*) FROM Students WHERE risk_category = 'Moderate'").fetchone()[0]
        low_risk = conn.execute("SELECT COUNT(*) FROM Students WHERE risk_category = 'Low'").fetchone()[0]

        pending_intv = conn.execute("SELECT COUNT(*) FROM Interventions WHERE status IN ('Pending', 'In Progress')").fetchone()[0]
        completed_intv = conn.execute("SELECT COUNT(*) FROM Interventions WHERE status = 'Completed'").fetchone()[0]

        dept_rows = [dict(r) for r in conn.execute("""
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
        """).fetchall()]

        trend_rows = [dict(r) for r in conn.execute("""
            SELECT 
                semester,
                ROUND(AVG(gpa), 2) as avgGpa,
                ROUND(AVG(attendance_pct), 1) as avgAttendance
            FROM AcademicRecords
            GROUP BY semester
            ORDER BY semester ASC
        """).fetchall()]

        recent_act = [dict(r) for r in conn.execute("""
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
        """).fetchall()]

        critical_alerts = [dict(r) for r in conn.execute("""
            SELECT id, student_id, name, department, attendance, cgpa, avg_marks, risk_score
            FROM Students
            WHERE risk_category = 'High'
            ORDER BY risk_score DESC
            LIMIT 4
        """).fetchall()]

        scatter_data = [dict(r) for r in conn.execute("""
            SELECT id, student_id, name, department, attendance, avg_marks, cgpa, risk_category 
            FROM Students
        """).fetchall()]

        return jsonify({
            'summary': {
                'totalStudents': total,
                'avgCgpa': round(avg_row['avg_cgpa'] or 0, 2),
                'avgAttendance': round(avg_row['avg_attendance'] or 0, 1),
                'avgMarks': round(avg_row['avg_marks'] or 0, 1),
                'avgAssignments': round(avg_row['avg_assign'] or 0, 1),
                'needingSupport': high_risk + mod_risk,
                'highRiskCount': high_risk,
                'moderateRiskCount': mod_risk,
                'performingWell': low_risk,
                'pendingInterventions': pending_intv,
                'completedInterventions': completed_intv,
            },
            'charts': {
                'departmentPerformance': dept_rows,
                'semesterTrends': trend_rows,
                'attendanceVsMarks': scatter_data,
                'riskDistribution': [
                    {'name': 'Low Risk', 'value': low_risk, 'color': '#20BF6B'},
                    {'name': 'Moderate Risk', 'value': mod_risk, 'color': '#FA8231'},
                    {'name': 'High Risk', 'value': high_risk, 'color': '#EB3B5A'},
                ]
            },
            'recentActivities': recent_act,
            'criticalAlerts': critical_alerts
        })
    finally:
        conn.close()


@app.route('/api/students', methods=['GET'])
def list_students():
    conn = get_db_connection()
    try:
        search = request.args.get('search', '').strip()
        dept = request.args.get('department')
        year = request.args.get('year')
        risk = request.args.get('risk')
        page = max(1, int(request.args.get('page', 1)))
        limit = max(1, min(100, int(request.args.get('limit', 10))))
        offset = (page - 1) * limit

        query = "SELECT * FROM Students WHERE 1=1"
        params = []

        if search:
            query += " AND (name LIKE ? OR student_id LIKE ? OR email LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])

        if dept and dept != 'All':
            query += " AND department = ?"
            params.append(dept)

        if year and year != 'All':
            query += " AND year = ?"
            params.append(int(year))

        if risk and risk != 'All':
            query += " AND risk_category = ?"
            params.append(risk)

        # Count
        count_q = query.replace("SELECT *", "SELECT COUNT(*)")
        total = conn.execute(count_q, params).fetchone()[0]

        query += " ORDER BY id ASC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = [dict(r) for r in conn.execute(query, params).fetchall()]

        return jsonify({
            'students': rows,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        })
    finally:
        conn.close()


@app.route('/api/students', methods=['POST'])
def create_student():
    data = request.get_json() or {}
    s_id = data.get('student_id', '').strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    dept = data.get('department', '').strip()

    if not s_id or not name or not email or not dept:
        return jsonify({'error': 'Student ID, Name, Email, and Department are required'}), 400

    conn = get_db_connection()
    try:
        exists = conn.execute("SELECT id FROM Students WHERE student_id = ?", (s_id,)).fetchone()
        if exists:
            return jsonify({'error': f'Student ID {s_id} is already in use.'}), 409

        cgpa = min(10.0, max(0.0, float(data.get('cgpa', 0))))
        att = min(100.0, max(0.0, float(data.get('attendance', 0))))
        marks = min(100.0, max(0.0, float(data.get('avg_marks', 0))))
        assign = min(100.0, max(0.0, float(data.get('assignment_completion', 0))))
        prev_gpa = float(data['previous_gpa']) if data.get('previous_gpa') not in (None, '') else None
        year = int(data.get('year', 1))
        sem = int(data.get('semester', 1))

        risk = calculate_risk({
            'attendance': att,
            'avg_marks': marks,
            'cgpa': cgpa,
            'assignment_completion': assign,
            'previous_gpa': prev_gpa
        })

        now = datetime.utcnow().isoformat()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO Students (
                student_id, name, email, department, year, semester,
                cgpa, attendance, avg_marks, assignment_completion, previous_gpa,
                risk_score, risk_category, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s_id, name, email, dept, year, sem, cgpa, att, marks, assign, prev_gpa,
            risk['risk_score'], risk['risk_category'], now, now
        ))
        new_id = cur.lastrowid

        # Academic records & subjects
        cur.execute("""
            INSERT INTO AcademicRecords (student_id, semester, gpa, attendance_pct, credits_enrolled, credits_earned, recorded_at)
            VALUES (?, ?, ?, ?, 20, ?, ?)
        """, (new_id, sem, cgpa, att, 20 if cgpa >= 5.0 else 16, now[:10]))

        cur.execute("""
            INSERT INTO SubjectPerformance (student_id, subject_code, subject_name, internal_marks, midterm_marks, total_marks, grade, attendance_pct, status)
            VALUES (?, 'SUB101', 'Core Foundation', ?, ?, ?, 'B', ?, 'Passing')
        """, (new_id, round(marks * 0.4, 1), round(marks * 0.6, 1), marks, att))

        # Recommendations
        recs = generate_recommendations({'id': new_id, 'attendance': att, 'avg_marks': marks, 'cgpa': cgpa, 'assignment_completion': assign, 'previous_gpa': prev_gpa}, risk)
        for r in recs:
            cur.execute("""
                INSERT INTO Recommendations (student_id, identified_issue, explanation, recommended_action, priority, suggested_review_date, status, category, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_id, r['identified_issue'], r['explanation'], r['recommended_action'], r['priority'], r['suggested_review_date'], r['status'], r['category'], now))

        conn.commit()
        created = dict(conn.execute("SELECT * FROM Students WHERE id = ?", (new_id,)).fetchone())
        return jsonify({'success': True, 'student': created}), 201
    finally:
        conn.close()


@app.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    conn = get_db_connection()
    try:
        s_row = conn.execute("SELECT * FROM Students WHERE id = ?", (student_id,)).fetchone()
        if not s_row:
            return jsonify({'error': 'Student not found'}), 404

        student = dict(s_row)
        academics = [dict(r) for r in conn.execute("SELECT * FROM AcademicRecords WHERE student_id = ? ORDER BY semester ASC", (student_id,)).fetchall()]
        subjects = [dict(r) for r in conn.execute("SELECT * FROM SubjectPerformance WHERE student_id = ? ORDER BY id ASC", (student_id,)).fetchall()]
        recs = [dict(r) for r in conn.execute("SELECT * FROM Recommendations WHERE student_id = ? ORDER BY id DESC", (student_id,)).fetchall()]
        intvs = [dict(r) for r in conn.execute("""
            SELECT i.*, f.name as faculty_name, f.email as faculty_email, f.role as faculty_role
            FROM Interventions i
            LEFT JOIN Faculty f ON i.faculty_id = f.id
            WHERE i.student_id = ?
            ORDER BY i.created_at DESC
        """, (student_id,)).fetchall()]

        for i in intvs:
            i['notes'] = [dict(n) for n in conn.execute("SELECT * FROM FollowUpNotes WHERE intervention_id = ? ORDER BY created_at ASC", (i['id'],)).fetchall()]

        risk = calculate_risk({
            'attendance': student['attendance'],
            'avg_marks': student['avg_marks'],
            'cgpa': student['cgpa'],
            'assignment_completion': student['assignment_completion'],
            'previous_gpa': student['previous_gpa']
        })

        return jsonify({
            'student': student,
            'academicRecords': academics,
            'subjects': subjects,
            'recommendations': recs,
            'interventions': intvs,
            'riskAnalysis': risk
        })
    finally:
        conn.close()


@app.route('/api/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    conn = get_db_connection()
    try:
        curr = conn.execute("SELECT * FROM Students WHERE id = ?", (student_id,)).fetchone()
        if not curr:
            return jsonify({'error': 'Student not found'}), 404

        data = request.get_json() or {}
        name = data.get('name', curr['name'])
        email = data.get('email', curr['email'])
        dept = data.get('department', curr['department'])
        year = int(data.get('year', curr['year']))
        sem = int(data.get('semester', curr['semester']))
        cgpa = min(10.0, max(0.0, float(data.get('cgpa', curr['cgpa']))))
        att = min(100.0, max(0.0, float(data.get('attendance', curr['attendance']))))
        marks = min(100.0, max(0.0, float(data.get('avg_marks', curr['avg_marks']))))
        assign = min(100.0, max(0.0, float(data.get('assignment_completion', curr['assignment_completion']))))
        prev_gpa = float(data['previous_gpa']) if data.get('previous_gpa') not in (None, '') else curr['previous_gpa']

        risk = calculate_risk({
            'attendance': att,
            'avg_marks': marks,
            'cgpa': cgpa,
            'assignment_completion': assign,
            'previous_gpa': prev_gpa
        })

        now = datetime.utcnow().isoformat()
        conn.execute("""
            UPDATE Students SET
                name = ?, email = ?, department = ?, year = ?, semester = ?,
                cgpa = ?, attendance = ?, avg_marks = ?, assignment_completion = ?, previous_gpa = ?,
                risk_score = ?, risk_category = ?, updated_at = ?
            WHERE id = ?
        """, (name, email, dept, year, sem, cgpa, att, marks, assign, prev_gpa, risk['risk_score'], risk['risk_category'], now, student_id))

        conn.commit()
        updated = dict(conn.execute("SELECT * FROM Students WHERE id = ?", (student_id,)).fetchone())
        return jsonify({'success': True, 'student': updated, 'riskAnalysis': risk})
    finally:
        conn.close()


@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM Students WHERE id = ?", (student_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'Student deleted successfully'})
    finally:
        conn.close()


@app.route('/api/students/<int:student_id>/risk', methods=['GET'])
def get_student_risk(student_id):
    conn = get_db_connection()
    try:
        s = conn.execute("SELECT * FROM Students WHERE id = ?", (student_id,)).fetchone()
        if not s:
            return jsonify({'error': 'Student not found'}), 404
        risk = calculate_risk({
            'attendance': s['attendance'],
            'avg_marks': s['avg_marks'],
            'cgpa': s['cgpa'],
            'assignment_completion': s['assignment_completion'],
            'previous_gpa': s['previous_gpa']
        })
        return jsonify(risk)
    finally:
        conn.close()


@app.route('/api/students/<int:student_id>/recommendations', methods=['GET'])
def get_student_recommendations(student_id):
    conn = get_db_connection()
    try:
        recs = [dict(r) for r in conn.execute("SELECT * FROM Recommendations WHERE student_id = ? ORDER BY id DESC", (student_id,)).fetchall()]
        return jsonify(recs)
    finally:
        conn.close()


@app.route('/api/interventions', methods=['GET'])
def list_interventions():
    conn = get_db_connection()
    try:
        status = request.args.get('status')
        priority = request.args.get('priority')
        faculty_id = request.args.get('faculty_id')

        query = """
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
        """
        params = []
        if status and status != 'All':
            query += " AND i.status = ?"
            params.append(status)
        if priority and priority != 'All':
            query += " AND i.priority = ?"
            params.append(priority)
        if faculty_id and faculty_id != 'All':
            query += " AND i.faculty_id = ?"
            params.append(int(faculty_id))

        query += " ORDER BY CASE i.status WHEN 'Pending' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END, i.due_date ASC"

        intvs = [dict(r) for r in conn.execute(query, params).fetchall()]
        for i in intvs:
            i['notes'] = [dict(n) for n in conn.execute("SELECT * FROM FollowUpNotes WHERE intervention_id = ? ORDER BY created_at ASC", (i['id'],)).fetchall()]

        return jsonify(intvs)
    finally:
        conn.close()


@app.route('/api/interventions', methods=['POST'])
def create_intervention():
    data = request.get_json() or {}
    s_id = data.get('student_id')
    issue = data.get('issue', '').strip()
    action = data.get('action_plan', '').strip()
    due = data.get('due_date', '').strip()

    if not s_id or not issue or not action or not due:
        return jsonify({'error': 'Student, Issue, Planned Action, and Due Date are required.'}), 400

    conn = get_db_connection()
    try:
        student = conn.execute("SELECT cgpa FROM Students WHERE id = ?", (s_id,)).fetchone()
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        now = datetime.utcnow().isoformat()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO Interventions (
                student_id, faculty_id, issue, action_plan, priority, status, due_date, pre_gpa, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?)
        """, (
            s_id,
            int(data['faculty_id']) if data.get('faculty_id') else None,
            issue,
            action,
            data.get('priority', 'Medium'),
            due,
            student['cgpa'],
            now,
            now
        ))
        conn.commit()
        new_intv = dict(conn.execute("SELECT * FROM Interventions WHERE id = ?", (cur.lastrowid,)).fetchone())
        return jsonify({'success': True, 'intervention': new_intv}), 201
    finally:
        conn.close()


@app.route('/api/interventions/<int:intv_id>', methods=['PUT'])
def update_intervention(intv_id):
    conn = get_db_connection()
    try:
        data = request.get_json() or {}
        now = datetime.utcnow().isoformat()
        conn.execute("""
            UPDATE Interventions SET
                status = COALESCE(?, status),
                outcome = COALESCE(?, outcome),
                post_gpa = COALESCE(?, post_gpa),
                priority = COALESCE(?, priority),
                action_plan = COALESCE(?, action_plan),
                due_date = COALESCE(?, due_date),
                updated_at = ?
            WHERE id = ?
        """, (
            data.get('status'),
            data.get('outcome'),
            float(data['post_gpa']) if data.get('post_gpa') not in (None, '') else None,
            data.get('priority'),
            data.get('action_plan'),
            data.get('due_date'),
            now,
            intv_id
        ))
        conn.commit()
        updated = dict(conn.execute("SELECT * FROM Interventions WHERE id = ?", (intv_id,)).fetchone())
        return jsonify({'success': True, 'intervention': updated})
    finally:
        conn.close()


@app.route('/api/interventions/<int:intv_id>/notes', methods=['POST'])
def add_intervention_note(intv_id):
    data = request.get_json() or {}
    note = data.get('note', '').strip()
    author = data.get('author_name', 'Faculty Mentor').strip()

    if not note:
        return jsonify({'error': 'Note text cannot be empty'}), 400

    conn = get_db_connection()
    try:
        now = datetime.utcnow().isoformat()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO FollowUpNotes (intervention_id, author_name, note, created_at)
            VALUES (?, ?, ?, ?)
        """, (intv_id, author, note, now))
        conn.commit()
        created = dict(conn.execute("SELECT * FROM FollowUpNotes WHERE id = ?", (cur.lastrowid,)).fetchone())
        return jsonify({'success': True, 'note': created}), 201
    finally:
        conn.close()


@app.route('/api/simulate', methods=['POST'])
def simulate_academic_trajectory():
    data = request.get_json() or {}
    att = float(data.get('attendance', 75))
    marks = float(data.get('avgMarks', 60))
    cgpa = float(data.get('cgpa', 6.5))
    assign = float(data.get('assignmentCompletion', 75))
    student_id = data.get('studentId')

    conn = get_db_connection()
    baseline_risk = None
    baseline_data = None
    if student_id:
        s = conn.execute("SELECT * FROM Students WHERE id = ?", (student_id,)).fetchone()
        if s:
            baseline_data = dict(s)
            baseline_risk = calculate_risk({
                'attendance': s['attendance'],
                'avg_marks': s['avg_marks'],
                'cgpa': s['cgpa'],
                'assignment_completion': s['assignment_completion'],
                'previous_gpa': s['previous_gpa']
            })
    conn.close()

    simulated_risk = calculate_risk({
        'attendance': att,
        'avg_marks': marks,
        'cgpa': cgpa,
        'assignment_completion': assign,
        'previous_gpa': baseline_data.get('previous_gpa') if baseline_data else None
    })

    delta = 0.0
    if baseline_risk:
        delta = round(simulated_risk['risk_score'] - baseline_risk['risk_score'], 1)

    suggested_actions = generate_recommendations({
        'id': student_id or 0,
        'attendance': att,
        'avg_marks': marks,
        'cgpa': cgpa,
        'assignment_completion': assign
    }, simulated_risk)

    return jsonify({
        'baseline': baseline_risk,
        'simulated': simulated_risk,
        'delta': delta,
        'suggestedActions': suggested_actions
    })


@app.route('/api/faculty', methods=['GET'])
def list_faculty():
    conn = get_db_connection()
    try:
        faculty = [dict(r) for r in conn.execute("SELECT * FROM Faculty ORDER BY name ASC").fetchall()]
        return jsonify(faculty)
    finally:
        conn.close()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
