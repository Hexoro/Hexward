// =================================================================
// HEXWARD - ALL COMPONENTS CONSOLIDATED
// Complete React TypeScript Component Reference
// =================================================================
// This file contains all React components used in the HexWard project
// Organized by functionality for easy reference and recreation
// =================================================================

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { 
  Activity, 
  AlertTriangle, 
  Bell, 
  Camera, 
  Check, 
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Heart,
  Home,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  Video,
  X
} from 'lucide-react';

// =================================================================
// TYPES AND INTERFACES
// =================================================================

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'nurse' | 'remote_doctor' | 'remote_worker';
}

interface Patient {
  id: string;
  name: string;
  age?: number;
  room?: string;
  status: 'stable' | 'critical' | 'monitoring';
  admission_date?: string;
  conditions?: string[];
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSat?: number;
  };
  summary?: string;
  notes?: string;
  image_url?: string;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  room: string;
  patient_id?: string;
  priority: number;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

interface CameraFeed {
  id: string;
  name: string;
  camera_id: string;
  room: string;
  stream_url?: string;
  status: 'active' | 'offline' | 'maintenance';
  recording: boolean;
  ai_monitoring_enabled: boolean;
  last_motion_detected?: string;
}

interface AIDetection {
  id: string;
  camera_id: string;
  room: string;
  detection_type: string;
  confidence: number;
  bounding_box?: object;
  metadata?: object;
  gpt_analysis?: string;
  processed_by_gpt: boolean;
  alert_generated: boolean;
  timestamp: string;
}

// =================================================================
// AUTHENTICATION CONTEXT
// =================================================================

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check current session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser(profile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// =================================================================
// PROTECTED ROUTE COMPONENT
// =================================================================

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// =================================================================
// LOGIN PAGE
// =================================================================

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (error) {
      // Error is handled in the signIn function
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    const demoAccounts = {
      admin: { email: 'admin@hexward.com', password: 'admin123' },
      nurse: { email: 'nurse@hexward.com', password: 'nurse123' },
      doctor: { email: 'doctor@hexward.com', password: 'doctor123' }
    };

    const account = demoAccounts[role as keyof typeof demoAccounts];
    if (account) {
      setEmail(account.email);
      setPassword(account.password);
      setLoading(true);
      try {
        await signIn(account.email, account.password);
        navigate('/');
      } catch (error) {
        // Error handled in signIn
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">HexWard</h2>
          <p className="mt-2 text-sm text-gray-600">AI Hospital Monitoring System</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              onClick={() => handleDemoLogin('admin')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Admin
            </button>
            <button
              onClick={() => handleDemoLogin('nurse')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Nurse
            </button>
            <button
              onClick={() => handleDemoLogin('doctor')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// DASHBOARD LAYOUT
// =================================================================

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Overview', href: '/', icon: Home },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Live Feeds', href: '/live-feeds', icon: Camera },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-sm transition-all duration-300`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className={`font-bold text-xl text-gray-900 ${!sidebarOpen && 'hidden'}`}>
              HexWard
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md text-gray-500 hover:text-gray-900"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 h-5 w-5`}
                  />
                  {sidebarOpen && item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t">
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
              <div className={`${!sidebarOpen && 'hidden'}`}>
                <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className={`${sidebarOpen ? 'ml-auto' : ''} p-2 text-gray-400 hover:text-gray-600 transition-colors`}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// =================================================================
// OVERVIEW PAGE
// =================================================================

const OverviewPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalAlerts: 0,
    activeCameras: 0,
    recentEvents: 0
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch patients
      const { data: patients } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch camera feeds
      const { data: cameras } = await supabase
        .from('camera_feeds')
        .select('*')
        .eq('status', 'active');

      // Fetch critical alerts count
      const { count: criticalCount } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'critical')
        .eq('resolved', false);

      setStats({
        totalPatients: patients?.length || 0,
        criticalAlerts: criticalCount || 0,
        activeCameras: cameras?.length || 0,
        recentEvents: alerts?.length || 0
      });

      setRecentAlerts(alerts || []);
      setRecentPatients(patients || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const statCards = [
    { name: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'bg-blue-500' },
    { name: 'Critical Alerts', value: stats.criticalAlerts, icon: AlertTriangle, color: 'bg-red-500' },
    { name: 'Active Cameras', value: stats.activeCameras, icon: Camera, color: 'bg-green-500' },
    { name: 'Recent Events', value: stats.recentEvents, icon: Activity, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Alerts and Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center space-x-3 p-3 border rounded-md">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-500">{alert.room}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(parseISO(alert.created_at), 'HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Patients</h3>
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center space-x-3 p-3 border rounded-md">
                  <div className={`w-2 h-2 rounded-full ${
                    patient.status === 'critical' ? 'bg-red-500' :
                    patient.status === 'monitoring' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.room}</p>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {patient.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// PATIENTS PAGE
// =================================================================

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.room?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'monitoring':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <button
          onClick={() => setShowAddDialog(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Age:</span>
                    <span>{patient.age || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Room:</span>
                    <span>{patient.room || 'N/A'}</span>
                  </div>
                  {patient.vitals && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Vitals</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {patient.vitals.heartRate && (
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            <span>{patient.vitals.heartRate} bpm</span>
                          </div>
                        )}
                        {patient.vitals.oxygenSat && (
                          <div>
                            <span>O2: {patient.vitals.oxygenSat}%</span>
                          </div>
                        )}
                        {patient.vitals.temperature && (
                          <div>
                            <span>Temp: {patient.vitals.temperature}°F</span>
                          </div>
                        )}
                        {patient.vitals.bloodPressure && (
                          <div>
                            <span>BP: {patient.vitals.bloodPressure}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =================================================================
// ALERTS PAGE
// =================================================================

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        fetchAlerts(); // Refresh alerts when changes occur
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        if (filter === 'unresolved') {
          query = query.eq('resolved', false);
        } else {
          query = query.eq('type', filter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: "Alert Acknowledged",
        description: "Alert has been acknowledged successfully.",
      });
      
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert.",
        variant: "destructive",
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: "Alert Resolved",
        description: "Alert has been resolved successfully.",
      });
      
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert.",
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Alerts</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className={`border-l-4 p-4 rounded-md ${getAlertColor(alert.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{alert.room}</span>
                      <span>{format(parseISO(alert.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      {alert.acknowledged && (
                        <span className="text-green-600">✓ Acknowledged</span>
                      )}
                      {alert.resolved && (
                        <span className="text-green-600">✓ Resolved</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                    >
                      Acknowledge
                    </button>
                  )}
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {alerts.length === 0 && (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
              <p className="mt-1 text-sm text-gray-500">No alerts match the current filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =================================================================
// LIVE FEEDS PAGE
// =================================================================

const LiveFeedsPage: React.FC = () => {
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>([]);
  const [aiDetections, setAiDetections] = useState<AIDetection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCameraFeeds();
    fetchAiDetections();
  }, []);

  const fetchCameraFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('camera_feeds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCameraFeeds(data || []);
    } catch (error) {
      console.error('Error fetching camera feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiDetections = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_detections')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAiDetections(data || []);
    } catch (error) {
      console.error('Error fetching AI detections:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Live Camera Feeds</h1>
        <div className="text-sm text-gray-500">
          {cameraFeeds.filter(c => c.status === 'active').length} active cameras
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {cameraFeeds.map((camera) => (
            <div key={camera.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Live Feed</p>
                  <p className="text-xs opacity-50">{camera.name}</p>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">{camera.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(camera.status)}`}>
                    {camera.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Room:</span>
                    <span>{camera.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recording:</span>
                    <span>{camera.recording ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Monitoring:</span>
                    <span>{camera.ai_monitoring_enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent AI Detections */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent AI Detections</h3>
          <div className="space-y-3">
            {aiDetections.map((detection) => (
              <div key={detection.id} className="flex items-center space-x-3 p-3 border rounded-md">
                <div className="flex-shrink-0">
                  <Activity className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {detection.detection_type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">{detection.room} • Confidence: {Math.round(detection.confidence * 100)}%</p>
                  {detection.gpt_analysis && (
                    <p className="text-xs text-gray-600 mt-1">{detection.gpt_analysis}</p>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {format(parseISO(detection.timestamp), 'HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// REPORTS PAGE
// =================================================================

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Generate Report</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports available</h3>
              <p className="mt-1 text-sm text-gray-500">Generate your first report to get started.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================================================
// SETTINGS PAGE
// =================================================================

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    department: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email || '',
        department: '',
        phone: ''
      });
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profile Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// MAIN APP COMPONENT
// =================================================================

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/patients" element={<PatientsPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/live-feeds" element={<LiveFeedsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;

// =================================================================
// COMPONENT SUMMARY
// =================================================================
/*
✅ WORKING COMPONENTS:
- AuthProvider & Authentication Context
- Protected Route with loading states
- Login Page with demo accounts
- Dashboard Layout with responsive sidebar
- Overview Page with real-time stats
- Patients Page with search and filtering
- Alerts Page with real-time updates
- Live Feeds Page with camera status
- Reports Page (placeholder)
- Settings Page with profile management

🔧 FEATURES IMPLEMENTED:
- Role-based authentication (admin, nurse, doctor)
- Real-time data with Supabase subscriptions
- Responsive design with Tailwind CSS
- Toast notifications for user feedback
- Search and filtering capabilities
- CRUD operations for patients and alerts
- File upload support for patient images
- Mock camera feeds with AI detection display

📦 DEPENDENCIES REQUIRED:
- React Router DOM
- Supabase client
- Lucide React icons
- Date-fns for formatting
- Custom toast hook
- Tailwind CSS for styling

🎯 DEMO ACCOUNTS:
- admin@hexward.com / admin123
- nurse@hexward.com / nurse123  
- doctor@hexward.com / doctor123
*/