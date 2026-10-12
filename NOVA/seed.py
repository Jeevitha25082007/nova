"""
NOVA Student Success Platform - Database Seed Script
Populates SQLite with realistic demo students across engineering departments,
subject scores, attendance histories, faculty mentors, and interventions.
"""

from database import init_db, get_db_connection
from analytics import calculate_risk
from recommendations import generate_recommendations
from datetime import datetime


def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM Students")
    if cursor.fetchone()[0] > 0:
        print("[NOVA Seed] Database already contains records. Skipping seed.")
        conn.close()
        return

    print("[NOVA Seed] Seeding demo faculty and student cohorts...")

    # 1. Faculty
    faculty_data = [
        ('Dr. Sarah Mitchell', 's.mitchell@nova.edu', 'Computer Science', 'Department Head & Senior Advisor', '#7965E8'),
        ('Prof. Marcus Vance', 'm.vance@nova.edu', 'Electrical Engineering', 'Academic Success Mentor', '#4B7BEC'),
        ('Dr. Anita Desai', 'a.desai@nova.edu', 'Information Technology', 'Student Wellness Lead', '#20BF6B'),
        ('Prof. David Chen', 'd.chen@nova.edu', 'Mechanical Engineering', 'Faculty Mentor', '#FA8231'),
        ('Dr. Elena Rostova', 'e.rostova@nova.edu', 'Civil Engineering', 'First-Year Coordinator', '#8854D0')
    ]

    cursor.executemany(
        "INSERT INTO Faculty (name, email, department, role, avatar_color) VALUES (?, ?, ?, ?, ?)",
        faculty_data
    )

    # 2. Students
    students_data = [
        ('STU-2024-001', 'Aiden Brooks', 'aiden.b@nova.edu', 'Computer Science', 2, 4, 4.82, 54.2, 48.0, 42.0, 5.70),
        ('STU-2024-002', 'Maya Patel', 'maya.p@nova.edu', 'Electrical Engineering', 3, 6, 5.15, 58.0, 52.4, 55.0, 5.95),
        ('STU-2024-003', 'Carlos Mendez', 'carlos.m@nova.edu', 'Mechanical Engineering', 1, 2, 4.90, 49.5, 43.5, 38.0, None),
        ('STU-2024-004', 'Zoe Washington', 'zoe.w@nova.edu', 'Information Technology', 2, 3, 5.40, 61.0, 49.8, 60.0, 6.20),
        ('STU-2024-005', 'Devon Kim', 'devon.k@nova.edu', 'Civil Engineering', 4, 7, 5.25, 55.8, 54.0, 50.0, 6.10),
        ('STU-2024-006', 'Liam O\'Connor', 'liam.oc@nova.edu', 'Computer Science', 3, 5, 6.45, 71.0, 64.2, 72.0, 6.80),
        ('STU-2024-007', 'Sofia Rodriguez', 'sofia.r@nova.edu', 'Information Technology', 2, 4, 6.70, 68.5, 61.5, 78.0, 6.90),
        ('STU-2024-008', 'Tariq Al-Mansoor', 'tariq.am@nova.edu', 'Electrical Engineering', 1, 2, 6.30, 74.0, 58.0, 65.0, None),
        ('STU-2024-009', 'Emma Watson-Lee', 'emma.wl@nova.edu', 'Mechanical Engineering', 2, 3, 6.85, 73.2, 67.0, 70.0, 7.20),
        ('STU-2024-010', 'Kavita Sundaram', 'kavita.s@nova.edu', 'Civil Engineering', 3, 6, 6.55, 69.8, 63.0, 68.0, 6.60),
        ('STU-2024-011', 'Lucas Dubois', 'lucas.d@nova.edu', 'Computer Science', 4, 8, 6.90, 74.5, 66.8, 74.0, 7.00),
        ('STU-2024-012', 'Ananya Sharma', 'ananya.s@nova.edu', 'Computer Science', 3, 6, 9.42, 96.5, 92.8, 98.0, 9.30),
        ('STU-2024-013', 'Ethan Huntley', 'ethan.h@nova.edu', 'Electrical Engineering', 4, 8, 8.95, 92.0, 88.5, 95.0, 8.80),
        ('STU-2024-014', 'Chloe Becker', 'chloe.b@nova.edu', 'Information Technology', 2, 4, 8.75, 91.5, 86.0, 94.0, 8.50),
        ('STU-2024-015', 'Noah Takahashi', 'noah.t@nova.edu', 'Mechanical Engineering', 3, 5, 9.10, 94.0, 89.2, 96.0, 9.00),
        ('STU-2024-016', 'Grace Hopper-Smith', 'grace.hs@nova.edu', 'Computer Science', 1, 2, 8.80, 95.0, 87.0, 92.0, None),
        ('STU-2024-017', 'Rohan Gupta', 'rohan.g@nova.edu', 'Civil Engineering', 2, 3, 8.60, 89.5, 84.5, 90.0, 8.40),
        ('STU-2024-018', 'Olivia Martin', 'olivia.m@nova.edu', 'Computer Science', 2, 3, 7.65, 84.0, 75.0, 82.0, 7.50),
        ('STU-2024-019', 'Benjamin Scott', 'ben.s@nova.edu', 'Electrical Engineering', 3, 5, 7.80, 86.5, 78.2, 85.0, 7.70),
        ('STU-2024-020', 'Mia Kowalski', 'mia.k@nova.edu', 'Information Technology', 1, 1, 7.40, 82.0, 72.5, 80.0, None),
        ('STU-2024-021', 'Alexander Wright', 'alex.w@nova.edu', 'Mechanical Engineering', 4, 7, 7.90, 88.0, 79.0, 88.0, 7.85),
        ('STU-2024-022', 'Priya Nambiar', 'priya.n@nova.edu', 'Civil Engineering', 2, 4, 7.50, 85.2, 76.0, 83.0, 7.30)
    ]

    now_str = datetime.utcnow().isoformat()

    for row in students_data:
        s_id, name, email, dept, year, sem, cgpa, att, avg_m, assign, prev_gpa = row
        s_dict = {
            'attendance': att,
            'avg_marks': avg_m,
            'cgpa': cgpa,
            'assignment_completion': assign,
            'previous_gpa': prev_gpa
        }
        risk = calculate_risk(s_dict)

        cursor.execute("""
            INSERT INTO Students (
                student_id, name, email, department, year, semester,
                cgpa, attendance, avg_marks, assignment_completion, previous_gpa,
                risk_score, risk_category, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s_id, name, email, dept, year, sem, cgpa, att, avg_m, assign, prev_gpa,
            risk['risk_score'], risk['risk_category'], now_str, now_str
        ))
        student_db_id = cursor.lastrowid

        # Semesters
        for s in range(1, sem + 1):
            cursor.execute("""
                INSERT INTO AcademicRecords (student_id, semester, gpa, attendance_pct, credits_enrolled, credits_earned, recorded_at)
                VALUES (?, ?, ?, ?, 20, ?, ?)
            """, (student_db_id, s, cgpa if s == sem else max(4.0, cgpa - 0.2), att, 20 if cgpa >= 5.0 else 16, f"2024-0{s}-10"))

        # Subjects
        sample_subs = [
            ('SUB101', f'{dept} Foundations', round(avg_m * 0.4, 1), round(avg_m * 0.6, 1), avg_m, 'B', att, 'Passing' if avg_m >= 50 else 'At Risk'),
            ('SUB102', f'Applied {dept} Lab', round(avg_m * 0.4, 1), round(avg_m * 0.6, 1), avg_m, 'B', att, 'Passing' if avg_m >= 50 else 'At Risk')
        ]
        for sub in sample_subs:
            cursor.execute("""
                INSERT INTO SubjectPerformance (student_id, subject_code, subject_name, internal_marks, midterm_marks, total_marks, grade, attendance_pct, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (student_db_id, sub[0], sub[1], sub[2], sub[3], sub[4], sub[5], sub[6], sub[7]))

        # Recommendations
        recs = generate_recommendations({'id': student_db_id, **s_dict}, risk)
        for r in recs:
            cursor.execute("""
                INSERT INTO Recommendations (student_id, identified_issue, explanation, recommended_action, priority, suggested_review_date, status, category, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (student_db_id, r['identified_issue'], r['explanation'], r['recommended_action'], r['priority'], r['suggested_review_date'], r['status'], r['category'], now_str))

        # Interventions for high risk
        if risk['risk_category'] == 'High':
            cursor.execute("""
                INSERT INTO Interventions (student_id, faculty_id, issue, action_plan, priority, status, due_date, pre_gpa, outcome, created_at, updated_at)
                VALUES (?, 1, 'Critical Academic Risk Intervention', 'Scheduled bi-weekly review with Dr. Sarah Mitchell', 'Critical', 'In Progress', '2026-10-25', ?, 'Ongoing attendance check', ?, ?)
            """, (student_db_id, cgpa, now_str, now_str))
            int_id = cursor.lastrowid
            cursor.execute("""
                INSERT INTO FollowUpNotes (intervention_id, author_name, note, created_at)
                VALUES (?, 'Dr. Sarah Mitchell', 'Initial diagnostic conference completed. Study plan instituted.', ?)
            """, (int_id, now_str))

    conn.commit()
    conn.close()
    print("[NOVA Seed] Database seeded successfully.")


if __name__ == '__main__':
    seed_database()
