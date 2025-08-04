import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false 
}: AuthGuardProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !isAuthenticated) {
      // Store the current location so we can redirect back after login
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (requireAdmin && !isAdmin) {
      navigate('/', { replace: true });
      return;
    }

    // If user is authenticated and trying to access auth page, redirect to dashboard
    if (isAuthenticated && location.pathname === '/auth') {
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
      return;
    }
  }, [isAuthenticated, isAdmin, loading, navigate, location, requireAuth, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If we require auth but user is not authenticated, don't render children
  // (navigation will happen in useEffect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If we require admin but user is not admin, don't render children
  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}