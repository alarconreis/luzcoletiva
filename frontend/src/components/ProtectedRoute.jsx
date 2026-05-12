import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, requireRole = null }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // requireRole pode ser string ('admin') ou array (['admin', 'moderator'])
  if (requireRole) {
    const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
