"""
NOVA Student Success Platform - Explainable AI Risk Analytics Engine
This module contains the transparent rule-based screening engine that evaluates
student academic risk factors and provides fully explainable risk attributions.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

DEFAULT_THRESHOLDS = {
    'low_risk_max': 35,
    'moderate_risk_max': 65,
    'attendance_warning': 75.0,
    'attendance_critical': 60.0,
    'cgpa_warning': 6.5,
    'cgpa_critical': 5.0,
    'marks_warning': 60.0,
    'marks_critical': 45.0,
    'assignments_warning': 75.0,
    'assignments_critical': 50.0
}

DEFAULT_WEIGHTS = {
    'attendance': 0.30,
    'marks': 0.30,
    'cgpa': 0.25,
    'assignments': 0.15
}


def calculate_risk(
    student_data: Dict[str, Any],
    thresholds: Optional[Dict[str, Any]] = None,
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculates an academic support risk score between 0 and 100 with explainable factor breakdown.
    Handles missing values dynamically without treating omitted fields as automatic failure.
    
    Label: Academic Support Screening Estimate (Screening tool, not a verdict).
    """
    if thresholds is None:
        thresholds = DEFAULT_THRESHOLDS
    if weights is None:
        weights = DEFAULT_WEIGHTS

    factors: List[Dict[str, Any]] = []
    positive_indicators: List[str] = []
    available_weight_total = 0.0
    raw_weighted_sum = 0.0

    # 1. Attendance Factor
    att_val = student_data.get('attendance')
    if att_val is not None:
        try:
            att = min(100.0, max(0.0, float(att_val)))
            status = 'safe'
            if att < thresholds['attendance_critical']:
                att_risk = 80.0 + ((thresholds['attendance_critical'] - att) / thresholds['attendance_critical']) * 20.0
                status = 'critical'
                details = f"Attendance of {att:.1f}% is critically below institutional minimum ({thresholds['attendance_warning']}%)."
            elif att < thresholds['attendance_warning']:
                att_risk = 40.0 + ((thresholds['attendance_warning'] - att) / (thresholds['attendance_warning'] - thresholds['attendance_critical'])) * 40.0
                status = 'warning'
                details = f"Attendance of {att:.1f}% is in warning zone (<{thresholds['attendance_warning']}%)."
            else:
                att_risk = max(0.0, 40.0 - ((att - thresholds['attendance_warning']) / (100.0 - thresholds['attendance_warning'])) * 40.0)
                details = f"Class attendance ({att:.1f}%) meets institutional benchmarks."
                positive_indicators.append(f"Regular classroom presence ({att:.1f}%)")

            att_risk = min(100.0, max(0.0, att_risk))
            w = weights['attendance']
            available_weight_total += w
            raw_weighted_sum += att_risk * w
            factors.append({
                'name': 'Classroom Attendance',
                'category': 'Attendance',
                'current_value': f"{att:.1f}%",
                'benchmark': f">= {thresholds['attendance_warning']}%",
                'score_contribution': round(att_risk),
                'weight': w,
                'weighted_points': round(att_risk * w, 1),
                'status': status,
                'details': details
            })
        except (ValueError, TypeError):
            pass

    # 2. Academic Marks Factor
    marks_val = student_data.get('avg_marks')
    if marks_val is not None:
        try:
            marks = min(100.0, max(0.0, float(marks_val)))
            status = 'safe'
            if marks < thresholds['marks_critical']:
                marks_risk = 75.0 + ((thresholds['marks_critical'] - marks) / thresholds['marks_critical']) * 25.0
                status = 'critical'
                details = f"Assessment average ({marks:.1f}%) is below course passing baseline."
            elif marks < thresholds['marks_warning']:
                marks_risk = 35.0 + ((thresholds['marks_warning'] - marks) / (thresholds['marks_warning'] - thresholds['marks_critical'])) * 40.0
                status = 'warning'
                details = f"Internal assessment marks ({marks:.1f}%) reflect comprehension difficulties."
            else:
                marks_risk = max(0.0, 35.0 - ((marks - thresholds['marks_warning']) / (100.0 - thresholds['marks_warning'])) * 35.0)
                details = f"Solid marks performance ({marks:.1f}%)."
                positive_indicators.append(f"Strong continuous marks ({marks:.1f}%)")

            marks_risk = min(100.0, max(0.0, marks_risk))
            w = weights['marks']
            available_weight_total += w
            raw_weighted_sum += marks_risk * w
            factors.append({
                'name': 'Assessment Performance',
                'category': 'Academic Marks',
                'current_value': f"{marks:.1f}%",
                'benchmark': f">= {thresholds['marks_warning']}%",
                'score_contribution': round(marks_risk),
                'weight': w,
                'weighted_points': round(marks_risk * w, 1),
                'status': status,
                'details': details
            })
        except (ValueError, TypeError):
            pass

    # 3. CGPA Factor
    cgpa_val = student_data.get('cgpa')
    if cgpa_val is not None:
        try:
            cgpa = min(10.0, max(0.0, float(cgpa_val)))
            status = 'safe'
            if cgpa < thresholds['cgpa_critical']:
                cgpa_risk = 80.0 + ((thresholds['cgpa_critical'] - cgpa) / thresholds['cgpa_critical']) * 20.0
                status = 'critical'
                details = f"Cumulative CGPA of {cgpa:.2f} is under probation limit (<{thresholds['cgpa_critical']})."
            elif cgpa < thresholds['cgpa_warning']:
                cgpa_risk = 35.0 + ((thresholds['cgpa_warning'] - cgpa) / (thresholds['cgpa_warning'] - thresholds['cgpa_critical'])) * 45.0
                status = 'warning'
                details = f"CGPA ({cgpa:.2f}) indicates need for study review (target: {thresholds['cgpa_warning']}+)."
            else:
                cgpa_risk = max(0.0, 35.0 - ((cgpa - thresholds['cgpa_warning']) / (10.0 - thresholds['cgpa_warning'])) * 35.0)
                details = f"Good academic standing ({cgpa:.2f} / 10.0)."
                positive_indicators.append(f"Cumulative GPA in good standing ({cgpa:.2f})")

            cgpa_risk = min(100.0, max(0.0, cgpa_risk))
            w = weights['cgpa']
            available_weight_total += w
            raw_weighted_sum += cgpa_risk * w
            factors.append({
                'name': 'Cumulative GPA (CGPA)',
                'category': 'CGPA',
                'current_value': f"{cgpa:.2f} / 10.0",
                'benchmark': f">= {thresholds['cgpa_warning']}",
                'score_contribution': round(cgpa_risk),
                'weight': w,
                'weighted_points': round(cgpa_risk * w, 1),
                'status': status,
                'details': details
            })
        except (ValueError, TypeError):
            pass

    # 4. Assignment Completion Factor
    assign_val = student_data.get('assignment_completion')
    if assign_val is not None:
        try:
            ac = min(100.0, max(0.0, float(assign_val)))
            status = 'safe'
            if ac < thresholds['assignments_critical']:
                ac_risk = 75.0 + ((thresholds['assignments_critical'] - ac) / thresholds['assignments_critical']) * 25.0
                status = 'critical'
                details = f"Assignment completion ({ac:.1f}%) is dangerously low. Risk of losing internal credits."
            elif ac < thresholds['assignments_warning']:
                ac_risk = 35.0 + ((thresholds['assignments_warning'] - ac) / (thresholds['assignments_warning'] - thresholds['assignments_critical'])) * 40.0
                status = 'warning'
                details = f"Assignments submitted ({ac:.1f}%) shows periodic backlogs."
            else:
                ac_risk = max(0.0, 35.0 - ((ac - thresholds['assignments_warning']) / (100.0 - thresholds['assignments_warning'])) * 35.0)
                details = f"Prompt assignment submission ({ac:.1f}%)."
                positive_indicators.append(f"Punctual coursework submissions ({ac:.1f}%)")

            ac_risk = min(100.0, max(0.0, ac_risk))
            w = weights['assignments']
            available_weight_total += w
            raw_weighted_sum += ac_risk * w
            factors.append({
                'name': 'Coursework & Assignments',
                'category': 'Assignments',
                'current_value': f"{ac:.1f}%",
                'benchmark': f">= {thresholds['assignments_warning']}%",
                'score_contribution': round(ac_risk),
                'weight': w,
                'weighted_points': round(ac_risk * w, 1),
                'status': status,
                'details': details
            })
        except (ValueError, TypeError):
            pass

    # 5. Trend Modifier (Previous GPA comparison)
    prev_gpa = student_data.get('previous_gpa')
    curr_gpa = student_data.get('cgpa')
    trend_adj = 0.0
    if prev_gpa is not None and curr_gpa is not None:
        try:
            delta = float(curr_gpa) - float(prev_gpa)
            if delta < -0.6:
                trend_adj = 8.0
                factors.append({
                    'name': 'Semester-over-Semester Momentum',
                    'category': 'Performance Trend',
                    'current_value': f"{delta:+.2f} GPA",
                    'benchmark': 'Steady or Positive (>= 0.0)',
                    'score_contribution': 80,
                    'weight': 0.05,
                    'weighted_points': 8.0,
                    'status': 'critical',
                    'details': f"Sharp decline of {abs(delta):.2f} GPA points compared to prior term."
                })
            elif delta > 0.5:
                trend_adj = -6.0
                factors.append({
                    'name': 'Semester-over-Semester Momentum',
                    'category': 'Performance Trend',
                    'current_value': f"{delta:+.2f} GPA",
                    'benchmark': 'Positive Growth',
                    'score_contribution': 10,
                    'weight': 0.05,
                    'weighted_points': -6.0,
                    'status': 'safe',
                    'details': f"Remarkable upward momentum of +{delta:.2f} GPA points."
                })
                positive_indicators.append(f"Positive GPA trajectory (+{delta:.2f})")
        except (ValueError, TypeError):
            pass

    # Compute Normalized Risk
    final_risk = 50.0
    if available_weight_total > 0:
        normalized_raw = raw_weighted_sum / available_weight_total
        final_risk = min(100.0, max(0.0, normalized_raw + trend_adj))

    final_risk = round(final_risk, 1)

    if final_risk > thresholds['moderate_risk_max']:
        category = 'High'
    elif final_risk > thresholds['low_risk_max']:
        category = 'Moderate'
    else:
        category = 'Low'

    # Primary Concern
    crit_or_warn = [f for f in factors if f['status'] in ('critical', 'warning')]
    crit_or_warn.sort(key=lambda x: x['score_contribution'], reverse=True)

    if crit_or_warn:
        primary_concern = f"{crit_or_warn[0]['name']}: currently at {crit_or_warn[0]['current_value']} (target: {crit_or_warn[0]['benchmark']})."
    else:
        primary_concern = "All monitored academic indicators satisfy or surpass requirements."

    return {
        'risk_score': final_risk,
        'risk_category': category,
        'screening_notice': 'Academic Support Screening Estimate — Calculated for early faculty support prioritization; not an evaluation of ultimate student potential.',
        'factors': factors,
        'primary_concern': primary_concern,
        'positive_indicators': positive_indicators or ['Actively participating in enrolled semester credits.'],
        'calculated_at': datetime.utcnow().isoformat(),
        'thresholds_used': thresholds
    }
