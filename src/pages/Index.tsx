/**
 * HexWard - AI Hospital Monitoring Dashboard
 * Main application entry point with authentication and routing
 */
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import OverviewPage from "@/components/OverviewPage";
import PatientsPage from "@/components/PatientsPage";
import LiveFeedsPage from "@/components/LiveFeedsPage";
import AlertsPage from "@/components/AlertsPage";
import LoginPage from "@/components/LoginPage";

type UserRole = 'doctor' | 'nurse' | 'admin';
type Page = 'overview' | 'patients' | 'feeds' | 'alerts' | 'reports' | 'settings';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('doctor');
  const [currentPage, setCurrentPage] = useState<Page>('overview');

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'patients':
        return <PatientsPage />;
      case 'feeds':
        return <LiveFeedsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'reports':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Reports page coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Settings page coming soon...</p>
          </div>
        );
      default:
        return <OverviewPage />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      userRole={userRole}
    >
      {renderPage()}
    </DashboardLayout>
  );
};

export default Index;
