import React, { useState } from 'react';
import {
  BrainCircuit,
  Sliders,
  ShieldAlert,
  Info,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  ChevronRight
} from 'lucide-react';
import { DashboardData } from '../types';

interface AnalyticsViewProps {
  data: DashboardData | null;
  onOpenStudent: (id: number) => void;
  onOpenSettings: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  data,
  onOpenStudent,
  onOpenSettings,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('All');

  if (!data) return null;

  const weights = [
    { name: 'Classroom Attendance', weight: '30%', benchmark: '< 75% Warning, < 60% Critical', icon: '📅' },
    { name: 'Internal Assessment Marks', weight: '30%', benchmark: '< 60% Warning, < 45% Critical', icon: '📝' },
    { name: 'Cumulative GPA (CGPA)', weight: '25%', benchmark: '< 6.5 Warning, < 5.0 Probation', icon: '🎓' },
    { name: 'Coursework & Assignments', weight: '15%', benchmark: '< 75% Warning, < 50% Backlog', icon: '📂' },
    { name: 'Semester Momentum Trend', weight: 'Modifier', benchmark: '±0.6 GPA Delta Penalty / Credit', icon: '📈' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#E9E3FF] via-[#DDEBFF] to-white p-6 rounded-3xl border border-white/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#7965E8] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Transparent Heuristic Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">Zero Black-Box Scoring</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#202747] mt-1">
            NOVA Explainable Academic Risk Architecture
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Our multi-indicator risk calculation algorithm models student attrition factors with full mathematical explainability. Weights and trigger thresholds are fully tunable by faculty advisors.
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 bg-[#7965E8] hover:bg-[#6752D8] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#7965E8]/20 transition-all cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Tune Thresholds & Weights</span>
        </button>
      </div>

      {/* Institutional Legal & Ethics Banner */}
      <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700">
          <strong className="text-[#92400E]">Institutional Ethical Disclosure:</strong>{' '}
          The NOVA Academic Support Risk Score is calculated as an <strong>early screening indicator</strong> to guide timely faculty tutoring and mentoring interventions. It does not constitute a definitive assessment or guaranteed prediction of academic failure, nor is it used for punitive determinations.
        </div>
      </div>

      {/* Factor Attribution Blueprint */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {weights.map((w, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white border border-[#EDF2F7] shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="text-xl mb-2">{w.icon}</div>
              <h4 className="text-xs font-bold text-[#202747]">{w.name}</h4>
              <p className="text-[10px] text-slate-500 mt-1">{w.benchmark}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Relative Weight</span>
              <span className="text-xs font-extrabold text-[#7965E8]">{w.weight}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mathematical Breakdown & Missing Data Normalization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EDF2F7] p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#202747] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#7965E8]" />
            <span>Mathematical Scoring Formulation</span>
          </h3>

          <div className="p-4 bg-[#F8F9FE] rounded-xl font-mono text-[11px] text-slate-700 space-y-2 border border-slate-200">
            <p className="font-bold text-[#7965E8]">
              RiskScore = &sum; [ FactorRisk(Indicator_i) &times; Weight_i ] / &sum; Weight_available &plus; TrendAdj
            </p>
            <p className="text-[10px] text-slate-500">
              Where FactorRisk maps linear penalties when indicator values sink under institutional warning thresholds.
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <p>
                <strong>Dynamic Missing Data Normalization:</strong> If a student has no previous GPA or missing lab marks, weights dynamically normalize across the remaining available indicators. Students are never falsely penalized for omitted optional fields.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <p>
                <strong>Momentum Modifier:</strong> A downward semester drop &gt;0.6 GPA applies an +8.0 risk flag. An upward bounce &gt;0.5 GPA grants a -6.0 resilience credit.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Threshold Bandwidth Reference */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EDF2F7] p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#202747] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#7965E8]" />
            <span>Institutional Support Tiers</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FEE2E2]/40 border border-[#FECACA] flex items-start justify-between">
              <div>
                <span className="font-extrabold text-[#DC2626]">High Risk Tier (Score &gt; 65)</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Mandatory faculty advisor assignment, debarment screening, weekly check-in required.
                </p>
              </div>
              <span className="font-mono font-bold text-xs text-[#DC2626] bg-white px-2 py-1 rounded-md shadow-xs">
                {data.summary.highRiskCount} Students
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A] flex items-start justify-between">
              <div>
                <span className="font-extrabold text-[#D97706]">Moderate Risk Tier (Score 35 – 65)</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Early warning watchlist, targeted peer tutoring referral, bi-weekly progress verification.
                </p>
              </div>
              <span className="font-mono font-bold text-xs text-[#D97706] bg-white px-2 py-1 rounded-md shadow-xs">
                {data.summary.moderateRiskCount} Students
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#D1FAE5]/40 border border-[#A7F3D0] flex items-start justify-between">
              <div>
                <span className="font-extrabold text-[#059669]">Low Risk Tier (Score &lt; 35)</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Academic standing in full compliance. Eligible for honors research and peer tutor roles.
                </p>
              </div>
              <span className="font-mono font-bold text-xs text-[#059669] bg-white px-2 py-1 rounded-md shadow-xs">
                {data.summary.performingWell} Students
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
