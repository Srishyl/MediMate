import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PillSchedule from './pages/PillSchedule';
import PillReminder from './pages/PillReminder';
import Layout from './components/Layout';

function App() {
  return (
    <UserProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Layout><PillSchedule /></Layout></ProtectedRoute>} />
          <Route path="/reminder/:id" element={<ProtectedRoute><Layout><PillReminder /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;