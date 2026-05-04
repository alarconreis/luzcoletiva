import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import HelpRequests from './pages/HelpRequests.jsx';
import MyRequests from './pages/MyRequests.jsx';
import HelpRequestDetail from './pages/HelpRequestDetail.jsx';
import VerifyIdentity from './pages/VerifyIdentity.jsx';
import ComoFunciona from './pages/ComoFunciona.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/help-requests" element={<ProtectedRoute><HelpRequests /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
          <Route path="/help-requests/:id" element={<ProtectedRoute><HelpRequestDetail /></ProtectedRoute>} />
          <Route path="/verify-identity" element={<ProtectedRoute><VerifyIdentity /></ProtectedRoute>} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route
            path="*"
            element={
              <div className="max-w-2xl mx-auto px-6 py-32 text-center">
                <h1 className="font-display font-bold text-6xl text-ink-900">404</h1>
                <p className="mt-4 font-body text-ink-700">Esta página ainda não foi iluminada.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
