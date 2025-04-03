import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import authUtils from './utils/authUtils';
import Profile from './pages/Profile';
import Users from './pages/UserManagement';
import KHTNManagement from './pages/KHTNManagement';
import DMHHManagement from './pages/DMHHManagement';
import KHTNDetails from './pages/KHTNDetails';
import BaoGiaFrom from './pages/BaoGiaFrom';
import KHTNMap from './pages/KHTNMap';
import KHTNCalendar from './pages/KHTNCalendar';
import CSKHManagement from './pages/CSKHManagement';
import CSKHCalendar from './pages/CSKHCalendar';
import TaskManagement from './pages/TaskManagement';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!authUtils.isAuthenticated()) {
    // Lưu lại đường dẫn hiện tại trước khi chuyển hướng
    localStorage.setItem('returnUrl', location.pathname + location.search);
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    // Không cần basename vì đã có domain
    <BrowserRouter>
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/dmhh" element={<DMHHManagement />} />
                  <Route path="/khtn" element={<KHTNManagement />} />
                  <Route path="/baogiafrom" element={<BaoGiaFrom />} />
                  <Route path="/task" element={<TaskManagement />} />
                  <Route path="/khtn/:idCty" element={<KHTNDetails />} />
                  <Route path="/khtn-map" element={<KHTNMap />} />
                  <Route path="/khtn-calendar" element={<KHTNCalendar />} />
                  <Route path="/khtn/:idCty/cskh" element={<CSKHManagement />} />
                  <Route path="/cskh" element={<CSKHManagement />} />
                  <Route path="/cskh-calendar" element={<CSKHCalendar />} />





                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;