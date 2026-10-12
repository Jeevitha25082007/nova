export interface RiskFactor {
  name: string;
  category: 'Attendance' | 'Academic Marks' | 'CGPA' | 'Assignments' | 'Performance Trend';
  currentValue: number | string;
  benchmark: string;
  scoreContribution: number; // 0 to 100 normalized factor risk
  weight: number; // e.g. 0.30
  weightedPoints: number; // contribution to total risk score
  status: 'safe' | 'warning' | 'critical';
  details: string;
}

export interface RiskAnalysis {
  riskScore: number; // 0 - 100
  riskCategory: 'Low' | 'Moderate' | 'High';
  screeningNotice: string;
  factors: RiskFactor[];
  primaryConcern: string;
  positiveIndicators: string[];
  calculatedAt: string;
  thresholdsUsed: {
    lowRiskMax: number;
    moderateRiskMax: number;
    highRiskMin: number;
  };
}

export interface RecommendationItem {
  id?: number;
  studentId: number;
  identifiedIssue: string;
  explanation: string;
  recommendedAction: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  suggestedReviewDate: string;
  status: 'Pending' | 'In Review' | 'Applied' | 'Dismissed';
  category: 'Attendance' | 'Coursework' | 'Mentorship' | 'Enrichment';
}

export interface RiskWeights {
  attendance: number; // default 0.30
  marks: number;      // default 0.30
  cgpa: number;       // default 0.25
  assignments: number;// default 0.15
}

export interface ThresholdConfig {
  lowRiskMax: number;       // e.g. 35
  moderateRiskMax: number;  // e.g. 65
  attendanceWarning: number;// 75%
  attendanceCritical: number;// 60%
  cgpaWarning: number;      // 6.5
  cgpaCritical: number;     // 5.0
  marksWarning: number;     // 60%
  marksCritical: number;    // 45%
  assignmentsWarning: number;// 75%
  assignmentsCritical: number;// 50%
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  lowRiskMax: 35,
  moderateRiskMax: 65,
  attendanceWarning: 75,
  attendanceCritical: 60,
  cgpaWarning: 6.5,
  cgpaCritical: 5.0,
  marksWarning: 60,
  marksCritical: 45,
  assignmentsWarning: 75,
  assignmentsCritical: 50,
};

export const DEFAULT_WEIGHTS: RiskWeights = {
  attendance: 0.30,
  marks: 0.30,
  cgpa: 0.25,
  assignments: 0.15,
};

/**
 * Calculates academic support risk score with full explainability.
 * Handles missing data gracefully without falsely penalizing students.
 * Clearly labeled as an academic screening estimate, not a guaranteed prediction.
 */
export function calculateRisk(
  data: {
    attendance?: number | null;
    avgMarks?: number | null;
    cgpa?: number | null;
    assignmentCompletion?: number | null;
    previousGpa?: number | null;
  },
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS,
  weights: RiskWeights = DEFAULT_WEIGHTS
): RiskAnalysis {
  const factors: RiskFactor[] = [];
  const positiveIndicators: string[] = [];
  let availableWeightTotal = 0;
  let rawWeightedSum = 0;

  // 1. Attendance Factor (Weight: 30%)
  if (data.attendance !== undefined && data.attendance !== null && !isNaN(Number(data.attendance))) {
    const att = Math.min(100, Math.max(0, Number(data.attendance)));
    // Below 60% = high risk (100-80), 60-75% = moderate risk (80-40), 75-100% = low risk (40-0)
    let attRisk = 0;
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let details = '';

    if (att < thresholds.attendanceCritical) {
      attRisk = 80 + ((thresholds.attendanceCritical - att) / thresholds.attendanceCritical) * 20;
      status = 'critical';
      details = `Attendance of ${att.toFixed(1)}% is critically below the institutional minimum (${thresholds.attendanceWarning}%). Risk of debarment.`;
    } else if (att < thresholds.attendanceWarning) {
      attRisk = 40 + ((thresholds.attendanceWarning - att) / (thresholds.attendanceWarning - thresholds.attendanceCritical)) * 40;
      status = 'warning';
      details = `Attendance of ${att.toFixed(1)}% is in the warning bracket (<${thresholds.attendanceWarning}%). Missing key lecture hours.`;
    } else {
      attRisk = Math.max(0, 40 - ((att - thresholds.attendanceWarning) / (100 - thresholds.attendanceWarning)) * 40);
      status = 'safe';
      details = `Consistent classroom attendance at ${att.toFixed(1)}% exceeds requirements.`;
      positiveIndicators.push(`Regular attendance (${att.toFixed(1)}%)`);
    }

    attRisk = Math.min(100, Math.max(0, attRisk));
    const factorWeight = weights.attendance;
    availableWeightTotal += factorWeight;
    rawWeightedSum += attRisk * factorWeight;

    factors.push({
      name: 'Classroom Attendance',
      category: 'Attendance',
      currentValue: `${att.toFixed(1)}%`,
      benchmark: `>= ${thresholds.attendanceWarning}%`,
      scoreContribution: Math.round(attRisk),
      weight: factorWeight,
      weightedPoints: Number((attRisk * factorWeight).toFixed(1)),
      status,
      details,
    });
  }

  // 2. Academic Marks Factor (Weight: 30%)
  if (data.avgMarks !== undefined && data.avgMarks !== null && !isNaN(Number(data.avgMarks))) {
    const marks = Math.min(100, Math.max(0, Number(data.avgMarks)));
    let marksRisk = 0;
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let details = '';

    if (marks < thresholds.marksCritical) {
      marksRisk = 75 + ((thresholds.marksCritical - marks) / thresholds.marksCritical) * 25;
      status = 'critical';
      details = `Assessment average of ${marks.toFixed(1)}% is below course passing thresholds (${thresholds.marksWarning}%). High failure hazard.`;
    } else if (marks < thresholds.marksWarning) {
      marksRisk = 35 + ((thresholds.marksWarning - marks) / (thresholds.marksWarning - thresholds.marksCritical)) * 40;
      status = 'warning';
      details = `Average internal marks (${marks.toFixed(1)}%) indicate moderate comprehension gaps.`;
    } else {
      marksRisk = Math.max(0, 35 - ((marks - thresholds.marksWarning) / (100 - thresholds.marksWarning)) * 35);
      status = 'safe';
      details = `Strong academic marks average (${marks.toFixed(1)}%), demonstrating firm concept mastery.`;
      positiveIndicators.push(`Solid assessment performance (${marks.toFixed(1)}%)`);
    }

    marksRisk = Math.min(100, Math.max(0, marksRisk));
    const factorWeight = weights.marks;
    availableWeightTotal += factorWeight;
    rawWeightedSum += marksRisk * factorWeight;

    factors.push({
      name: 'Assessment Performance',
      category: 'Academic Marks',
      currentValue: `${marks.toFixed(1)}%`,
      benchmark: `>= ${thresholds.marksWarning}%`,
      scoreContribution: Math.round(marksRisk),
      weight: factorWeight,
      weightedPoints: Number((marksRisk * factorWeight).toFixed(1)),
      status,
      details,
    });
  }

  // 3. CGPA Factor (Weight: 25%)
  if (data.cgpa !== undefined && data.cgpa !== null && !isNaN(Number(data.cgpa))) {
    const cgpa = Math.min(10, Math.max(0, Number(data.cgpa)));
    let cgpaRisk = 0;
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let details = '';

    if (cgpa < thresholds.cgpaCritical) {
      cgpaRisk = 80 + ((thresholds.cgpaCritical - cgpa) / thresholds.cgpaCritical) * 20;
      status = 'critical';
      details = `Cumulative CGPA of ${cgpa.toFixed(2)} is under academic probation threshold (<${thresholds.cgpaCritical}).`;
    } else if (cgpa < thresholds.cgpaWarning) {
      cgpaRisk = 35 + ((thresholds.cgpaWarning - cgpa) / (thresholds.cgpaWarning - thresholds.cgpaCritical)) * 45;
      status = 'warning';
      details = `CGPA of ${cgpa.toFixed(2)} is in the monitoring band (target: ${thresholds.cgpaWarning}+).`;
    } else {
      cgpaRisk = Math.max(0, 35 - ((cgpa - thresholds.cgpaWarning) / (10 - thresholds.cgpaWarning)) * 35);
      status = 'safe';
      details = `Cumulative GPA (${cgpa.toFixed(2)}/10.0) indicates high academic standing.`;
      positiveIndicators.push(`Cumulative GPA in good standing (${cgpa.toFixed(2)})`);
    }

    cgpaRisk = Math.min(100, Math.max(0, cgpaRisk));
    const factorWeight = weights.cgpa;
    availableWeightTotal += factorWeight;
    rawWeightedSum += cgpaRisk * factorWeight;

    factors.push({
      name: 'Cumulative Grade Point Average (CGPA)',
      category: 'CGPA',
      currentValue: `${cgpa.toFixed(2)} / 10.0`,
      benchmark: `>= ${thresholds.cgpaWarning}`,
      scoreContribution: Math.round(cgpaRisk),
      weight: factorWeight,
      weightedPoints: Number((cgpaRisk * factorWeight).toFixed(1)),
      status,
      details,
    });
  }

  // 4. Assignment Completion Factor (Weight: 15%)
  if (data.assignmentCompletion !== undefined && data.assignmentCompletion !== null && !isNaN(Number(data.assignmentCompletion))) {
    const ac = Math.min(100, Math.max(0, Number(data.assignmentCompletion)));
    let acRisk = 0;
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let details = '';

    if (ac < thresholds.assignmentsCritical) {
      acRisk = 75 + ((thresholds.assignmentsCritical - ac) / thresholds.assignmentsCritical) * 25;
      status = 'critical';
      details = `Only ${ac.toFixed(1)}% assignments turned in. Severe risk of lost internal credits.`;
    } else if (ac < thresholds.assignmentsWarning) {
      acRisk = 35 + ((thresholds.assignmentsWarning - ac) / (thresholds.assignmentsWarning - thresholds.assignmentsCritical)) * 40;
      status = 'warning';
      details = `Assignment completion at ${ac.toFixed(1)}% indicates missing submissions or delayed deliverables.`;
    } else {
      acRisk = Math.max(0, 35 - ((ac - thresholds.assignmentsWarning) / (100 - thresholds.assignmentsWarning)) * 35);
      status = 'safe';
      details = `High assignment completion rate (${ac.toFixed(1)}%). Excellent discipline.`;
      positiveIndicators.push(`Punctual coursework submissions (${ac.toFixed(1)}%)`);
    }

    acRisk = Math.min(100, Math.max(0, acRisk));
    const factorWeight = weights.assignments;
    availableWeightTotal += factorWeight;
    rawWeightedSum += acRisk * factorWeight;

    factors.push({
      name: 'Coursework & Assignments',
      category: 'Assignments',
      currentValue: `${ac.toFixed(1)}%`,
      benchmark: `>= ${thresholds.assignmentsWarning}%`,
      scoreContribution: Math.round(acRisk),
      weight: factorWeight,
      weightedPoints: Number((acRisk * factorWeight).toFixed(1)),
      status,
      details,
    });
  }

  // 5. Performance Trend Modifier (if previous GPA is known)
  let trendAdjustment = 0;
  if (data.previousGpa && data.cgpa) {
    const delta = Number(data.cgpa) - Number(data.previousGpa);
    if (delta < -0.6) {
      trendAdjustment = 8; // penalty for sharp academic decline
      factors.push({
        name: 'Semester-over-Semester Momentum',
        category: 'Performance Trend',
        currentValue: `${delta > 0 ? '+' : ''}${delta.toFixed(2)} GPA`,
        benchmark: 'Steady or Positive (>= 0.0)',
        scoreContribution: 80,
        weight: 0.05,
        weightedPoints: 8,
        status: 'critical',
        details: `Sharp decline of ${Math.abs(delta).toFixed(2)} GPA points compared to previous semester. Immediate mentoring recommended.`,
      });
    } else if (delta > 0.5) {
      trendAdjustment = -6; // credit for notable upward rebound
      factors.push({
        name: 'Semester-over-Semester Momentum',
        category: 'Performance Trend',
        currentValue: `+${delta.toFixed(2)} GPA`,
        benchmark: 'Positive Growth',
        scoreContribution: 10,
        weight: 0.05,
        weightedPoints: -6,
        status: 'safe',
        details: `Strong upward momentum: improved by +${delta.toFixed(2)} GPA over prior term.`,
      });
      positiveIndicators.push(`Upward academic trajectory (+${delta.toFixed(2)} GPA)`);
    }
  }

  // Handle missing data normalization:
  // If some indicators are absent, normalize across available weights so students aren't falsely scored 0 or 100
  let finalRisk = 50; // default if zero data
  if (availableWeightTotal > 0) {
    const normalizedRaw = rawWeightedSum / availableWeightTotal;
    finalRisk = Math.min(100, Math.max(0, normalizedRaw + trendAdjustment));
  }

  finalRisk = Number(finalRisk.toFixed(1));

  let riskCategory: 'Low' | 'Moderate' | 'High' = 'Low';
  if (finalRisk > thresholds.moderateRiskMax) {
    riskCategory = 'High';
  } else if (finalRisk > thresholds.lowRiskMax) {
    riskCategory = 'Moderate';
  }

  // Find primary concern
  const criticalOrWarningFactors = factors
    .filter(f => f.status === 'critical' || f.status === 'warning')
    .sort((a, b) => b.scoreContribution - a.scoreContribution);

  let primaryConcern = 'All assessed academic metrics meet or exceed institutional standards.';
  if (criticalOrWarningFactors.length > 0) {
    const top = criticalOrWarningFactors[0];
    primaryConcern = `${top.name}: currently at ${top.currentValue} (target: ${top.benchmark}).`;
  }

  return {
    riskScore: finalRisk,
    riskCategory,
    screeningNotice: 'Academic Support Screening Estimate — Calculated for early faculty support prioritization; not an evaluation of ultimate student potential.',
    factors,
    primaryConcern,
    positiveIndicators: positiveIndicators.length > 0 ? positiveIndicators : ['Baseline coursework actively enrolled.'],
    calculatedAt: new Date().toISOString(),
    thresholdsUsed: {
      lowRiskMax: thresholds.lowRiskMax,
      moderateRiskMax: thresholds.moderateRiskMax,
      highRiskMin: thresholds.moderateRiskMax + 0.1,
    },
  };
}

/**
 * Generates personalized, action-oriented academic recommendations based on actual student data.
 */
export function generateRecommendations(
  student: {
    id: number;
    name: string;
    attendance: number;
    avgMarks: number;
    cgpa: number;
    assignmentCompletion: number;
    previousGpa?: number | null;
  },
  riskAnalysis: RiskAnalysis,
  subjects?: Array<{ subjectName: string; totalMarks: number; attendancePct: number }>
): RecommendationItem[] {
  const recs: RecommendationItem[] = [];
  const today = new Date();
  const formatFutureDate = (daysAhead: number) => {
    const d = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  // 1. Attendance Recommendation
  if (student.attendance < 75) {
    const urgency = student.attendance < 60 ? 'Critical' : 'High';
    recs.push({
      studentId: student.id,
      identifiedIssue: `Attendance deficit (${student.attendance.toFixed(1)}%)`,
      explanation: `Student has missed ${Math.round((75 - student.attendance) * 0.4)} classes below the required 75% baseline. Risk of semester debarment.`,
      recommendedAction: 'Institute mandatory biometric check-in log and assign weekly advisor attendance verification meeting.',
      priority: urgency,
      suggestedReviewDate: formatFutureDate(7),
      status: 'Pending',
      category: 'Attendance',
    });
  }

  // 2. Marks / Subject Recommendation
  if (student.avgMarks < 60) {
    const failingSubjects = subjects?.filter(s => s.totalMarks < 50) || [];
    const subjectListStr = failingSubjects.map(s => s.subjectName).join(', ');

    recs.push({
      studentId: student.id,
      identifiedIssue: `Assessment deficiency (${student.avgMarks.toFixed(1)}% average)`,
      explanation: failingSubjects.length > 0
        ? `Subject-level struggle identified in: ${subjectListStr}. Concepts require reinforcement prior to finals.`
        : `Assessment scores indicate difficulty keeping pace with core syllabus materials.`,
      recommendedAction: 'Enroll student in departmental peer tutoring circles and schedule two 45-minute revision tutorial clinics weekly.',
      priority: student.avgMarks < 45 ? 'Critical' : 'High',
      suggestedReviewDate: formatFutureDate(14),
      status: 'Pending',
      category: 'Coursework',
    });
  }

  // 3. Assignment Completion Recommendation
  if (student.assignmentCompletion < 75) {
    recs.push({
      studentId: student.id,
      identifiedIssue: `Incomplete coursework submissions (${student.assignmentCompletion.toFixed(1)}%)`,
      explanation: 'Unsubmitted laboratory reports and weekly problem sets are dragging down cumulative internal continuous assessment score.',
      recommendedAction: 'Provide structured modular assignment milestone deadlines and 1-week catch-up grace window with TA guidance.',
      priority: 'Medium',
      suggestedReviewDate: formatFutureDate(10),
      status: 'Pending',
      category: 'Coursework',
    });
  }

  // 4. Performance Trend / Declining GPA
  if (student.previousGpa && student.cgpa < student.previousGpa - 0.5) {
    const drop = (student.previousGpa - student.cgpa).toFixed(2);
    recs.push({
      studentId: student.id,
      identifiedIssue: `Significant GPA decline (-${drop} points)`,
      explanation: `Student experienced an unexpected performance decline from ${student.previousGpa.toFixed(2)} to ${student.cgpa.toFixed(2)}. Suggests non-academic or pacing issues.`,
      recommendedAction: 'Convene a 1-on-1 holistic faculty advising session to explore external roadblocks, study habits, or health constraints.',
      priority: 'High',
      suggestedReviewDate: formatFutureDate(5),
      status: 'Pending',
      category: 'Mentorship',
    });
  }

  // 5. Positive / High Achiever Enrichment
  if (student.cgpa >= 8.5 && student.attendance >= 85) {
    recs.push({
      studentId: student.id,
      identifiedIssue: 'High academic aptitude & leadership potential',
      explanation: `Outstanding consistency across all metrics with ${student.cgpa.toFixed(2)} CGPA and ${student.attendance.toFixed(1)}% attendance.`,
      recommendedAction: 'Nominate for undergraduate research assistantship program and invite to serve as paid department peer tutor.',
      priority: 'Low',
      suggestedReviewDate: formatFutureDate(30),
      status: 'Pending',
      category: 'Enrichment',
    });
  } else if (recs.length === 0) {
    // Balanced performer
    recs.push({
      studentId: student.id,
      identifiedIssue: 'Steady progress maintained',
      explanation: 'Student meets all current academic benchmarks with consistent participation.',
      recommendedAction: 'Continue current study schedule; check in at mid-semester review to explore elective honors or internship readiness.',
      priority: 'Low',
      suggestedReviewDate: formatFutureDate(21),
      status: 'Pending',
      category: 'Enrichment',
    });
  }

  return recs;
}
