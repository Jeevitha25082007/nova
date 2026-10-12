"""
NOVA Student Success Platform - Personalized Recommendations Engine
Generates action-oriented faculty and student recommendations based on actual
academic data, individual subject performance, and risk metrics.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta


def generate_recommendations(
    student_data: Dict[str, Any],
    risk_analysis: Dict[str, Any],
    subjects: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Generates actionable, personalized academic recommendations.
    """
    recs: List[Dict[str, Any]] = []
    now = datetime.utcnow()

    student_id = student_data.get('id', 0)
    attendance = float(student_data.get('attendance', 100))
    avg_marks = float(student_data.get('avg_marks', 100))
    cgpa = float(student_data.get('cgpa', 10.0))
    assignments = float(student_data.get('assignment_completion', 100))
    prev_gpa = student_data.get('previous_gpa')

    # 1. Attendance Recommendation
    if attendance < 75.0:
        urgency = 'Critical' if attendance < 60.0 else 'High'
        days = 5 if attendance < 60.0 else 7
        review_date = (now + timedelta(days=days)).strftime('%Y-%m-%d')
        recs.append({
            'student_id': student_id,
            'identified_issue': f"Attendance deficit ({attendance:.1f}%)",
            'explanation': f"Student is below the mandatory 75% threshold. Debarment risk if pattern continues.",
            'recommended_action': "Implement weekly biometric attendance reconciliation and mandate student check-in with faculty mentor.",
            'priority': urgency,
            'suggested_review_date': review_date,
            'status': 'Pending',
            'category': 'Attendance'
        })

    # 2. Marks & Subject Deficits
    if avg_marks < 60.0:
        failing_subs = [s for s in (subjects or []) if float(s.get('total_marks', 100)) < 50.0]
        urgency = 'Critical' if avg_marks < 45.0 else 'High'
        review_date = (now + timedelta(days=14)).strftime('%Y-%m-%d')
        
        if failing_subs:
            sub_names = ", ".join([s.get('subject_name', s.get('subject_code', 'Subject')) for s in failing_subs])
            explanation = f"Critical marks deficit in prerequisite modules: {sub_names}."
        else:
            explanation = f"Average continuous evaluation marks ({avg_marks:.1f}%) fall below standard cohort averages."

        recs.append({
            'student_id': student_id,
            'identified_issue': f"Continuous assessment gap ({avg_marks:.1f}%)",
            'explanation': explanation,
            'recommended_action': "Enroll in department tutorial clinics and provide structured question banks for targeted review.",
            'priority': urgency,
            'suggested_review_date': review_date,
            'status': 'Pending',
            'category': 'Coursework'
        })

    # 3. Coursework & Assignment Submission
    if assignments < 75.0:
        review_date = (now + timedelta(days=10)).strftime('%Y-%m-%d')
        recs.append({
            'student_id': student_id,
            'identified_issue': f"Incomplete assignments ({assignments:.1f}%)",
            'explanation': "Unsubmitted coursework is jeopardizing internal assessment marks.",
            'recommended_action': "Set phased submission deadlines with teaching assistants and offer a one-week remedial grace period.",
            'priority': 'Medium',
            'suggested_review_date': review_date,
            'status': 'Pending',
            'category': 'Coursework'
        })

    # 4. GPA Drop
    if prev_gpa is not None:
        try:
            drop = float(prev_gpa) - cgpa
            if drop >= 0.5:
                review_date = (now + timedelta(days=5)).strftime('%Y-%m-%d')
                recs.append({
                    'student_id': student_id,
                    'identified_issue': f"Steep GPA drop (-{drop:.2f} points)",
                    'explanation': f"Sudden drop from {float(prev_gpa):.2f} to {cgpa:.2f} suggests unexpected external difficulties or course overload.",
                    'recommended_action': "Convene urgent 1-on-1 advisor interview to identify study impediments and balance academic commitments.",
                    'priority': 'High',
                    'suggested_review_date': review_date,
                    'status': 'Pending',
                    'category': 'Mentorship'
                })
        except (ValueError, TypeError):
            pass

    # 5. Enrichment for High Performers
    if cgpa >= 8.5 and attendance >= 85.0:
        review_date = (now + timedelta(days=30)).strftime('%Y-%m-%d')
        recs.append({
            'student_id': student_id,
            'identified_issue': "Honors distinction and leadership aptitude",
            'explanation': f"Exemplary consistency with {cgpa:.2f} CGPA and {attendance:.1f}% attendance.",
            'recommended_action': "Recommend for faculty research lab fellowship and appoint as student peer tutor.",
            'priority': 'Low',
            'suggested_review_date': review_date,
            'status': 'Pending',
            'category': 'Enrichment'
        })
    elif not recs:
        review_date = (now + timedelta(days=21)).strftime('%Y-%m-%d')
        recs.append({
            'student_id': student_id,
            'identified_issue': "Solid academic trajectory",
            'explanation': "Performance is stable and on track with all institutional standards.",
            'recommended_action': "Encourage participation in technical co-curricular activities and project competitions.",
            'priority': 'Low',
            'suggested_review_date': review_date,
            'status': 'Pending',
            'category': 'Enrichment'
        })

    return recs
