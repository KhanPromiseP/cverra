import { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router';
import { useUser } from '@/client/services/user';
import { toast } from 'sonner';

export const AdminGuard: React.FC = () => {
  const { user, loading } = useUser();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has admin role
    if (!loading && user) {
      // Temporary type assertion until role is properly typed
      const userWithRole = user as any;
      const isAdmin = userWithRole?.role === 'ADMIN' || userWithRole?.role === 'SUPER_ADMIN';
      
      if (!isAdmin) {
        toast.error('Access denied. Admin privileges required.');
      }
      
      setIsChecking(false);
    } else if (!loading && !user) {
      // No user logged in
      setIsChecking(false);
    }
  }, [user, loading]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  const userWithRole = user as any;
  const isAdmin = userWithRole?.role === 'ADMIN' || userWithRole?.role === 'SUPER_ADMIN';

  if (!user || !isAdmin) {
    // Redirect to dashboard with error message
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  // Render child routes using Outlet
  return <Outlet />;
};