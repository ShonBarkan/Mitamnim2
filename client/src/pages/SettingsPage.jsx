import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Import the management components
import ParameterManager from '../components/Parameters/ParameterManager';
import ExerciseTreeManager from '../components/Exercises/ExerciseTreeManager';

const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if the user has appropriate permissions
  const isAuthorized = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    // Redirect unauthorized users to the landing page
    if (user && !isAuthorized) {
      navigate('/');
    }
  }, [user, isAuthorized, navigate]);

  if (!user || !isAuthorized) {
    return null; // Or a loading spinner/access denied message
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>ניהול מערכת והגדרות</h1>
        <p style={styles.subtitle}>כאן תוכל לנהל את פרמטרי המדידה ואת מבנה עץ התרגילים של הקבוצה.</p>
      </header>

      <div style={styles.grid}>
          <ParameterManager />

          <ExerciseTreeManager />
      </div>
    </div>
  );
};

// --- STYLES ---

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    direction: 'rtl',
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  },
  header: {
    marginBottom: '40px',
    borderBottom: '2px solid rgba(0,123,255,0.5)',
    paddingBottom: '20px'
  },
  title: {
    margin: 0,
    color: '#1e293b',
    fontSize: '2rem'
  },
  subtitle: {
    margin: '10px 0 0 0',
    color: '#64748b',
    fontSize: '1.1rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '30px',
    alignItems: 'start'
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    backdropFilter: 'blur(15px)',
    border: '1px solid rgba(255,255,255,0.2)'
  }
};

export default SettingsPage;