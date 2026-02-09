import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // Once auth has initialized and the user is already authenticated,
  // keep them away from the login page.
  if (!isAuthLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await login(email, password);
      if (error) {
        toast.error(error.message || 'Invalid credentials');
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(222_47%_11%)_0%,hsl(222_47%_20%)_100%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="animate-slide-down">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent animate-pulse-soft">
                <span className="text-2xl font-bold text-accent-foreground">F</span>
              </div>
              <span className="text-2xl font-semibold">FinEcho</span>
            </div>
          </div>

          <div className="space-y-6 animate-slide-up">
            <h1 className="text-4xl font-bold leading-tight">
              AI-Powered Advisory<br />Documentation
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Transform your client conversations into structured, compliance-ready records.
              FinEcho listens, understands, and protects your advisory practice.
            </p>
          </div>

          <div className="flex items-center gap-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="hover-lift">
              <p className="text-3xl font-bold">10k+</p>
              <p className="text-sm text-primary-foreground/70">Calls Processed</p>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div className="hover-lift" style={{ animationDelay: '100ms' }}>
              <p className="text-3xl font-bold">99.9%</p>
              <p className="text-sm text-primary-foreground/70">Accuracy Rate</p>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div className="hover-lift" style={{ animationDelay: '200ms' }}>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-primary-foreground/70">Advisors</p>
            </div>
          </div>
        </div>

        {/* Decorative elements with animation */}
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-12 h-64 w-64 rounded-full bg-accent/5 blur-2xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/4 h-32 w-32 rounded-full bg-primary-foreground/5 blur-2xl animate-pulse-soft" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">F</span>
              </div>
              <span className="text-xl font-semibold">FinEcho</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Advisor Login</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your advisory dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email or Advisor ID</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="advisor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 input-elevated"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 input-elevated"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            For advisor access only. Contact support for account issues.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
