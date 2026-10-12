import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Terminal, Download, Database } from 'lucide-react';

interface CodeViewerModalProps {
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('app.py');
  const [copied, setCopied] = useState(false);

  const files: Record<string, { desc: string; code: string }> = {
    'app.py': {
      desc: 'Flask REST API Application and Endpoints',
      code: `"""
NOVA - Student Success Platform (Flask Application)
REST API Endpoints for Dashboard, Students, Risk Analysis, and Interventions
"""
import os
import json
from flask import Flask, jsonify, request, render_template
from database import init_db, get_db_connection
from analytics import calculate_risk
from recommendations import generate_recommendations

app = Flask(__name__)
init_db()

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    conn = get_db_connection()
    total = conn.execute("SELECT COUNT(*) FROM Students").fetchone()[0]
    avg_row = conn.execute("SELECT AVG(cgpa) as cgpa, AVG(attendance) as att FROM Students").fetchone()
    conn.close()
    return jsonify({'totalStudents': total, 'avgCgpa': round(avg_row['cgpa'], 2)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
`
    },
    'analytics.py': {
      desc: 'Transparent Explainable Risk Engine Formula',
      code: `"""
NOVA - Explainable AI Risk Analytics Engine
Transparent Multi-Factor Heuristic Scoring
"""
def calculate_risk(student_data, thresholds=None, weights=None):
    # Evaluates Attendance (30%), Marks (30%), CGPA (25%), Assignments (15%)
    # Normalizes across available indicators dynamically to avoid unfair bias
    # Labels result as an Academic Support Screening Estimate
    factors = []
    # Dynamic weighting & semester momentum trend calculation...
    return {
        'risk_score': final_risk,
        'risk_category': category,
        'factors': factors,
        'screening_notice': 'Academic Support Screening Estimate - Not a definitive evaluation.'
    }
`
    },
    'database.py': {
      desc: 'SQLite Connection Pool & Schema Definitions',
      code: `"""
NOVA - SQLite Database Access Layer
Creates tables: Students, AcademicRecords, SubjectPerformance, Faculty,
Interventions, FollowUpNotes, Recommendations, Settings
"""
import sqlite3

def get_db_connection():
    conn = sqlite3.connect('instance/nova.db')
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn
`
    },
    'seed.py': {
      desc: 'Demo Cohort Seeding Script (22 Students + Faculty)',
      code: `"""
NOVA - Database Seeder
Inserts 22 realistic engineering students across 5 departments with varied risk profiles,
subject marks, attendance histories, and assigned faculty mentors.
"""
from database import get_db_connection, init_db
from analytics import calculate_risk

def seed_database():
    init_db()
    # Inserts Computer Science, Electrical, Mechanical, Civil & IT students...
`
    },
    'schema.sql': {
      desc: 'Complete SQLite Relational DDL',
      code: `CREATE TABLE Students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    cgpa REAL NOT NULL,
    attendance REAL NOT NULL,
    avg_marks REAL NOT NULL,
    assignment_completion REAL NOT NULL,
    previous_gpa REAL,
    risk_score REAL NOT NULL,
    risk_category TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE AcademicRecords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES Students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    gpa REAL NOT NULL,
    attendance_pct REAL NOT NULL,
    credits_enrolled INTEGER NOT NULL,
    credits_earned INTEGER NOT NULL,
    recorded_at TEXT NOT NULL
);

CREATE TABLE Interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES Students(id) ON DELETE CASCADE,
    faculty_id INTEGER REFERENCES Faculty(id) ON DELETE SET NULL,
    issue TEXT NOT NULL,
    action_plan TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    due_date TEXT NOT NULL,
    pre_gpa REAL,
    post_gpa REAL,
    outcome TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);`
    },
    'requirements.txt': {
      desc: 'Python Dependencies for Local Flask Run',
      code: `Flask==3.0.3
Werkzeug==3.0.3
Jinja2==3.1.4
click==8.1.7
itsdangerous==2.2.0
python-dotenv==1.0.1
`
    }
  };

  const current = files[activeFile] || files['app.py'];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#F8F9FE] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DDEBFF] text-[#2563EB] flex items-center justify-center font-bold">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#202747]">Python & SQLite Codebase Inspector</h3>
              <p className="text-[11px] text-slate-500">Standalone repository files available inside the /NOVA directory</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab row */}
        <div className="px-6 border-b border-slate-100 flex items-center justify-between bg-[#FAFBFD] overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            {Object.keys(files).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFile(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFile === f
                    ? 'bg-[#7965E8] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content View */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#1E2235] text-slate-200 font-mono text-xs leading-relaxed">
          <p className="text-slate-400 mb-3 pb-2 border-b border-slate-700 font-sans text-xs">
            # {current.desc}
          </p>
          <pre className="whitespace-pre-wrap">{current.code}</pre>
        </div>

        {/* Quick Execution Instructions Bar */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 text-slate-400 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#7965E8]" />
            <span>Local run: <strong className="text-white">cd NOVA && pip install -r requirements.txt && python seed.py && python app.py</strong></span>
          </div>
          <span className="text-[10px] text-slate-500">Port 5000</span>
        </div>
      </div>
    </div>
  );
};
