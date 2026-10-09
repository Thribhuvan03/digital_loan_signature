import React, { createContext, useState, useEffect, useContext } from 'react';
import { getActiveLoan, resetDemoSystem, loginUser as apiLogin } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('loan_system_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.role === 'CUSTOMER') {
        parsed.name = 'Thribhuvan';
      } else if (parsed.role === 'OFFICER') {
        parsed.name = 'Priya Sharma (Credit Officer)';
      }
      return parsed;
    }
    return null; // STARTING STATE: NO AUTO-LOGIN! SHOWS LOGIN PAGE FIRST.
  });

  const [activeLoanData, setActiveLoanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const refreshLoan = async () => {
    if (!user || user.role !== 'CUSTOMER') {
      setActiveLoanData(null);
      return;
    }
    try {
      setLoading(true);
      const data = await getActiveLoan(user.id);
      setActiveLoanData(data);
    } catch (err) {
      console.error('Failed to load active loan data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLoan();
  }, [user]);

  const setSessionUser = (userData) => {
    setUser(userData);
    localStorage.setItem('loan_system_user', JSON.stringify(userData));
    addToast(`Authenticated as ${userData.name} (${userData.role})`, 'success');
  };

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setSessionUser(data.user);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('loan_system_user');
    setActiveLoanData(null);
    addToast('Logged out successfully', 'info');
  };

  const resetDemo = async () => {
    await resetDemoSystem();
    setActiveLoanData(null);
    addToast('Demo database reset to clean initial state (0 applications)', 'warning');
    await refreshLoan();
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      setSessionUser,
      logout,
      activeLoanData,
      refreshLoan,
      loading,
      resetDemo,
      toasts,
      addToast
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
