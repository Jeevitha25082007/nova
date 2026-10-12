import React, { useState, useEffect } from 'react';
import {
  HandHeart,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  MessageSquare,
  ArrowRight,
  Filter,
  X,
  FileCheck
} from 'lucide-react';
import { Intervention, Student, Faculty } from '../types';
import { fetchInterventions, createIntervention, updateIntervention, addInterventionNote, fetchFaculty, fetchStudents } from '../api';

interface InterventionsViewProps {
  onOpenStudent: (id: number) => void;
  onRefreshDashboard?: () => void;
  initialStudentForIntervention?: Student | null;
  onClearInitialStudent?: () => void;
}

export const InterventionsView: React.FC<InterventionsViewProps> = ({
  onOpenStudent,
  onRefreshDashboard,
  initialStudentForIntervention,
  onClearInitialStudent,
}) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [studentOptions, setStudentOptions] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [facultyFilter, setFacultyFilter] = useState<string>('All');

  // Modals & form
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [outcomeText, setOutcomeText] = useState<string>('');
  const [postGpaInput, setPostGpaInput] = useState<string>('');

  const [createFormData, setCreateFormData] = useState({
    student_id: initialStudentForIntervention ? initialStudentForIntervention.id : 0,
    faculty_id: 1,
    issue: '',
    action_plan: '',
    priority: 'High',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [intvs, facs, studs] = await Promise.all([
        fetchInterventions({
          status: statusFilter,
          priority: priorityFilter,
          faculty_id: facultyFilter,
        }),
        fetchFaculty(),
        fetchStudents({ limit: 100 }),
      ]);
      setInterventions(intvs);
      setFacultyList(facs);
      setStudentOptions(studs.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter, priorityFilter, facultyFilter]);

  useEffect(() => {
    if (initialStudentForIntervention) {
      setCreateFormData(prev => ({
        ...prev,
        student_id: initialStudentForIntervention.id,
        issue: `Academic Support Required: ${initialStudentForIntervention.risk_category} Risk Flagged`,
        action_plan: 'Convene diagnostic session, create attendance log, and schedule remedial assignments.',
      }));
      setShowCreateModal(true);
    }
  }, [initialStudentForIntervention]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.student_id || !createFormData.issue || !createFormData.action_plan) {
      alert('Please fill in Student, Issue, and Action Plan.');
      return;
    }

    try {
      await createIntervention({
        student_id: Number(createFormData.student_id),
        faculty_id: Number(createFormData.faculty_id),
        issue: createFormData.issue.trim(),
        action_plan: createFormData.action_plan.trim(),
        priority: createFormData.priority,
        due_date: createFormData.due_date,
      });

      setShowCreateModal(false);
      if (onClearInitialStudent) onClearInitialStudent();
      await loadAll();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to create intervention');
    }
  };

  const handleStatusChange = async (intv: Intervention, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    try {
      await updateIntervention(intv.id, { status: newStatus });
      await loadAll();
      if (selectedIntervention && selectedIntervention.id === intv.id) {
        setSelectedIntervention({ ...selectedIntervention, status: newStatus });
      }
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSaveOutcome = async (intvId: number) => {
    try {
      await updateIntervention(intvId, {
        status: 'Completed',
        outcome: outcomeText.trim(),
        post_gpa: postGpaInput ? Number(postGpaInput) : null,
      });
      setOutcomeText('');
      setPostGpaInput('');
      await loadAll();
      setSelectedIntervention(null);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      alert('Failed to record outcome');
    }
  };

  const handleAddNote = async (intvId: number) => {
    if (!newNoteText.trim()) return;
    try {
      await addInterventionNote(intvId, newNoteText.trim(), 'Dr. Sarah Mitchell');
      setNewNoteText('');
      await loadAll();
      // update selected modal state
      const refreshed = interventions.find(i => i.id === intvId);
      if (refreshed) {
        setSelectedIntervention({
          ...refreshed,
          notes: [...(refreshed.notes || []), {
            id: Date.now(),
            intervention_id: intvId,
            author_name: 'Dr. Sarah Mitchell',
            note: newNoteText.trim(),
            created_at: new Date().toISOString()
          }]
        });
      }
    } catch (err) {
      alert('Failed to add note');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EDF2F7] shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#202747]">Faculty Intervention Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate student mentorship, assign remedial recovery plans, log observations, and measure GPA improvements.
          </p>
        </div>

        <button
          onClick={() => {
            if (studentOptions.length > 0 && !createFormData.student_id) {
              setCreateFormData(prev => ({ ...prev, student_id: studentOptions[0].id }));
            }
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7965E8] hover:bg-[#6752D8] text-white text-xs font-bold shadow-sm shadow-[#7965E8]/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Faculty Intervention</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-[#EDF2F7] shadow-xs">
        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Statuses (Pending, In Progress, Completed)</option>
          <option value="Pending">Pending Only</option>
          <option value="In Progress">In Progress Only</option>
          <option value="Completed">Completed Only</option>
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Priorities</option>
          <option value="Critical">Critical Priority</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        {/* Faculty */}
        <select
          value={facultyFilter}
          onChange={(e) => setFacultyFilter(e.target.value)}
          className="bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Assigned Faculty</option>
          {facultyList.map(f => (
            <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
          ))}
        </select>
      </div>

      {/* Interventions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-16 text-slate-400 text-xs">
            Loading interventions from SQLite...
          </div>
        ) : interventions.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 p-8">
            No active faculty interventions found matching criteria.
          </div>
        ) : (
          interventions.map((intv) => {
            const isCompleted = intv.status === 'Completed';
            const isCritical = intv.priority === 'Critical';

            return (
              <div
                key={intv.id}
                className="bg-white rounded-2xl border border-[#EDF2F7] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        onClick={() => onOpenStudent(intv.student_id)}
                        className="text-xs font-bold text-[#202747] hover:text-[#7965E8] text-left cursor-pointer transition-colors"
                      >
                        {intv.student_name}
                      </button>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {intv.student_code} • {intv.student_department}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : intv.priority === 'High'
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-[#DDEBFF] text-[#2563EB]'
                        }`}
                      >
                        {intv.priority}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-[#D1FAE5] text-[#059669]'
                            : intv.status === 'In Progress'
                            ? 'bg-[#DDEBFF] text-[#2563EB]'
                            : 'bg-[#FEF3C7] text-[#D97706]'
                        }`}
                      >
                        {intv.status}
                      </span>
                    </div>
                  </div>

                  {/* Issue & Action */}
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                      {intv.issue}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      <strong className="text-slate-700">Action:</strong> {intv.action_plan}
                    </p>
                  </div>
                </div>

                {/* Progress / Outcome before-after */}
                {intv.pre_gpa !== null && (
                  <div className="p-2.5 rounded-xl bg-[#F8F9FE] border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">GPA Recovery:</span>
                    <div className="font-mono font-bold flex items-center gap-1.5 text-xs">
                      <span className="text-slate-600">{intv.pre_gpa.toFixed(2)}</span>
                      <ArrowRight className="w-3 h-3 text-[#7965E8]" />
                      <span className={intv.post_gpa ? 'text-[#059669]' : 'text-slate-400'}>
                        {intv.post_gpa ? intv.post_gpa.toFixed(2) : 'Under Review'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{intv.faculty_name || 'Assigned Faculty'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedIntervention(intv);
                      setOutcomeText(intv.outcome || '');
                      setPostGpaInput(intv.post_gpa ? String(intv.post_gpa) : '');
                    }}
                    className="text-xs font-bold text-[#7965E8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage / Notes ({intv.notes?.length || 0})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE INTERVENTION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#202747]">Create Faculty Intervention</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  if (onClearInitialStudent) onClearInitialStudent();
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Student *</label>
                <select
                  required
                  value={createFormData.student_id}
                  onChange={(e) => setCreateFormData({ ...createFormData, student_id: Number(e.target.value) })}
                  className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                >
                  <option value="">Select Student...</option>
                  {studentOptions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.student_id}) - {s.risk_category} Risk
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Assigned Faculty Mentor</label>
                  <select
                    value={createFormData.faculty_id}
                    onChange={(e) => setCreateFormData({ ...createFormData, faculty_id: Number(e.target.value) })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Priority</label>
                  <select
                    value={createFormData.priority}
                    onChange={(e) => setCreateFormData({ ...createFormData, priority: e.target.value })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-bold"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Identified Academic Issue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical attendance drop and failing grade in prerequisite courses"
                  value={createFormData.issue}
                  onChange={(e) => setCreateFormData({ ...createFormData, issue: e.target.value })}
                  className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Planned Action & Support Roadmap *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Weekly mandatory advisor check-in; biometric log verification; paired with departmental senior peer tutor."
                  value={createFormData.action_plan}
                  onChange={(e) => setCreateFormData({ ...createFormData, action_plan: e.target.value })}
                  className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Review Due Date</label>
                <input
                  type="date"
                  required
                  value={createFormData.due_date}
                  onChange={(e) => setCreateFormData({ ...createFormData, due_date: e.target.value })}
                  className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7965E8] hover:bg-[#6752D8] text-white font-bold shadow-md shadow-[#7965E8]/25"
                >
                  Save & Dispatch Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE INTERVENTION DETAIL & NOTES MODAL */}
      {selectedIntervention && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#202747]">Intervention Lifecycle & Notes</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedIntervention.student_name} ({selectedIntervention.student_code})
                </p>
              </div>
              <button
                onClick={() => setSelectedIntervention(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Buttons */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FE] border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Change Status:</span>
              <div className="flex items-center gap-2">
                {(['Pending', 'In Progress', 'Completed'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedIntervention, st)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      selectedIntervention.status === st
                        ? 'bg-[#7965E8] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Details */}
            <div className="space-y-2 text-xs">
              <p className="text-slate-700"><strong>Documented Issue:</strong> {selectedIntervention.issue}</p>
              <p className="text-slate-700"><strong>Action Plan:</strong> {selectedIntervention.action_plan}</p>
              <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px] pt-1">
                <span>Faculty: {selectedIntervention.faculty_name || 'Advisor'}</span>
                <span>Due Date: {selectedIntervention.due_date}</span>
                <span>Initial GPA: {selectedIntervention.pre_gpa || 'N/A'}</span>
              </div>
            </div>

            {/* Follow-up Notes Thread */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-[#202747] uppercase tracking-wider">
                Follow-up Observations & Notes ({selectedIntervention.notes?.length || 0})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedIntervention.notes && selectedIntervention.notes.length > 0 ? (
                  selectedIntervention.notes.map(n => (
                    <div key={n.id} className="p-3 rounded-xl bg-[#FAFBFD] border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <strong className="text-slate-700">{n.author_name}</strong>
                        <span>{n.created_at.slice(0, 10)}</span>
                      </div>
                      <p className="text-slate-700">{n.note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No notes logged yet.</p>
                )}
              </div>

              {/* Add Note Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type advisor observation note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNote(selectedIntervention.id);
                  }}
                  className="flex-1 bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
                <button
                  onClick={() => handleAddNote(selectedIntervention.id)}
                  className="px-4 py-2 rounded-xl bg-[#7965E8] text-white text-xs font-bold hover:bg-[#6752D8] cursor-pointer"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Close & Record Outcome Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3 bg-[#FAF8FF] p-4 rounded-2xl border border-[#E9E3FF]">
              <h4 className="text-xs font-bold text-[#7965E8] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Record Intervention Resolution & Post-GPA</span>
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Outcome Summary</label>
                  <input
                    type="text"
                    placeholder="e.g. Student successfully completed makeup labs and raised attendance to 78%."
                    value={outcomeText}
                    onChange={(e) => setOutcomeText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Post-Intervention GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 6.85"
                    value={postGpaInput}
                    onChange={(e) => setPostGpaInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleSaveOutcome(selectedIntervention.id)}
                  className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Mark Completed & Record Outcome
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
