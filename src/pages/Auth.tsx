import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const { user, loading, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Sign in form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Redirect if already authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signIn(signInEmail, signInPassword);
    
    if (error) {
      setError(error);
      toast.error(error);
    } else {
      toast.success('Welcome to HexWard!');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">HexWard</h1>
          <p className="text-muted-foreground mt-2">
            Secure AI Hospital Monitoring System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Access
            </CardTitle>
            <CardDescription>
              Sign in to access the HexWard monitoring dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p className="font-medium mb-1">Admin Demo Credentials:</p>
                <p>Email: admin@hexward.com</p>
                <p>Password: admin123</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>🔒 HIPAA Compliant • Secure • Encrypted</p>
          <p className="mt-2">Contact your administrator for account access</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;