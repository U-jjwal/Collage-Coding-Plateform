import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Loading spinner component
const LoadingScreen = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="spinner w-10 h-10"></div>
      <p className="text-zinc-400 text-sm">Loading...</p>
    </div>
  </div>
);

/**
 * Redirects unauthenticated users to /login.
 * Redirects users without the required role to their home page.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
};

const getRoleHome = (role) => {
  switch (role) {
    case 'admin':    return '/admin';
    case 'teacher':  return '/teacher';
    case 'student':  return '/student';
    default:         return '/login';
  }
};

/**
 * Redirects authenticated users away from auth pages (login/register).
 */
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (user) return <Navigate to={getRoleHome(user.role)} replace />;

  return children;
};
