"""
NOVA Student Success Platform - Database Access Layer (SQLite)
Manages connection pooling, schema migrations, and parameterized query execution.
"""

import os
import sqlite3
import json
from typing import Dict, Any, List, Optional, Tuple

DB_DIR = os.path.join(os.path.dirname(__file__), 'instance')
DB_PATH = os.path.join(DB_DIR, 'nova.db')


def get_db_connection() -> sqlite3.Connection:
    """Returns a thread-safe connection to the SQLite database with Row factory."""
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initializes all database tables with appropriate constraints."""
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR, exist_ok=True)

    conn = get_db_connection()
    with conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS Students (
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

            CREATE TABLE IF NOT EXISTS AcademicRecords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                semester INTEGER NOT NULL,
                gpa REAL NOT NULL,
                attendance_pct REAL NOT NULL,
                credits_enrolled INTEGER NOT NULL,
                credits_earned INTEGER NOT NULL,
                recorded_at TEXT NOT NULL,
                FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS SubjectPerformance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                subject_code TEXT NOT NULL,
                subject_name TEXT NOT NULL,
                internal_marks REAL NOT NULL,
                midterm_marks REAL NOT NULL,
                total_marks REAL NOT NULL,
                grade TEXT NOT NULL,
                attendance_pct REAL NOT NULL,
                status TEXT NOT NULL,
                FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Faculty (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                department TEXT NOT NULL,
                role TEXT NOT NULL,
                avatar_color TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Interventions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                faculty_id INTEGER,
                issue TEXT NOT NULL,
                action_plan TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                due_date TEXT NOT NULL,
                pre_gpa REAL,
                post_gpa REAL,
                outcome TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
                FOREIGN KEY (faculty_id) REFERENCES Faculty(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS FollowUpNotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                intervention_id INTEGER NOT NULL,
                author_name TEXT NOT NULL,
                note TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (intervention_id) REFERENCES Interventions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                identified_issue TEXT NOT NULL,
                explanation TEXT NOT NULL,
                recommended_action TEXT NOT NULL,
                priority TEXT NOT NULL,
                suggested_review_date TEXT NOT NULL,
                status TEXT NOT NULL,
                category TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
        """)
    conn.close()
