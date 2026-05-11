'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/app/lib/api';

/**
 * SecretAdminAccess Component
 * 
 * Provides a keyboard shortcut (Ctrl+Shift+A) to access admin panel from anywhere.
 * - If already logged in as admin: navigates directly to admin dashboard
 * - If logged in as non-admin: shows "Access Denied" message
 * - If not logged in: shows admin login modal
 */
export default function SecretAdminAccess() {
  const [showModal, setShowModal] = useState(false);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Shift+A (Windows/Linux) or Cmd+Shift+A (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSecretAccess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSecretAccess = () => {
    const user = getUser();
    
    if (user) {
      if (user.role === 'admin') {
        // Already logged in as admin - go straight to dashboard
        router.push('/admin');
      } else {
        // Logged in but not admin - show logout prompt
        setCurrentUser(user);
        setShowLogoutPrompt(true);
      }
    } else {
      // Not logged in - show login modal
      setShowModal(true);
    }
  };

  const handleLogoutAndShowLogin = () => {
    // Clear current auth
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Close logout prompt and show login modal
    setShowLogoutPrompt(false);
    setShowModal(true);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        throw new Error('Access denied: Admin privileges required');
      }

      // Store auth
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Navigate to admin dashboard
      setShowModal(false);
      router.push('/admin');
      
      // Reload to update navbar/auth state
      setTimeout(() => window.location.reload(), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowLogoutPrompt(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  if (!showModal && !showLogoutPrompt && !error) return null;

  return (
    <>
      {/* Logout Prompt Modal */}
      {showLogoutPrompt && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div 
            className="bg-[#0A0E1A] border border-yellow-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Admin Access Required
              </h2>
              <p className="text-gray-400 text-sm">
                You're currently logged in as <span className="text-blue-400 font-semibold">{currentUser?.name}</span> ({currentUser?.role})
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 mb-6">
              <p className="text-yellow-300 text-sm text-center">
                To access admin dashboard, you need to logout and login with admin credentials
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutAndShowLogin}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-500/25"
              >
                Logout & Login as Admin
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-600 text-xs text-center">
                Shortcut: Ctrl+Shift+A (Cmd+Shift+A on Mac)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast for "Access Denied" */}
      {error && !showModal && (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-6 py-4 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="text-red-500 text-xl">🚫</div>
              <div>
                <div className="text-red-200 font-semibold">Access Denied</div>
                <div className="text-red-300/80 text-sm">{error}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div 
            className="bg-[#0A0E1A] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🔐 Admin Access
                </h2>
                <p className="text-gray-400 text-sm mt-1">Enter admin credentials</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jobie.app"
                  required
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-500/25"
              >
                {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-500 text-xs text-center">
                💡 Default: admin@jobie.app / adminpassword123
              </p>
              <p className="text-gray-600 text-xs text-center mt-2">
                Shortcut: Ctrl+Shift+A (Cmd+Shift+A on Mac)
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
