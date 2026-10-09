import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';

import { Login } from './pages/Login';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { Step1LoanApp } from './pages/Step1LoanApp';
import { Step2Ekyc } from './pages/Step2Ekyc';
import { Step3Documents } from './pages/Step3Documents';
import { Step4Underwriting } from './pages/Step4Underwriting';
import { Step5OfficerReview } from './pages/Step5OfficerReview';
import { Step6Agreement } from './pages/Step6Agreement';
import { Step7EStamp } from './pages/Step7EStamp';
import { Step8ESign } from './pages/Step8ESign';
import { Step9Disbursement } from './pages/Step9Disbursement';
import { PaperlessOffice } from './pages/PaperlessOffice';
import { SignedPdfView } from './pages/SignedPdfView';
import { NotificationsPage } from './pages/NotificationsPage';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  React.useEffect(() => {
    if (user?.role === 'OFFICER' && activeTab === 'dashboard') {
      setActiveTab('officer-dashboard');
    } else if (user?.role === 'CUSTOMER' && activeTab === 'officer-dashboard') {
      setActiveTab('dashboard');
    }
  }, [user]);

  if (!user) {
    return <Login setActiveTab={setActiveTab} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CustomerDashboard setActiveTab={setActiveTab} />;
      case 'apply':
      case 'my-loans':
        return <Step1LoanApp setActiveTab={setActiveTab} />;
      case 'ekyc':
        return <Step2Ekyc setActiveTab={setActiveTab} />;
      case 'documents':
        return <Step3Documents setActiveTab={setActiveTab} />;
      case 'underwriting':
        return <Step4Underwriting setActiveTab={setActiveTab} />;
      case 'officer-dashboard':
        return <Step5OfficerReview setActiveTab={setActiveTab} />;
      case 'agreement':
        return <Step6Agreement setActiveTab={setActiveTab} />;
      case 'estamp':
        return <Step7EStamp setActiveTab={setActiveTab} />;
      case 'esign':
        return <Step8ESign setActiveTab={setActiveTab} />;
      case 'disbursement':
        return <Step9Disbursement setActiveTab={setActiveTab} />;
      case 'signed-pdfs':
        return (
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
              SIGNED LOAN AGREEMENTS REPOSITORY
            </h2>
            <SignedPdfView />
          </div>
        );
      case 'paperless':
        return <PaperlessOffice />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return (
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
              USER PROFILE & ACCOUNT SETTINGS
            </h2>
            <div className="form-grid">
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> {user.role}</div>
            </div>
          </div>
        );
      default:
        return <CustomerDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Header />
        <main className="page-body">
          {renderContent()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
