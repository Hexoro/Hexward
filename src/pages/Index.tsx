/**
 * HexWard - AI Hospital Monitoring Dashboard
 * Main application entry point with secure routing
 */
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import OverviewPage from "@/components/OverviewPage";
import PatientsPage from "@/components/PatientsPage";
import LiveFeedsPage from "@/components/LiveFeedsPage";
import AlertsPage from "@/components/AlertsPage";
import ReportsPage from "@/components/ReportsPage";
import SettingsPage from "@/components/SettingsPage";
import CameraSettingsPage from "@/components/CameraSettingsPage";
import { Loader2 } from "lucide-react";

type Page = 'overview' | 'patients' | 'feeds' | 'cameras' | 'alerts' | 'reports' | 'settings';

const Index = () => {
  const { profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('overview');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'patients':
        return <PatientsPage />;
      case 'feeds':
        return <LiveFeedsPage />;
      case 'cameras':
        return <CameraSettingsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  // Map role types for DashboardLayout
  const getMappedRole = (role: string): 'doctor' | 'nurse' | 'admin' => {
    if (role === 'admin') return 'admin';
    if (role === 'remote_doctor') return 'doctor';
    return 'nurse';
  };

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      userRole={getMappedRole(profile.role)}
    >
      {renderPage()}
    </DashboardLayout>
  );
};

export default Index;
