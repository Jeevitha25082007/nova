import React from 'react';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  SlidersHorizontal,
  HandHeart,
  Code2,
  Settings,
  Sparkles,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenCodeViewer: () => void;
  pendingInterventionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenSettings,
  onOpenCodeViewer,
  pendingInterventionsCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Student Directory', icon: Users },
    { id: 'analytics', label: 'Explainable AI Risk', icon: BrainCircuit },
    {
      id: 'interventions',
      label: 'Intervention Workflow',
      icon: HandHeart,
      badge: pendingInterventionsCount > 0 ? pendingInterventionsCount : undefined,
    },
    { id: 'simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#EAEFF5] flex flex-col fixed inset-y-0 left-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7965E8] to-[#9E8EFE] flex items-center justify-center text-white shadow-md shadow-[#7965E8]/25 ring-2 ring-[#E9E3FF]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#202747]">NOVA</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#E9E3FF] text-[#7965E8]">
                AI-SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Student Success Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
          Core Modules
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7965E8] text-white shadow-sm shadow-[#7965E8]/30 font-bold'
                  : 'text-slate-600 hover:bg-[#F4F1FE] hover:text-[#7965E8]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#7965E8]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[#FEE2E2] text-[#DC2626]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-6 px-3 mb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
          Developer & Admin
        </div>
        <button
          onClick={onOpenCodeViewer}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-[#DDEBFF] hover:text-[#2563EB] transition-all cursor-pointer"
        >
          <Code2 className="w-4 h-4 text-[#2563EB]" />
          <span>Python & SQLite Source</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-[#F4F1FE] hover:text-[#7965E8] transition-all cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Risk Thresholds Config</span>
        </button>
      </div>

      {/* Institution Campus Info Footer */}
      <div className="p-4 m-3 bg-[#F8F9FE] border border-[#EAEFF5] rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#DDEBFF] flex items-center justify-center text-[#2563EB]">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-[#202747] truncate">Faculty Council</p>
            <p className="text-[11px] text-slate-500">Fall Term • Active</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            SQLite Live
          </span>
          <span className="font-mono text-[10px] text-slate-400">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};
