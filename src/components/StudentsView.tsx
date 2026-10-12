import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
  ArrowUpDown,
  Download,
  CheckCircle2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Student } from '../types';
import { fetchStudents, createStudent, updateStudent, deleteStudent } from '../api';

interface StudentsViewProps {
  onOpenStudent: (id: number) => void;
  onRefreshDashboard?: () => void;
  initialAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onOpenStudent,
  onRefreshDashboard,
  initialAddModalOpen = false,
  onCloseAddModal,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('All');
  const [year, setYear] = useState<string>('All');
  const [risk, setRisk] = useState<string>('All');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(initialAddModalOpen);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [formError, setFormError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    department: 'Computer Science',
    year: 1,
    semester: 1,
    cgpa: 7.5,
    attendance: 80.0,
    avg_marks: 70.0,
    assignment_completion: 80.0,
    previous_gpa: '',
  });

  useEffect(() => {
    if (initialAddModalOpen) {
      setShowAddModal(true);
    }
  }, [initialAddModalOpen]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await fetchStudents({
        search,
        department,
        year,
        risk,
        page,
        limit: 10,
        sortBy,
        sortOrder,
      });
      setStudents(data.students);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search, department, year, risk, page, sortBy, sortOrder]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.student_id || !formData.name || !formData.email) {
      setFormError('Please fill in Student ID, Name, and Email.');
      return;
    }

    try {
      await createStudent({
        student_id: formData.student_id.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        department: formData.department,
        year: Number(formData.year),
        semester: Number(formData.semester),
        cgpa: Number(formData.cgpa),
        attendance: Number(formData.attendance),
        avg_marks: Number(formData.avg_marks),
        assignment_completion: Number(formData.assignment_completion),
        previous_gpa: formData.previous_gpa ? Number(formData.previous_gpa) : null,
      });

      setShowAddModal(false);
      if (onCloseAddModal) onCloseAddModal();
      setSuccessToast(`Student ${formData.name} successfully registered.`);
      setTimeout(() => setSuccessToast(''), 4000);
      setFormData({
        student_id: '',
        name: '',
        email: '',
        department: 'Computer Science',
        year: 1,
        semester: 1,
        cgpa: 7.5,
        attendance: 80.0,
        avg_marks: 70.0,
        assignment_completion: 80.0,
        previous_gpa: '',
      });
      loadStudents();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create student');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setFormError('');

    try {
      await updateStudent(editingStudent.id, {
        name: editingStudent.name,
        email: editingStudent.email,
        department: editingStudent.department,
        year: Number(editingStudent.year),
        semester: Number(editingStudent.semester),
        cgpa: Number(editingStudent.cgpa),
        attendance: Number(editingStudent.attendance),
        avg_marks: Number(editingStudent.avg_marks),
        assignment_completion: Number(editingStudent.assignment_completion),
        previous_gpa: editingStudent.previous_gpa ? Number(editingStudent.previous_gpa) : null,
      });

      setEditingStudent(null);
      setSuccessToast(`Student record for ${editingStudent.name} updated.`);
      setTimeout(() => setSuccessToast(''), 4000);
      loadStudents();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update student');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      await deleteStudent(deletingStudent.id);
      setDeletingStudent(null);
      setSuccessToast(`Record for ${deletingStudent.name} permanently deleted.`);
      setTimeout(() => setSuccessToast(''), 4000);
      loadStudents();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    }
  };

  // CSV Export utility
  const exportToCSV = () => {
    const headers = ['Student ID', 'Name', 'Email', 'Department', 'Year', 'Semester', 'CGPA', 'Attendance %', 'Average Marks', 'Assignments %', 'Risk Score', 'Risk Category'];
    const rows = students.map(s => [
      `"${s.student_id}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department}"`,
      s.year,
      s.semester,
      s.cgpa,
      s.attendance,
      s.avg_marks,
      s.assignment_completion,
      s.risk_score,
      `"${s.risk_category}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NOVA_Students_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-[#D1FAE5] border border-[#10B981] text-[#065F46] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="p-1 hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Directory Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EDF2F7] shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#202747]">Student Academic Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage cohort profiles, evaluate risk screenings, and trigger interventions. Total: <strong>{totalCount}</strong> students.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-[#F8F9FE] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setFormError('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7965E8] hover:bg-[#6752D8] text-white text-xs font-bold shadow-sm shadow-[#7965E8]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-[#EDF2F7] shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#202747] outline-none focus:border-[#7965E8]"
          />
        </div>

        {/* Department Filter */}
        <select
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(1);
          }}
          className="bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none font-medium cursor-pointer"
        >
          <option value="All">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Electrical Engineering">Electrical Engineering</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Mechanical Engineering">Mechanical Engineering</option>
          <option value="Civil Engineering">Civil Engineering</option>
        </select>

        {/* Academic Year Filter */}
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setPage(1);
          }}
          className="bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none font-medium cursor-pointer"
        >
          <option value="All">All Academic Years</option>
          <option value="1">Year 1 (Freshman)</option>
          <option value="2">Year 2 (Sophomore)</option>
          <option value="3">Year 3 (Junior)</option>
          <option value="4">Year 4 (Senior)</option>
        </select>

        {/* Risk Category Filter */}
        <select
          value={risk}
          onChange={(e) => {
            setRisk(e.target.value);
            setPage(1);
          }}
          className="bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none font-medium cursor-pointer"
        >
          <option value="All">All Risk Brackets</option>
          <option value="High">High Risk Only</option>
          <option value="Moderate">Moderate Risk Only</option>
          <option value="Low">Low Risk (Safe)</option>
        </select>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-[#EDF2F7] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Department / Year</th>
                <th
                  onClick={() => handleSort('cgpa')}
                  className="py-3 px-4 cursor-pointer hover:text-[#7965E8]"
                >
                  <div className="flex items-center gap-1">
                    <span>CGPA</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('attendance')}
                  className="py-3 px-4 cursor-pointer hover:text-[#7965E8]"
                >
                  <div className="flex items-center gap-1">
                    <span>Attendance</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Avg Marks</th>
                <th className="py-3 px-4">Coursework</th>
                <th
                  onClick={() => handleSort('risk_score')}
                  className="py-3 px-4 cursor-pointer hover:text-[#7965E8]"
                >
                  <div className="flex items-center gap-1">
                    <span>AI Risk Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading student cohort from SQLite...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isHigh = student.risk_category === 'High';
                  const isMod = student.risk_category === 'Moderate';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#FAF8FF] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E9E3FF] text-[#7965E8] flex items-center justify-center font-bold text-xs shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => onOpenStudent(student.id)}
                              className="font-bold text-[#202747] hover:text-[#7965E8] transition-colors text-left cursor-pointer"
                            >
                              {student.name}
                            </button>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {student.student_id} • {student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {student.department}
                        <p className="text-[10px] text-slate-400 font-mono">
                          Year {student.year} • Sem {student.semester}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <span className={student.cgpa < 6.0 ? 'text-[#DC2626]' : 'text-slate-800'}>
                          {student.cgpa.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400"> / 10.0</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        <span className={student.attendance < 75 ? 'text-[#DC2626]' : 'text-[#059669]'}>
                          {student.attendance.toFixed(1)}%
                        </span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, student.attendance)}%` }}
                            className={`h-full ${student.attendance < 75 ? 'bg-[#DC2626]' : 'bg-[#059669]'}`}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {student.avg_marks.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {student.assignment_completion.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isHigh
                                ? 'bg-[#FEE2E2] text-[#DC2626]'
                                : isMod
                                ? 'bg-[#FEF3C7] text-[#D97706]'
                                : 'bg-[#D1FAE5] text-[#059669]'
                            }`}
                          >
                            {student.risk_category} ({Math.round(student.risk_score)})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenStudent(student.id)}
                            title="View 360° Profile"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#7965E8] hover:bg-[#E9E3FF] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setFormError('');
                              setEditingStudent({ ...student });
                            }}
                            title="Edit Student"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563EB] hover:bg-[#DDEBFF] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(student)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 bg-[#FAFBFD] border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages || 1}</strong> ({totalCount} total students)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#202747]">Enroll New Student Record</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  if (onCloseAddModal) onCloseAddModal();
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Student ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STU-2024-023"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#7965E8]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#7965E8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rachel.a@nova.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#7965E8]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-600 font-bold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Academic Year</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#FAFBFD] rounded-xl border border-slate-200 space-y-3">
                <p className="font-bold text-[#202747] text-xs">Initial Academic Performance Metrics</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">CGPA (0 - 10.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Attendance % (0 - 100)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.attendance}
                      onChange={(e) => setFormData({ ...formData, attendance: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Average Marks %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.avg_marks}
                      onChange={(e) => setFormData({ ...formData, avg_marks: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Assignment Completion %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.assignment_completion}
                      onChange={(e) => setFormData({ ...formData, assignment_completion: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onCloseAddModal) onCloseAddModal();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7965E8] hover:bg-[#6752D8] text-white font-bold shadow-md shadow-[#7965E8]/25"
                >
                  Register & Calculate Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#202747]">Update Academic Parameters</h3>
                <p className="text-[11px] text-slate-500 font-mono">{editingStudent.student_id} • {editingStudent.name}</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Cumulative CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editingStudent.cgpa}
                    onChange={(e) => setEditingStudent({ ...editingStudent, cgpa: Number(e.target.value) })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Attendance Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingStudent.attendance}
                    onChange={(e) => setEditingStudent({ ...editingStudent, attendance: Number(e.target.value) })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Average Internal Marks (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingStudent.avg_marks}
                    onChange={(e) => setEditingStudent({ ...editingStudent, avg_marks: Number(e.target.value) })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Assignment Submissions (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingStudent.assignment_completion}
                    onChange={(e) => setEditingStudent({ ...editingStudent, assignment_completion: Number(e.target.value) })}
                    className="w-full bg-[#F8F9FE] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#E9E3FF]/40 rounded-xl text-[11px] text-slate-600">
                Updating values automatically recalculates the explainable AI risk score and refreshes the student's personalized recommendations.
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7965E8] hover:bg-[#6752D8] text-white font-bold shadow-md shadow-[#7965E8]/25"
                >
                  Save & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#202747] text-center">
              Delete Student Record?
            </h3>
            <p className="text-xs text-slate-500 text-center mt-2">
              Are you sure you want to delete <strong>{deletingStudent.name}</strong> ({deletingStudent.student_id})? This will permanently delete academic records, subject grades, and associated interventions from SQLite.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm shadow-red-500/25 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
