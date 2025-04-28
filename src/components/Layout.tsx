import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Pill, Home, Calendar, User, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with top navigation */}
      <header className="bg-white shadow-sm z-10 px-4">
        <div className="w-full py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Pill className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
                MediMate
              </span>
            </Link>
            {/* Top navigation links */}
            <nav className="hidden md:flex items-center space-x-6 ml-8">
              <Link 
                to="/" 
                className={`flex items-center space-x-2 text-lg font-medium transition-colors ${
                  location.pathname === '/' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-500'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/schedule" 
                className={`flex items-center space-x-2 text-lg font-medium transition-colors ${
                  location.pathname === '/schedule' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-500'
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Pill Schedule</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-500" />
              </div>
              <span className="font-medium hidden md:block">{user?.name}</span>
            </div>
            <button 
              onClick={logout}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom navigation on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-t-lg border-t border-gray-200 z-10">
        <div className="flex justify-around">
          <Link 
            to="/" 
            className={`flex flex-col items-center p-4 transition-colors ${
              location.pathname === '/' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link 
            to="/schedule" 
            className={`flex flex-col items-center p-4 transition-colors ${
              location.pathname === '/schedule' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs mt-1">Schedule</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;