import React, { useState, useEffect } from 'react';
import { X, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';
import { fetchSettings, updateSettings } from '../api';

interface SettingsModalProps {
  onClose: () => void;
  onSettingsUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onSettingsUpdated,
}) => {
  const [thresholds, setThresholds] = useState({
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
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchSettings().then(data => {
      if (data.thresholds) {
        setThresholds(data.thresholds);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(thresholds);
      setToast('Thresholds updated and all cohort risk scores recalculated!');
      setTimeout(() => {
        setToast('');
        onSettingsUpdated();
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to update thresholds');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setThresholds({
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
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E9E3FF] text-[#7965E8] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#202747]">Configure Institutional Risk Thresholds</h3>
              <p className="text-[11px] text-slate-500">Fine-tune sensitivity for academic intervention triggers.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {toast && (
          <div className="p-3 bg-[#D1FAE5] text-[#065F46] rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Risk Brackets Cutoffs */}
          <div className="p-3.5 bg-[#F8F9FE] rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-[#202747] text-xs block">Overall Risk Score Cutoffs (0 - 100)</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Low Risk Upper Bound (Safe &le; X)</label>
                <input
                  type="number"
                  min="10"
                  max="50"
                  value={thresholds.lowRiskMax}
                  onChange={(e) => setThresholds({ ...thresholds, lowRiskMax: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Moderate Risk Upper Bound (&le; Y)</label>
                <input
                  type="number"
                  min="40"
                  max="80"
                  value={thresholds.moderateRiskMax}
                  onChange={(e) => setThresholds({ ...thresholds, moderateRiskMax: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold"
                />
              </div>
            </div>
          </div>

          {/* Indicator Thresholds */}
          <div className="space-y-3">
            <span className="font-bold text-[#202747] text-xs block">Institutional Warning & Critical Baselines</span>

            {/* Attendance */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Attendance Warning %</label>
                <input
                  type="number"
                  value={thresholds.attendanceWarning}
                  onChange={(e) => setThresholds({ ...thresholds, attendanceWarning: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Attendance Critical %</label>
                <input
                  type="number"
                  value={thresholds.attendanceCritical}
                  onChange={(e) => setThresholds({ ...thresholds, attendanceCritical: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold text-[#DC2626]"
                />
              </div>
            </div>

            {/* CGPA */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">CGPA Warning Level</label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.cgpaWarning}
                  onChange={(e) => setThresholds({ ...thresholds, cgpaWarning: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">CGPA Critical / Probation</label>
                <input
                  type="number"
                  step="0.1"
                  value={thresholds.cgpaCritical}
                  onChange={(e) => setThresholds({ ...thresholds, cgpaCritical: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold text-[#DC2626]"
                />
              </div>
            </div>

            {/* Marks */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Marks Warning %</label>
                <input
                  type="number"
                  value={thresholds.marksWarning}
                  onChange={(e) => setThresholds({ ...thresholds, marksWarning: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Marks Critical %</label>
                <input
                  type="number"
                  value={thresholds.marksCritical}
                  onChange={(e) => setThresholds({ ...thresholds, marksCritical: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none font-bold text-[#DC2626]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Institutional Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#7965E8] hover:bg-[#6752D8] text-white font-bold shadow-md shadow-[#7965E8]/25"
              >
                {saving ? 'Saving...' : 'Apply & Recalculate Cohort'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
