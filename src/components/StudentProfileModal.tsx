import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Calendar,
  BookOpen,
  BrainCircuit,
  SlidersHorizontal,
  HandHeart,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  TrendingUp,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { fetchStudentProfile, updateStudent, addInterventionNote } from '../api';
import { Student, AcademicRecord, SubjectPerformance, Recommendation, Intervention, RiskAnalysis } from '../types';

interface StudentProfileModalProps {
  studentId: number | null;
  onClose: () => void;
  onOpenSimulatorForStudent?: (student: Student) => void;
  onOpenInterventionModal?: (student: Student) => void;
  onStudentUpdated?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  onClose,
  onOpenSimulatorForStudent,
  onOpenInterventionModal,
  onStudentUpdated,
}) => {
  const [profile, setProfile] = useState<{
    student: Student;
    academicRecords: AcademicRecord[];
    subjects: SubjectPerformance[];
    recommendations: Recommendation[];
    interventions: Intervention[];
    riskAnalysis: RiskAnalysis;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    cgpa: 0,
    attendance: 0,
    avg_marks: 0,
    assignment_completion: 0,
  });
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'risk' | 'recommendations' | 'interventions'>('overview');

  const loadData = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await fetchStudentProfile(studentId);
      setProfile(data);
      setEditFormData({
        cgpa: data.student.cgpa,
        attendance: data.student.attendance,
        avg_marks: data.student.avg_marks,
        assignment_completion: data.student.assignment_completion,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (!studentId) return null;

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await updateStudent(profile.student.id, editFormData);
      setIsEditing(false);
      await loadData();
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      alert('Failed to update student academic metrics');
    }
  };

  const handleAddNote = async (intvId: number) => {
    const text = noteInputs[intvId];
    if (!text || !text.trim()) return;

    try {
      await addInterventionNote(intvId, text.trim(), 'Dr. Sarah Mitchell');
      setNoteInputs({ ...noteInputs, [intvId]: '' });
      await loadData();
    } catch (err) {
      alert('Failed to save follow-up note');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#F8F9FE] via-white to-[#F8F9FE]">
          {profile ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7965E8] to-[#A594F9] text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-[#7965E8]/20">
                {profile.student.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-extrabold text-[#202747]">{profile.student.name}</h2>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      profile.student.risk_category === 'High'
                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : profile.student.risk_category === 'Moderate'
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : 'bg-[#D1FAE5] text-[#059669]'
                    }`}
                  >
                    {profile.student.risk_category} Risk ({Math.round(profile.student.risk_score)}/100)
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {profile.student.student_id} • {profile.student.department} • Year {profile.student.year} (Sem {profile.student.semester})
                </p>
              </div>
            </div>
          ) : (
            <div className="h-10 w-48 bg-slate-100 rounded-lg animate-pulse" />
          )}

          <div className="flex items-center gap-2">
            {profile && onOpenSimulatorForStudent && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSimulatorForStudent(profile.student);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E9E3FF] hover:bg-[#DDD5FF] text-[#7965E8] text-xs font-bold transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Simulate Trajectory</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 border-b border-slate-100 flex items-center gap-6 bg-white text-xs font-bold text-slate-500">
          {[
            { id: 'overview', label: 'Overview & History' },
            { id: 'subjects', label: `Subject Breakdown (${profile?.subjects.length || 0})` },
            { id: 'risk', label: 'Explainable AI Risk Engine' },
            { id: 'recommendations', label: `Action Plans (${profile?.recommendations.length || 0})` },
            { id: 'interventions', label: `Faculty Interventions (${profile?.interventions.length || 0})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3.5 border-b-2 transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'border-[#7965E8] text-[#7965E8]'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading || !profile ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-[#7965E8]/20 border-t-[#7965E8] rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-400">Loading comprehensive student portfolio...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Metric Ribbon */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#EAEFF5]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CGPA Status</span>
                      <div className="text-xl font-extrabold text-[#202747] mt-1">
                        {profile.student.cgpa.toFixed(2)}
                        <span className="text-xs text-slate-400 font-normal"> / 10.0</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {profile.student.previous_gpa
                          ? `Prior term: ${profile.student.previous_gpa.toFixed(2)}`
                          : 'First year baseline'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#DDF5E8]/40 border border-[#DDF5E8]">
                      <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider">Class Attendance</span>
                      <div className="text-xl font-extrabold text-[#202747] mt-1">
                        {profile.student.attendance.toFixed(1)}%
                      </div>
                      <div className="w-full bg-white h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, profile.student.attendance)}%` }}
                          className={`h-full ${profile.student.attendance < 75 ? 'bg-[#DC2626]' : 'bg-[#059669]'}`}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#DDEBFF]/40 border border-[#DDEBFF]">
                      <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">Assessment Avg</span>
                      <div className="text-xl font-extrabold text-[#202747] mt-1">
                        {profile.student.avg_marks.toFixed(1)}%
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Continuous evaluation score</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#E9E3FF]/40 border border-[#E9E3FF]">
                      <span className="text-[10px] font-bold text-[#7965E8] uppercase tracking-wider">Assignments Turn-In</span>
                      <div className="text-xl font-extrabold text-[#202747] mt-1">
                        {profile.student.assignment_completion.toFixed(1)}%
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Homework & lab deliverables</p>
                    </div>
                  </div>

                  {/* Inline Quick Update Form */}
                  <div className="bg-[#FAFBFD] p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#202747] flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-[#7965E8]" />
                          <span>Update Academic Parameters & Recalculate Risk</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Edit attendance or exam marks to simulate or record official faculty adjustments.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-xs font-bold text-[#7965E8] hover:underline cursor-pointer"
                      >
                        {isEditing ? 'Cancel Edit' : 'Edit Values'}
                      </button>
                    </div>

                    {isEditing && (
                      <form onSubmit={handleUpdateRecord} className="grid grid-cols-4 gap-3 pt-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">CGPA (0 - 10)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={editFormData.cgpa}
                            onChange={(e) => setEditFormData({ ...editFormData, cgpa: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Attendance %</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editFormData.attendance}
                            onChange={(e) => setEditFormData({ ...editFormData, attendance: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">Avg Marks %</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editFormData.avg_marks}
                            onChange={(e) => setEditFormData({ ...editFormData, avg_marks: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none font-bold"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="submit"
                            className="w-full py-2 bg-[#7965E8] hover:bg-[#6752D8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#7965E8]/25 cursor-pointer"
                          >
                            Save & Recalculate
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Historical Semester Record Table */}
                  <div>
                    <h4 className="text-xs font-bold text-[#202747] mb-2.5">
                      Semester-by-Semester Progression History
                    </h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8F9FE] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Semester</th>
                            <th className="py-2.5 px-3">Term GPA</th>
                            <th className="py-2.5 px-3">Attendance</th>
                            <th className="py-2.5 px-3">Credits Enrolled / Earned</th>
                            <th className="py-2.5 px-3">Recorded Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profile.academicRecords.map((ar) => (
                            <tr key={ar.id}>
                              <td className="py-2.5 px-3 font-bold text-[#202747]">Semester {ar.semester}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold">{ar.gpa.toFixed(2)}</td>
                              <td className="py-2.5 px-3 font-mono">{ar.attendance_pct.toFixed(1)}%</td>
                              <td className="py-2.5 px-3 font-mono">{ar.credits_enrolled} / {ar.credits_earned}</td>
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{ar.recorded_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SUBJECTS BREAKDOWN */}
              {activeTab === 'subjects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                      Current semester enrolled courses and continuous evaluation scores.
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">Passing Grade: &ge;50%</span>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F9FE] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <tr>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Code</th>
                          <th className="py-3 px-4">Internal (40)</th>
                          <th className="py-3 px-4">Midterm (60)</th>
                          <th className="py-3 px-4">Total Marks (100)</th>
                          <th className="py-3 px-4">Grade</th>
                          <th className="py-3 px-4">Attendance</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profile.subjects.map((sub) => (
                          <tr key={sub.id} className="hover:bg-[#FAF8FF]">
                            <td className="py-3 px-4 font-bold text-[#202747]">{sub.subject_name}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{sub.subject_code}</td>
                            <td className="py-3 px-4 font-mono">{sub.internal_marks}</td>
                            <td className="py-3 px-4 font-mono">{sub.midterm_marks}</td>
                            <td className="py-3 px-4 font-mono font-bold text-[#202747]">{sub.total_marks}%</td>
                            <td className="py-3 px-4 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${sub.grade === 'F' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DDEBFF] text-[#2563EB]'}`}>
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono">{sub.attendance_pct}%</td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.status === 'At Risk' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#D1FAE5] text-[#059669]'}`}>
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: EXPLAINABLE AI RISK ENGINE */}
              {activeTab === 'risk' && (
                <div className="space-y-6">
                  {/* Screening Estimate Header Notice */}
                  <div className="p-4 rounded-2xl bg-[#E9E3FF]/30 border border-[#E9E3FF] flex items-start gap-3">
                    <BrainCircuit className="w-5 h-5 text-[#7965E8] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#202747]">
                        Explainable Support Risk Score: {profile.riskAnalysis.riskScore} / 100 ({profile.riskAnalysis.riskCategory} Risk)
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {profile.riskAnalysis.screeningNotice}
                      </p>
                    </div>
                  </div>

                  {/* Factor Contribution Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-[#202747] mb-3">
                      Factor Contribution Breakdown & Benchmark Comparisons
                    </h4>

                    <div className="space-y-3">
                      {profile.riskAnalysis.factors.map((factor, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-100 bg-[#FDFEFE] shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#202747]">{factor.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                Weight: {Math.round(factor.weight * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-700">
                                Current: {factor.currentValue}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  factor.status === 'critical'
                                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                                    : factor.status === 'warning'
                                    ? 'bg-[#FEF3C7] text-[#D97706]'
                                    : 'bg-[#D1FAE5] text-[#059669]'
                                }`}
                              >
                                {factor.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${factor.scoreContribution}%` }}
                              className={`h-full ${
                                factor.status === 'critical'
                                  ? 'bg-[#EF4444]'
                                  : factor.status === 'warning'
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#10B981]'
                              }`}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{factor.details}</span>
                            <span className="font-mono text-slate-400">Target: {factor.benchmark}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary Concern & Strengths */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#FEE2E2]/30 border border-[#FECACA]">
                      <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wider">Primary Academic Concern</span>
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        {profile.riskAnalysis.primaryConcern}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#DDF5E8]/40 border border-[#DDF5E8]">
                      <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider">Observed Academic Strengths</span>
                      <ul className="text-xs text-slate-700 mt-1 space-y-1 list-disc list-inside">
                        {profile.riskAnalysis.positiveIndicators.map((pos, i) => (
                          <li key={i}>{pos}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PERSONALIZED RECOMMENDATIONS */}
              {activeTab === 'recommendations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                      Personalized action plans generated from this student's specific grades and attendance trends.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {profile.recommendations.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        No active recommendation items. Student is performing within normal bounds.
                      </p>
                    ) : (
                      profile.recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-4 rounded-2xl border border-slate-100 bg-[#FDFEFE] shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#202747]">{rec.identified_issue}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rec.priority === 'Critical'
                                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                                    : rec.priority === 'High'
                                    ? 'bg-[#FEF3C7] text-[#D97706]'
                                    : 'bg-[#D1FAE5] text-[#059669]'
                                }`}
                              >
                                {rec.priority} Priority
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                Review: {rec.suggested_review_date}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600">{rec.explanation}</p>

                          <div className="p-3 bg-[#F8F9FE] rounded-xl border border-slate-200/60 text-xs">
                            <strong className="text-[#7965E8]">Recommended Action:</strong>{' '}
                            <span className="text-slate-700">{rec.recommended_action}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: FACULTY INTERVENTIONS */}
              {activeTab === 'interventions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                      Recorded faculty support actions, follow-up logs, and progress tracking.
                    </p>
                    {onOpenInterventionModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenInterventionModal(profile.student);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#7965E8] text-white text-xs font-bold hover:bg-[#6752D8] cursor-pointer shadow-sm"
                      >
                        + Create Intervention
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {profile.interventions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        No previous faculty interventions logged for this student.
                      </p>
                    ) : (
                      profile.interventions.map((intv) => (
                        <div
                          key={intv.id}
                          className="p-4 rounded-2xl border border-slate-100 bg-[#FAFBFD] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#202747]">{intv.issue}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                intv.status === 'Completed'
                                  ? 'bg-[#D1FAE5] text-[#059669]'
                                  : 'bg-[#DDEBFF] text-[#2563EB]'
                              }`}
                            >
                              {intv.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600">
                            <strong>Action Plan:</strong> {intv.action_plan}
                          </p>

                          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                            <span>Assigned: {intv.faculty_name || 'Department Faculty'}</span>
                            <span>Due: {intv.due_date}</span>
                            {intv.pre_gpa !== null && (
                              <span>Pre-GPA: {intv.pre_gpa} &rarr; Post: {intv.post_gpa || 'TBD'}</span>
                            )}
                          </div>

                          {/* Notes Thread */}
                          <div className="pt-2 border-t border-slate-200/60 space-y-2">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                              Follow-Up Notes ({intv.notes?.length || 0})
                            </span>
                            {intv.notes?.map((n) => (
                              <div key={n.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <strong className="text-slate-700">{n.author_name}</strong>
                                  <span>{n.created_at.slice(0, 10)}</span>
                                </div>
                                <p className="text-slate-600">{n.note}</p>
                              </div>
                            ))}

                            {/* Add Note Input */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Add progress observation or follow-up note..."
                                value={noteInputs[intv.id] || ''}
                                onChange={(e) => setNoteInputs({ ...noteInputs, [intv.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddNote(intv.id);
                                }}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none"
                              />
                              <button
                                onClick={() => handleAddNote(intv.id)}
                                className="px-3 py-1.5 rounded-xl bg-[#7965E8] text-white text-xs font-bold hover:bg-[#6752D8] cursor-pointer"
                              >
                                Post Note
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
