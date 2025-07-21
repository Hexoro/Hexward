/**
 * Login page with role-based authentication
 */
import { useState } from "react";
import { Shield, Heart, Users, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginPageProps {
  onLogin: (role: 'doctor' | 'nurse' | 'admin') => void;
}

const roles = [
  { 
    id: 'doctor', 
    name: 'Doctor', 
    icon: Heart, 
    color: 'bg-primary',
    description: 'Full access to patient data and system controls'
  },
  { 
    id: 'nurse', 
    name: 'Nurse', 
    icon: Users, 
    color: 'bg-success',
    description: 'Access to patient care and monitoring tools'
  },
  { 
    id: 'admin', 
    name: 'Administrator', 
    icon: Shield, 
    color: 'bg-warning',
    description: 'System administration and configuration'
  }
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'nurse' | 'admin'>('doctor');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onLogin(selectedRole);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-medical rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">HexWard</h1>
          <p className="text-muted-foreground">AI Hospital Monitoring System</p>
        </div>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id as any)}
                      className={`p-4 border border-border rounded-lg text-left transition-all ${
                        selectedRole === role.id 
                          ? 'ring-2 ring-primary border-primary bg-primary/5' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 ${role.color} rounded-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{role.name}</p>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full medical-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  `Sign In as ${roles.find(r => r.id === selectedRole)?.name}`
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Username: <span className="font-mono">demo</span></p>
                <p>Password: <span className="font-mono">demo123</span></p>
                <p className="text-primary">Any credentials work for demo purposes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>HexWard v1.0 - AI-Powered Hospital Monitoring</p>
        </div>
      </div>
    </div>
  );
}