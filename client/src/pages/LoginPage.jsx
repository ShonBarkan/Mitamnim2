import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect to home if a user session is already active
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast("אנא מלא את כל השדות", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Auth logic handled by AuthContext
      await login(username, password);
      showToast("ברוך הבא!", "success");
      navigate('/');
    } catch (error) {
      // Extract error message from server or use a fallback
      const errMsg = error.response?.data?.detail || "שם משתמש או סיסמה שגויים";
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '300px', 
      margin: '50px auto', 
      padding: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      direction: 'rtl' 
    }}>
      <h2>התחברות</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>שם משתמש:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            disabled={isSubmitting}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>סיסמה:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            disabled={isSubmitting}
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '10px', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'מתחבר...' : 'כניסה'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;