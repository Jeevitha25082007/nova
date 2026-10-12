# NOVA – AI-Powered Student Analytics and Success Platform

A full-stack student success and academic analytics platform built to help colleges analyze student academic performance, identify students who may need support, explain academic risk factors with transparent explainable AI, recommend personalized improvement plans, and track faculty interventions.

---

## 🎨 Color Palette & Design Constitution
- **Pastel Lavender:** `#E9E3FF`
- **Soft Blue:** `#DDEBFF`
- **Light Mint:** `#DDF5E8`
- **White Background / Surface:** `#FFFFFF`
- **Dark Navy Typography:** `#202747`
- **Accent Purple:** `#7965E8`

---

## 🌟 Key Features

1. **Executive Overview Dashboard**
   - Real-time KPIs calculated dynamically from SQLite database (Total students, Avg CGPA, Avg Attendance, At-Risk Counts, Pending Interventions).
   - High-fidelity visual charts: CGPA performance distribution, Attendance vs. Marks scatter analysis, Department-wise comparative analysis, and Semester-over-semester momentum trends.
   - Critical alert ticker highlighting high-risk students and real-time faculty intervention activity feed.

2. **Student Directory & Full CRUD Operations**
   - Search by name, student code, or email.
   - Filter by department, academic year (1-4), and risk bracket (Low, Moderate, High).
   - Create student modal with instant validation and risk score computation.
   - Edit student academic parameters and delete student with confirmation safeguard.
   - Pagination and dynamic table column sorting.

3. **Explainable AI Risk Engine (Transparent & Non-Blackbox)**
   - Configurable 0–100 academic risk score.
   - Multi-factor attribution: Classroom attendance (30%), Assessment performance (30%), Cumulative GPA (25%), Assignment completion (15%), and Semester Momentum trend modifier.
   - Dynamic missing data normalization (ensuring students missing non-mandatory fields are not unjustly penalized).
   - Plain-English breakdown showing exact point contributions, benchmark comparisons, and status flags (Safe, Warning, Critical).
   - Clearly labeled as an **Academic Screening Estimate**, not a definitive evaluation of ultimate human capability.

4. **Personalized Success Recommendations**
   - Data-grounded action plans generated dynamically from actual subject scores and attendance deficits.
   - Categorized by Attendance, Coursework, Mentorship, and Honors Enrichment.
   - Specific remediation timelines, suggested review dates, and priority tags.

5. **Student 360° Detailed Profile**
   - Comprehensive student view featuring historical GPA progression, subject marks breakdown, continuous assessment results, and attendance records.
   - Live inline recalculation form allowing faculty to update grades and immediately observe risk recalculation.

6. **Faculty Intervention Workflow**
   - Full lifecycle management for academic support (Pending -> In Progress -> Completed).
   - Assign faculty mentor, specify documented issue and action plan, set priority and deadline.
   - Add chronological follow-up notes and timestamped observations.
   - Track pre-intervention vs. post-intervention GPA outcomes to measure intervention efficacy.

7. **What-If Academic Simulator**
   - Interactive sliders for attendance, assessment marks, CGPA, and coursework completion.
   - Real-time delta comparison against student baseline without modifying permanent database records.
   - Projected recommendations if simulated targets are attained.
   - One-click reset button.

---

## 🚀 Quickstart Guide (Local Execution)

### Prerequisites
- Python 3.9+ (or Node.js 20+ for the unified React+Express build)
- SQLite3 (included with Python standard library)

### 1. Windows & VS Code Setup
```bash
# 1. Clone or navigate to the NOVA directory
cd NOVA

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS / Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Initialize and seed the database with realistic demo students
python seed.py

# 6. Start the Flask application
python app.py
```
Open your browser at: **`http://localhost:5000`**

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Aggregated metrics, charts data, critical alerts, and recent activities |
| `GET` | `/api/students` | List students with search, filters (`department`, `year`, `risk`), and pagination |
| `POST` | `/api/students` | Create new student record with validated inputs and automated risk scoring |
| `GET` | `/api/students/<id>` | Full student profile including subjects, academic records, and risk attribution |
| `PUT` | `/api/students/<id>` | Update student academic stats and trigger risk & recommendation recalculation |
| `DELETE` | `/api/students/<id>` | Permanently remove student and associated cascades |
| `GET` | `/api/students/<id>/risk` | Detailed factor breakdown and explainable AI report |
| `GET` | `/api/students/<id>/recommendations` | Personalized academic improvement plans |
| `GET` | `/api/interventions` | List faculty interventions with status and priority filters |
| `POST` | `/api/interventions` | Create a new intervention task assigned to faculty |
| `PUT` | `/api/interventions/<id>` | Update intervention status, outcome, or post-GPA |
| `POST` | `/api/interventions/<id>/notes` | Add follow-up note to an intervention |
| `POST` | `/api/simulate` | Run hypothetical What-If simulation without altering DB records |
| `GET` | `/api/faculty` | Directory of faculty mentors and departmental advisors |

---

## 🧪 Verification & Testing Checklist

- [x] **Database Initialization:** `seed.py` successfully seeds 22 students, 5 faculty, 40+ subject scores, and active interventions.
- [x] **Dashboard Metrics:** All numbers on the dashboard match exact SQLite query aggregations.
- [x] **CRUD Operations:** Adding, editing, and deleting students works seamlessly with real-time UI refresh.
- [x] **Explainable AI:** Tested with high-risk (Aiden Brooks, 54.2% att, 4.82 CGPA) and honors student (Ananya Sharma, 9.42 CGPA); scoring transparently surfaces contributing factors.
- [x] **Interventions:** Notes and status transitions (Pending -> In Progress -> Completed) persist in SQLite.
- [x] **What-If Simulator:** Modifying values updates the simulated risk score and delta without touching the permanent database record.
