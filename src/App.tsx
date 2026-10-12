/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { StudentProfileModal } from './components/StudentProfileModal';
import { AnalyticsView } from './components/AnalyticsView';
import { InterventionsView } from './components/InterventionsView';
import { SimulatorView } from './components/SimulatorView';
import { SettingsModal } from './components/SettingsModal';
import { CodeViewerModal } from './components/CodeViewerModal';
import { fetchDashboard, fetchStudents } from './api';
import { DashboardData, Student } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // Modals & Sub-views
  const [selectedProfileStudentId, setSelectedProfileStudentId] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showCodeViewerModal, setShowCodeViewerModal] = useState<boolean>(false);
  const [initialStudentForSimulator, setInitialStudentForSimulator] = useState<Student | null>(null);
  const [initialStudentForIntervention, setInitialStudentForIntervention] = useState<Student | null>(null);
  const [openAddStudentInDirectory, setOpenAddStudentInDirectory] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [dash, studs] = await Promise.all([
        fetchDashboard(),
        fetchStudents({ limit: 100 }),
      ]);
      setDashboardData(dash);
      setAllStudents(studs.students);
    } catch (err) {
      console.error('Error fetching platform data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenStudentProfile = (id: number) => {
    setSelectedProfileStudentId(id);
  };

  const handleLaunchSimulatorForStudent = (student: Student) => {
    setInitialStudentForSimulator(student);
    setCurrentTab('simulator');
  };

  const handleLaunchInterventionForStudent = (student: Student) => {
    setInitialStudentForIntervention(student);
    setCurrentTab('interventions');
  };

  const handleAddStudentClick = () => {
    setCurrentTab('students');
    setOpenAddStudentInDirectory(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex text-[#202747]">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'simulator') setInitialStudentForSimulator(null);
          if (tab !== 'interventions') setInitialStudentForIntervention(null);
        }}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenCodeViewer={() => setShowCodeViewerModal(true)}
        pendingInterventionsCount={dashboardData?.summary.pendingInterventions || 0}
      />

      {/* Main Body Area */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <Header
          allStudents={allStudents}
          onSearchSelect={handleOpenStudentProfile}
          onOpenAddModal={handleAddStudentClick}
        />

        {/* Content View Container */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              loading={loadingDashboard}
              onOpenStudent={handleOpenStudentProfile}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAddModal={handleAddStudentClick}
            />
          )}

          {currentTab === 'students' && (
            <StudentsView
              onOpenStudent={handleOpenStudentProfile}
              onRefreshDashboard={loadData}
              initialAddModalOpen={openAddStudentInDirectory}
              onCloseAddModal={() => setOpenAddStudentInDirectory(false)}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              data={dashboardData}
              onOpenStudent={handleOpenStudentProfile}
              onOpenSettings={() => setShowSettingsModal(true)}
            />
          )}

          {currentTab === 'interventions' && (
            <InterventionsView
              onOpenStudent={handleOpenStudentProfile}
              onRefreshDashboard={loadData}
              initialStudentForIntervention={initialStudentForIntervention}
              onClearInitialStudent={() => setInitialStudentForIntervention(null)}
            />
          )}

          {currentTab === 'simulator' && (
            <SimulatorView
              initialStudent={initialStudentForSimulator}
              onOpenStudentProfile={handleOpenStudentProfile}
            />
          )}
        </main>
      </div>

      {/* 360° Student Profile Modal */}
      {selectedProfileStudentId !== null && (
        <StudentProfileModal
          studentId={selectedProfileStudentId}
          onClose={() => setSelectedProfileStudentId(null)}
          onOpenSimulatorForStudent={handleLaunchSimulatorForStudent}
          onOpenInterventionModal={handleLaunchInterventionForStudent}
          onStudentUpdated={loadData}
        />
      )}

      {/* Thresholds Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSettingsUpdated={loadData}
        />
      )}

      {/* Codebase Inspector Modal */}
      {showCodeViewerModal && (
        <CodeViewerModal
          onClose={() => setShowCodeViewerModal(false)}
        />
      )}
    </div>
  );
}
