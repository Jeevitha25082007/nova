import React, { useState } from 'react';
import { Search, Bell, ShieldCheck, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Student } from '../types';

interface HeaderProps {
  onSearchSelect?: (studentId: number) => void;
  allStudents?: Student[];
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchSelect,
  allStudents = [],
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const filteredQuickStudents = searchTerm.trim()
    ? allStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <header className="h-18 bg-white border-b border-[#EAEFF5] px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="relative w-96">
        <div className="flex items-center gap-2.5 bg-[#F8F9FE] border border-[#E2E8F0] px-3.5 py-2 rounded-xl focus-within:border-[#7965E8] focus-within:ring-2 focus-within:ring-[#E9E3FF] transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students by name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-[#202747] w-full placeholder:text-slate-400 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Search Dropdown */}
        {searchTerm.trim().length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-2 z-50">
            {filteredQuickStudents.length > 0 ? (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                  Matching Students
                </div>
                {filteredQuickStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (onSearchSelect) onSearchSelect(s.id);
                      setSearchTerm('');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#F4F1FE] text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#202747]">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {s.student_id} • {s.department}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.risk_category === 'High'
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : s.risk_category === 'Moderate'
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : 'bg-[#D1FAE5] text-[#059669]'
                      }`}
                    >
                      {s.risk_category} Risk
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-500">
                No matching student records found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 bg-[#7965E8] hover:bg-[#6752D8] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-[#7965E8]/20 transition-all cursor-pointer"
        >
          <span>+ Enroll New Student</span>
        </button>

        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-[#E2E8F0] hover:bg-[#F8F9FE] flex items-center justify-center text-slate-600 relative cursor-pointer transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#EF4444] absolute top-2 right-2"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-[#202747]">System Alerts & Actions</span>
                <span className="text-[10px] bg-[#E9E3FF] text-[#7965E8] px-2 py-0.5 rounded-full font-bold">
                  Live
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FEE2E2]/50 text-slate-700">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#DC2626] text-[11px]">Academic Probation Alert</p>
                    <p className="text-[11px] text-slate-600">Aiden Brooks dropped below 55% attendance threshold.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#DDF5E8]/60 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#059669] text-[11px]">Intervention Succeeded</p>
                    <p className="text-[11px] text-slate-600">Kavita Sundaram recovered GPA by +0.75 points post review.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#DDEBFF]/60 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#2563EB] text-[11px]">Database Integrity</p>
                    <p className="text-[11px] text-slate-600">SQLite sync active. Auto-backup snapshot verified.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Faculty Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-[#E9E3FF] text-[#7965E8] flex items-center justify-center font-bold text-xs ring-2 ring-[#7965E8]/20">
            SM
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-[#202747] leading-none">Dr. Sarah Mitchell</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Faculty Academic Dean</p>
          </div>
        </div>
      </div>
    </header>
  );
};
