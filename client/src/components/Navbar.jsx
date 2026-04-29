import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      gap: '20px', 
      padding: '10px', 
      borderBottom: '1px solid black', 
      direction: 'rtl' 
    }}>
      <Link to="/">דף הבית</Link>
      
      {/* Trainers and Admins only */}
      {(user.role === 'admin' || user.role === 'trainer') && (
        <Link to="/users">ניהול משתמשים</Link>
      )}

      {/* Admins only */}
      {user.role === 'admin' && (
        <Link to="/groups">ניהול קבוצות</Link>
      )}

      <button onClick={handleLogout}>התנתק ({user.username})</button>
    </nav>
  );
};

export default Navbar;