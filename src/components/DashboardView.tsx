import React, { useState } from 'react';
import {
  Users,
  Award,
  CalendarCheck,
  AlertOctagon,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  HandHeart,
  FileSpreadsheet
} from 'lucide-react';
import { DashboardData } from '../types';

interface DashboardViewProps {
  data: DashboardData | null;
  loading: boolean;
  onOpenStudent: (id: number) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  onOpenStudent,
  onNavigateTab,
  onOpenAddModal,
}) => {
  const [activeScatterDept, setActiveScatterDept] = useState<string>('All');

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#7965E8]/20 border-t-[#7965E8] rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Calculating real-time academic cohort metrics...</p>
      </div>
    );
  }

  const { summary, charts, recentActivities, criticalAlerts } = data;

  const kpis = [
    {
      label: 'Total Enrolled',
      value: summary.totalStudents,
      subtext: 'Across 5 Academic Depts',
      icon: Users,
      bg: 'bg-[#F4F1FE]',
      iconColor: 'text-[#7965E8]',
      borderColor: 'border-[#E9E3FF]',
    },
    {
      label: 'Average CGPA',
      value: `${summary.avgCgpa} / 10.0`,
      subtext: 'Cohort mean cumulative',
      icon: Award,
      bg: 'bg-[#DDEBFF]/40',
      iconColor: 'text-[#2563EB]',
      borderColor: 'border-[#DDEBFF]',
    },
    {
      label: 'Average Attendance',
      value: `${summary.avgAttendance}%`,
      subtext: 'Mandatory benchmark: 75%',
      icon: CalendarCheck,
      bg: 'bg-[#DDF5E8]/50',
      iconColor: 'text-[#059669]',
      borderColor: 'border-[#DDF5E8]',
    },
    {
      label: 'Needing Support',
      value: summary.needingSupport,
      subtext: `${summary.highRiskCount} High • ${summary.moderateRiskCount} Moderate`,
      icon: AlertOctagon,
      bg: 'bg-[#FEE2E2]/50',
      iconColor: 'text-[#DC2626]',
      borderColor: 'border-[#FECACA]',
    },
    {
      label: 'Performing Well',
      value: summary.performingWell,
      subtext: 'CGPA in good standing',
      icon: CheckCircle,
      bg: 'bg-[#D1FAE5]/40',
      iconColor: 'text-[#10B981]',
      borderColor: 'border-[#A7F3D0]',
    },
    {
      label: 'Pending Interventions',
      value: summary.pendingInterventions,
      subtext: `${summary.completedInterventions} successfully closed`,
      icon: Clock,
      bg: 'bg-[#FEF3C7]/40',
      iconColor: 'text-[#D97706]',
      borderColor: 'border-[#FDE68A]',
    },
  ];

  const filteredScatter = activeScatterDept === 'All'
    ? charts.attendanceVsMarks
    : charts.attendanceVsMarks.filter(s => s.department === activeScatterDept);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-[#E9E3FF] via-[#DDEBFF] to-[#DDF5E8] p-6 rounded-2xl border border-white/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#7965E8] text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
              Live Analytics Mode
            </span>
            <span className="text-xs text-slate-600 font-medium">SQLite Engine Synchronized</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#202747] mt-1 tracking-tight">
            Institutional Student Success Pulse
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Transparent algorithmic screening identifies at-risk students before final evaluations. All calculations directly query the persistent SQLite store.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('simulator')}
            className="flex items-center gap-1.5 bg-white text-[#7965E8] hover:bg-[#F4F1FE] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm border border-[#E9E3FF] transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Launch Simulator</span>
          </button>
          <button
            onClick={() => onNavigateTab('interventions')}
            className="flex items-center gap-1.5 bg-[#7965E8] hover:bg-[#6752D8] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-[#7965E8]/20 transition-all cursor-pointer"
          >
            <HandHeart className="w-3.5 h-3.5" />
            <span>Assign Intervention</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${kpi.borderColor} ${kpi.bg} shadow-sm transition-all hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg bg-white/80 shadow-xs ${kpi.iconColor}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-[#202747] tracking-tight">{kpi.value}</div>
              <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{kpi.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Critical Alerts Strip */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#FECACA] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#FEE2E2] text-[#DC2626]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-[#202747]">
                Immediate Priority: High-Risk Students Flagged by Algorithm
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-bold text-[#7965E8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All At-Risk Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {criticalAlerts.map((student) => (
              <div
                key={student.id}
                onClick={() => onOpenStudent(student.id)}
                className="p-3.5 rounded-xl border border-slate-100 bg-[#FDF8F8] hover:bg-[#FEE2E2]/30 hover:border-[#FECACA] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#202747]">{student.name}</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#DC2626] text-white">
                      Risk {Math.round(student.risk_score)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{student.student_id} • {student.department}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Att: <strong className="text-[#DC2626]">{student.attendance}%</strong></span>
                  <span className="text-slate-600">CGPA: <strong className="text-[#DC2626]">{student.cgpa}</strong></span>
                  <span className="text-[#7965E8] font-bold flex items-center">Profile &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts Row 1: Attendance vs Marks & Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance vs Marks Scatter Plot / Matrix (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EDF2F7] p-6 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-[#202747] flex items-center gap-2">
                <span>Attendance vs. Academic Marks Correlation</span>
                <span className="text-[10px] font-semibold bg-[#E9E3FF] text-[#7965E8] px-2 py-0.5 rounded-full">
                  Diagnostic Scatter
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students below 75% attendance and 60% marks fall in the critical support quadrant.
              </p>
            </div>

            {/* Department Filter for Scatter */}
            <select
              value={activeScatterDept}
              onChange={(e) => setActiveScatterDept(e.target.value)}
              className="text-xs bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-slate-700 outline-none font-medium cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
          </div>

          {/* Interactive Visual Graph Canvas (SVG Scatter) */}
          <div className="relative mt-4 h-64 w-full bg-[#FAFBFD] rounded-xl border border-slate-100 p-4 flex flex-col justify-between">
            {/* Quadrant Lines (75% Attendance vertical line, 60% Marks horizontal line) */}
            <div className="absolute inset-x-8 top-1/2 border-b border-dashed border-red-200 pointer-events-none z-0">
              <span className="absolute right-0 -top-3 text-[9px] text-red-400 font-bold">Passing Marks Benchmark (60%)</span>
            </div>
            <div className="absolute inset-y-8 left-[75%] border-r border-dashed border-red-200 pointer-events-none z-0">
              <span className="absolute bottom-0 -left-12 text-[9px] text-red-400 font-bold">75% Attendance</span>
            </div>

            {/* Plot Area */}
            <div className="relative w-full h-full">
              {filteredScatter.map((s) => {
                // attendance is 0-100 (x-axis), marks is 0-100 (y-axis inverted)
                const leftPct = Math.min(95, Math.max(5, s.attendance));
                const bottomPct = Math.min(95, Math.max(5, s.avg_marks));
                const color = s.risk_category === 'High' ? '#EF4444' : s.risk_category === 'Moderate' ? '#F59E0B' : '#10B981';

                return (
                  <div
                    key={s.id}
                    onClick={() => onOpenStudent(s.id)}
                    title={`${s.name} (${s.student_id})\nAtt: ${s.attendance}%\nMarks: ${s.avg_marks}%\nCGPA: ${s.cgpa}`}
                    style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-150 z-10 group"
                  >
                    <span
                      style={{ backgroundColor: color }}
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200/50"
                    />
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#202747] text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap shadow-xl z-30 font-medium">
                      {s.name} • {s.attendance}% Att / {s.avg_marks}% Marks
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-200">
              <span>0% Attendance</span>
              <span>Classroom Attendance Percentage &rarr;</span>
              <span>100% Attendance</span>
            </div>
          </div>

          {/* Scatter Legend */}
          <div className="flex items-center justify-between text-[11px] mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> High Risk Cohort
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Moderate Watchlist
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Safe / Performing Well
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">Click any dot to open student 360°</span>
          </div>
        </div>

        {/* Department-wise Academic Performance (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EDF2F7] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-[#202747]">Department-wise Breakdown</h3>
              <span className="text-xs text-slate-500 font-medium">5 Departments</span>
            </div>

            <div className="space-y-4 mt-4">
              {charts.departmentPerformance.map((dept, idx) => {
                const total = dept.total;
                const highRatio = Math.round((dept.highRiskCount / total) * 100);
                const modRatio = Math.round((dept.moderateRiskCount / total) * 100);
                const lowRatio = Math.round((dept.lowRiskCount / total) * 100);

                return (
                  <div key={idx} className="p-3 rounded-xl bg-[#F8F9FE] border border-[#EAEFF5]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#202747]">{dept.department}</span>
                      <div className="text-[11px] font-mono text-slate-600">
                        Avg CGPA: <strong className="text-[#7965E8]">{dept.avgCgpa}</strong> • Att: {dept.avgAttendance}%
                      </div>
                    </div>

                    {/* Multi-segment Risk bar */}
                    <div className="h-2.5 w-full bg-slate-200 rounded-full flex overflow-hidden">
                      <div style={{ width: `${lowRatio}%` }} className="bg-[#10B981] h-full" title={`Low Risk: ${lowRatio}%`} />
                      <div style={{ width: `${modRatio}%` }} className="bg-[#F59E0B] h-full" title={`Moderate: ${modRatio}%`} />
                      <div style={{ width: `${highRatio}%` }} className="bg-[#EF4444] h-full" title={`High Risk: ${highRatio}%`} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                      <span>{dept.total} Enrolled</span>
                      <span>{dept.highRiskCount} Needing Action</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Need deeper diagnostic analytics?</span>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-bold text-[#7965E8] hover:underline cursor-pointer"
            >
              Explainable Risk Engine &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: Performance Distribution, Semester Trends & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Distribution Brackets (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EDF2F7] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#202747] pb-3 border-b border-slate-100">
              CGPA Performance Distribution
            </h3>

            <div className="space-y-3.5 mt-4">
              {charts.performanceDistribution.map((item, idx) => {
                const total = summary.totalStudents || 1;
                const pct = Math.round((item.count / total) * 100);
                const barColor = idx === 0 ? 'bg-[#EF4444]' : idx === 1 ? 'bg-[#F59E0B]' : idx === 2 ? 'bg-[#3B82F6]' : 'bg-[#7965E8]';

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{item.bracket}</span>
                      <span className="font-mono text-slate-500">{item.count} students ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className={`h-full ${barColor} rounded-full`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-[#E9E3FF]/40 rounded-xl border border-[#E9E3FF] mt-4 text-[11px] text-slate-700">
            <strong>Institutional Insight:</strong> {summary.highRiskCount} students currently fall into the academic probation hazard bracket (&lt;6.0 CGPA).
          </div>
        </div>

        {/* Semester-over-Semester Academic Trend (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EDF2F7] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#202747] pb-3 border-b border-slate-100">
              Semester Progression Momentum
            </h3>

            <div className="space-y-3 mt-4">
              {charts.semesterTrends.map((st) => (
                <div key={st.semester} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FE] border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#E9E3FF] text-[#7965E8] font-bold text-[11px] flex items-center justify-center">
                      S{st.semester}
                    </span>
                    <span className="font-semibold text-[#202747]">Semester {st.semester}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px]">
                    <span>GPA: <strong className="text-[#202747]">{st.avgGpa}</strong></span>
                    <span>Att: <strong className="text-[#059669]">{st.avgAttendance}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4">
            Aggregated from individual semester record archives in SQLite.
          </p>
        </div>

        {/* Recent Faculty Interventions Feed (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EDF2F7] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-[#202747]">Recent Faculty Interventions</h3>
              <button
                onClick={() => onNavigateTab('interventions')}
                className="text-xs font-bold text-[#7965E8] hover:underline cursor-pointer"
              >
                All &rarr;
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {recentActivities.map((act) => (
                <div key={act.intervention_id} className="p-3 rounded-xl border border-slate-100 bg-[#FDFEFE] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#202747]">{act.student_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        act.status === 'Completed'
                          ? 'bg-[#D1FAE5] text-[#059669]'
                          : act.status === 'In Progress'
                          ? 'bg-[#DDEBFF] text-[#2563EB]'
                          : 'bg-[#FEF3C7] text-[#D97706]'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-1 mt-1">{act.issue}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    By {act.faculty_name || 'Assigned Faculty'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('interventions')}
            className="w-full mt-4 py-2 border border-dashed border-[#7965E8] text-[#7965E8] hover:bg-[#F4F1FE] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            + Create New Support Intervention
          </button>
        </div>
      </div>
    </div>
  );
};
