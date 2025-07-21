/**
 * Main dashboard layout with sidebar navigation
 */
import { useState } from "react";
import { 
  Activity, 
  Users, 
  Camera, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Menu,
  Shield,
  Heart,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: 'doctor' | 'nurse' | 'admin';
}

const navigation = [
  { name: 'Overview', id: 'overview', icon: Activity, roles: ['doctor', 'nurse', 'admin'] },
  { name: 'Patients', id: 'patients', icon: Users, roles: ['doctor', 'nurse', 'admin'] },
  { name: 'Live Feeds', id: 'feeds', icon: Camera, roles: ['doctor', 'nurse', 'admin'] },
  { name: 'Alerts', id: 'alerts', icon: AlertTriangle, roles: ['doctor', 'nurse', 'admin'] },
  { name: 'Reports', id: 'reports', icon: FileText, roles: ['doctor', 'admin'] },
  { name: 'Settings', id: 'settings', icon: Settings, roles: ['admin'] },
];

const roleColors = {
  doctor: 'bg-primary',
  nurse: 'bg-success',
  admin: 'bg-warning'
};

export default function DashboardLayout({ children, currentPage, onNavigate, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredNavigation = navigation.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}>
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-medical rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-sidebar-foreground">HexWard</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${roleColors[userRole]} rounded-full flex items-center justify-center`}>
              {userRole === 'doctor' && <Heart className="w-5 h-5 text-white" />}
              {userRole === 'nurse' && <Users className="w-5 h-5 text-white" />}
              {userRole === 'admin' && <Shield className="w-5 h-5 text-white" />}
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">Dr. Sarah Chen</p>
                <p className="text-xs text-sidebar-foreground/70 capitalize">{userRole}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="sidebar-nav">
            {filteredNavigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`nav-item w-full ${currentPage === item.id ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Quick Stats */}
        {sidebarOpen && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sidebar-foreground/70">Active Patients</span>
                <span className="text-sidebar-foreground font-medium">24</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-sidebar-foreground/70">Critical Alerts</span>
                <span className="text-destructive font-medium">3</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-sidebar-foreground/70">Staff Online</span>
                <span className="text-success font-medium">12</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground capitalize">
                {currentPage.replace(/([A-Z])/g, ' $1').trim()}
              </h2>
              <p className="text-muted-foreground">
                Real-time hospital monitoring system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="status-indicator bg-success"></div>
                <span className="text-sm text-muted-foreground">System Online</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}