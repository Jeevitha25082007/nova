import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { Student, SimulationResult } from '../types';
import { runSimulation, fetchStudents } from '../api';

interface SimulatorViewProps {
  initialStudent?: Student | null;
  onOpenStudentProfile?: (id: number) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  initialStudent,
  onOpenStudentProfile,
}) => {
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    initialStudent ? initialStudent.id : null
  );

  // Hypothetical slider values
  const [simAttendance, setSimAttendance] = useState<number>(
    initialStudent ? initialStudent.attendance : 65.0
  );
  const [simAvgMarks, setSimAvgMarks] = useState<number>(
    initialStudent ? initialStudent.avg_marks : 55.0
  );
  const [simCgpa, setSimCgpa] = useState<number>(
    initialStudent ? initialStudent.cgpa : 5.8
  );
  const [simAssignments, setSimAssignments] = useState<number>(
    initialStudent ? initialStudent.assignment_completion : 60.0
  );

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load students for selector
  useEffect(() => {
    fetchStudents({ limit: 50 }).then((data) => {
      setStudentsList(data.students);
      if (!selectedStudentId && data.students.length > 0) {
        const firstAtRisk = data.students.find(s => s.risk_category === 'High') || data.students[0];
        setSelectedStudentId(firstAtRisk.id);
        setSimAttendance(firstAtRisk.attendance);
        setSimAvgMarks(firstAtRisk.avg_marks);
        setSimCgpa(firstAtRisk.cgpa);
        setSimAssignments(firstAtRisk.assignment_completion);
      }
    });
  }, []);

  // When initialStudent changes
  useEffect(() => {
    if (initialStudent) {
      setSelectedStudentId(initialStudent.id);
      setSimAttendance(initialStudent.attendance);
      setSimAvgMarks(initialStudent.avg_marks);
      setSimCgpa(initialStudent.cgpa);
      setSimAssignments(initialStudent.assignment_completion);
    }
  }, [initialStudent]);

  // Execute simulation when slider values change
  const computeSimulation = async () => {
    setLoading(true);
    try {
      const res = await runSimulation({
        studentId: selectedStudentId,
        attendance: simAttendance,
        avgMarks: simAvgMarks,
        cgpa: simCgpa,
        assignmentCompletion: simAssignments,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    computeSimulation();
  }, [selectedStudentId, simAttendance, simAvgMarks, simCgpa, simAssignments]);

  const handleStudentSelect = (idStr: string) => {
    const id = Number(idStr);
    setSelectedStudentId(id);
    const found = studentsList.find(s => s.id === id);
    if (found) {
      setSimAttendance(found.attendance);
      setSimAvgMarks(found.avg_marks);
      setSimCgpa(found.cgpa);
      setSimAssignments(found.assignment_completion);
    }
  };

  const handleResetToBaseline = () => {
    const found = studentsList.find(s => s.id === selectedStudentId);
    if (found) {
      setSimAttendance(found.attendance);
      setSimAvgMarks(found.avg_marks);
      setSimCgpa(found.cgpa);
      setSimAssignments(found.assignment_completion);
    } else {
      setSimAttendance(75.0);
      setSimAvgMarks(60.0);
      setSimCgpa(6.5);
      setSimAssignments(75.0);
    }
  };

  const currentStudent = studentsList.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#E9E3FF] via-[#DDEBFF] to-[#DDF5E8] p-6 rounded-3xl border border-white/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#7965E8] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Sandbox Simulation Environment
            </span>
            <span className="text-xs text-slate-500 font-medium">Safe Mode Active</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#202747] mt-1">
            NOVA What-If Academic Trajectory Simulator
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Model hypothetical academic turnaround scenarios without altering permanent database records. Adjust attendance, test marks, and coursework to visualize projected risk score changes.
          </p>
        </div>

        <button
          onClick={handleResetToBaseline}
          className="flex items-center gap-2 bg-white text-[#7965E8] hover:bg-[#F4F1FE] px-4 py-2 rounded-xl text-xs font-bold border border-[#E9E3FF] shadow-sm transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Main Grid: Left Controls (5 cols) & Right Results (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT CONTROLS: Sliders & Student Selector */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EDF2F7] p-6 shadow-xs space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#202747] mb-1.5">
              Select Baseline Student for Scenario Modeling:
            </label>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full bg-[#F8F9FE] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#202747] font-semibold outline-none focus:border-[#7965E8] cursor-pointer"
            >
              {studentsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.student_id}) — {s.risk_category} Risk ({Math.round(s.risk_score)} Score)
                </option>
              ))}
            </select>
            {currentStudent && (
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Current record: {currentStudent.department} • Year {currentStudent.year} (Sem {currentStudent.semester})
              </p>
            )}
          </div>

          {/* Interactive Sliders */}
          <div className="space-y-5 pt-2">
            {/* 1. Attendance Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-[#202747]">Simulated Attendance %</span>
                <span className="font-mono text-[#7965E8] text-sm">{simAttendance.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="0.5"
                value={simAttendance}
                onChange={(e) => setSimAttendance(Number(e.target.value))}
                className="w-full accent-[#7965E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>30%</span>
                <span className="text-[#DC2626]">75% Benchmark</span>
                <span>100%</span>
              </div>
            </div>

            {/* 2. Marks Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-[#202747]">Simulated Assessment Marks %</span>
                <span className="font-mono text-[#7965E8] text-sm">{simAvgMarks.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="0.5"
                value={simAvgMarks}
                onChange={(e) => setSimAvgMarks(Number(e.target.value))}
                className="w-full accent-[#7965E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>20%</span>
                <span className="text-[#DC2626]">60% Passing Target</span>
                <span>100%</span>
              </div>
            </div>

            {/* 3. CGPA Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-[#202747]">Simulated Cumulative CGPA</span>
                <span className="font-mono text-[#7965E8] text-sm">{simCgpa.toFixed(2)} / 10.0</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="10.0"
                step="0.05"
                value={simCgpa}
                onChange={(e) => setSimCgpa(Number(e.target.value))}
                className="w-full accent-[#7965E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>3.0</span>
                <span className="text-[#DC2626]">6.5 Good Standing</span>
                <span>10.0</span>
              </div>
            </div>

            {/* 4. Assignment Completion Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-[#202747]">Simulated Coursework & Assignments %</span>
                <span className="font-mono text-[#7965E8] text-sm">{simAssignments.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="1"
                value={simAssignments}
                onChange={(e) => setSimAssignments(Number(e.target.value))}
                className="w-full accent-[#7965E8] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>20%</span>
                <span>75% Target</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#FAFBFD] rounded-xl border border-slate-200 text-[11px] text-slate-500">
            <strong>Simulation Isolation Guarantee:</strong> Adjusting these sliders computes hypothetical outputs in memory and will never overwrite real student records.
          </div>
        </div>

        {/* RIGHT RESULTS: Baseline vs Simulated Comparison */}
        <div className="lg:col-span-7 space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Baseline Card */}
            <div className="bg-white rounded-3xl border border-[#EDF2F7] p-6 shadow-xs space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Permanent Baseline Record
              </span>

              {simulationResult?.baseline ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#202747]">
                      {simulationResult.baseline.riskScore}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ 100 Risk</span>
                  </div>

                  <div className="mt-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        simulationResult.baseline.riskCategory === 'High'
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : simulationResult.baseline.riskCategory === 'Moderate'
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#D1FAE5] text-[#059669]'
                      }`}
                    >
                      {simulationResult.baseline.riskCategory} Risk Tier
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                    {simulationResult.baseline.primaryConcern}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No baseline selected</p>
              )}
            </div>

            {/* Simulated Projected Card */}
            <div className="bg-gradient-to-br from-white to-[#F4F1FE] rounded-3xl border border-[#D9D2FC] p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#7965E8] tracking-wider">
                  Projected Trajectory
                </span>

                {/* Score Delta Badge */}
                {simulationResult && (
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      simulationResult.delta < 0
                        ? 'bg-[#D1FAE5] text-[#059669]'
                        : simulationResult.delta > 0
                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {simulationResult.delta < 0 ? (
                      <>
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>{simulationResult.delta} Risk Drop (Improvement)</span>
                      </>
                    ) : simulationResult.delta > 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+{simulationResult.delta} Risk Rise (Deterioration)</span>
                      </>
                    ) : (
                      <span>No Change</span>
                    )}
                  </span>
                )}
              </div>

              {simulationResult && (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#7965E8]">
                      {simulationResult.simulated.riskScore}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ 100 Risk</span>
                  </div>

                  <div className="mt-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        simulationResult.simulated.riskCategory === 'High'
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : simulationResult.simulated.riskCategory === 'Moderate'
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#D1FAE5] text-[#059669]'
                      }`}
                    >
                      {simulationResult.simulated.riskCategory} Risk Tier
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                    {simulationResult.simulated.primaryConcern}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Factor Deltas Breakdown */}
          {simulationResult?.factorsChanged && (
            <div className="bg-white rounded-3xl border border-[#EDF2F7] p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-[#202747] uppercase tracking-wider">
                Simulated Metric Deltas vs. Actual Record
              </h3>

              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8F9FE] border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Attendance Delta</span>
                  <div className="text-sm font-extrabold font-mono mt-1 text-[#202747]">
                    {simulationResult.factorsChanged.attendanceDelta > 0 ? '+' : ''}
                    {simulationResult.factorsChanged.attendanceDelta}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F9FE] border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Marks Delta</span>
                  <div className="text-sm font-extrabold font-mono mt-1 text-[#202747]">
                    {simulationResult.factorsChanged.avgMarksDelta > 0 ? '+' : ''}
                    {simulationResult.factorsChanged.avgMarksDelta}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F9FE] border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">CGPA Delta</span>
                  <div className="text-sm font-extrabold font-mono mt-1 text-[#202747]">
                    {simulationResult.factorsChanged.cgpaDelta > 0 ? '+' : ''}
                    {simulationResult.factorsChanged.cgpaDelta}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F9FE] border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Assignments Delta</span>
                  <div className="text-sm font-extrabold font-mono mt-1 text-[#202747]">
                    {simulationResult.factorsChanged.assignmentsDelta > 0 ? '+' : ''}
                    {simulationResult.factorsChanged.assignmentsDelta}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Actions if Simulated Trajectory is Met */}
          {simulationResult && (
            <div className="bg-white rounded-3xl border border-[#EDF2F7] p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#202747] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7965E8]" />
                <span>Action Plans & Recommendations for Simulated Milestone</span>
              </h3>

              <div className="space-y-2.5">
                {simulationResult.suggestedActions.map((rec, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#FAFBFD] border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-[#202747]">{rec.identifiedIssue}</strong>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{rec.recommendedAction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
