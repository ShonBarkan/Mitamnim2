import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStats } from '../contexts/StatsContext';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';

/**
 * Personal Statistics Dashboard Component.
 * Visualizes user performance, consistency, and progress metrics.
 */
const PersonalStatsPage = () => {
  const { userId } = useParams();
  const { fetchUserOverview, loading } = useStats();
  const { user } = useAuth();
  const { users, refreshUsers } = useUsers();
  const [data, setData] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  // Fetch users if trainer
  useEffect(() => {
    if (isTrainer && user?.group_id) {
      refreshUsers(user.group_id);
    }
  }, [isTrainer, user, refreshUsers]);

  // Set initial selected user
  useEffect(() => {
    if (userId) {
      setSelectedUserId(userId);
    } else if (!isTrainer && user?.id) {
      setSelectedUserId(user.id);
    }
  }, [userId, user, isTrainer]);

  // Fetch consolidated stats when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      const loadData = async () => {
        const overview = await fetchUserOverview(selectedUserId);
        setData(overview);
      };
      loadData();
    }
  }, [fetchUserOverview, selectedUserId]);

  const trainees = users.filter(u => u.role === 'trainee');
  const filteredTrainees = trainees.filter(t =>
    t.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.second_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !data) {
    return <div style={styles.loading}>טוען נתונים...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>{selectedUserId === user?.id ? 'הביצועים שלי' : 'ביצועי מתאמן'}</h1>
        <p style={styles.subtitle}>סיכום פעילות והישגים אישיים</p>
      </header>

      {isTrainer && (
        <section style={styles.selectorSection}>
          <h3 style={styles.selectorTitle}>בחר מתאמן לצפייה בסטטיסטיקות</h3>
          <input
            type="text"
            placeholder="חפש מתאמן..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <div style={styles.traineeList}>
            {filteredTrainees.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedUserId(t.id)}
                style={{
                  ...styles.traineeItem,
                  backgroundColor: selectedUserId === t.id ? '#e0f2fe' : '#ffffff',
                  borderColor: selectedUserId === t.id ? '#0284c7' : '#e5e7eb'
                }}
              >
                {t.first_name} {t.second_name} ({t.username})
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Overview Cards Section */}
      <div style={styles.statsGrid}>
        <StatCard 
          label="אימונים שבוצעו" 
          value={data.total_workouts} 
          icon="🏋️‍♂️" 
          color="#4dabf7" 
        />
        <StatCard 
          label="זמן אימון כולל" 
          value={`${data.total_duration_minutes} דק'`} 
          icon="⏱️" 
          color="#ff922b" 
        />
        <StatCard 
          label="דירוג יחסי בקבוצה" 
          value={`Top ${data.relative_rank_percentile}%`} 
          icon="🏆" 
          color="#fab005" 
        />
      </div>

      <div style={styles.mainGrid}>
        {/* Day Distribution Chart */}
        <section style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>התפלגות ימי אימון</h3>
          <div style={styles.chartContainer}>
            {data.day_distribution.map((item) => (
              <div key={item.day_name} style={styles.barWrapper}>
                <div 
                  style={{ 
                    ...styles.bar, 
                    height: `${(item.count / Math.max(...data.day_distribution.map(d => d.count), 1)) * 100}%` 
                  }} 
                />
                <span style={styles.barLabel}>{translateDay(item.day_name)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Velocity of Progress */}
        <section style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>קצב התקדמות (30 יום אחרונים)</h3>
          <div style={styles.velocityList}>
            {Object.entries(data.velocity_of_progress).map(([exercise, change]) => (
              <div key={exercise} style={styles.velocityItem}>
                <span style={styles.exerciseName}>{exercise}</span>
                <span style={{ 
                  ...styles.trend, 
                  color: change >= 0 ? '#2f9e44' : '#e03131' 
                }}>
                  {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                </span>
              </div>
            ))}
            {Object.keys(data.velocity_of_progress).length === 0 && (
              <p style={styles.emptyText}>אין מספיק נתונים לחישוב מגמה</p>
            )}
          </div>
        </section>
      </div>

      {/* PR Hall of Fame */}
      <section style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>🏅 היכל התהילה - שיאים אישיים</h3>
        <div style={styles.prTable}>
          <div style={styles.tableHeader}>
            <span>תרגיל</span>
            <span>שיא</span>
            <span>תאריך</span>
          </div>
          {data.pr_hall_of_fame.map((pr, idx) => (
            <div key={idx} style={styles.tableRow}>
              <span style={styles.prExName}>{pr.exercise_name}</span>
              <span style={styles.prValue}>{pr.value} {pr.unit}</span>
              <span style={styles.prDate}>{new Date(pr.date).toLocaleDateString('he-IL')}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/**
 * Reusable Stat Card sub-component
 */
const StatCard = ({ label, value, icon, color }) => (
  <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
    <span style={styles.cardIcon}>{icon}</span>
    <div style={styles.cardContent}>
      <h4 style={styles.cardLabel}>{label}</h4>
      <p style={styles.cardValue}>{value}</p>
    </div>
  </div>
);

/**
 * Helper to translate English days to Hebrew
 */
const translateDay = (day) => {
  const days = {
    'Monday': 'ב\'', 'Tuesday': 'ג\'', 'Wednesday': 'ד\'', 
    'Thursday': 'ה\'', 'Friday': 'ו\'', 'Saturday': 'ש\'', 'Sunday': 'א\''
  };
  return days[day] || day;
};

const styles = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto', direction: 'rtl', fontFamily: 'system-ui', backgroundColor: 'rgba(248, 250, 252, 0.8)', backdropFilter: 'blur(20px)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
  header: { marginBottom: '30px', textAlign: 'center' },
  title: { fontSize: '2rem', margin: '0 0 10px', color: '#1e293b' },
  subtitle: { color: '#64748b', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' },
  cardIcon: { fontSize: '2.5rem' },
  cardLabel: { margin: 0, fontSize: '14px', color: '#64748b' },
  cardValue: { margin: '5px 0 0', fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' },
  sectionCard: { backgroundColor: 'rgba(255,255,255,0.15)', padding: '25px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', marginBottom: '20px', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.2)' },
  sectionTitle: { margin: '0 0 20px', fontSize: '1.2rem', color: '#374151' },
  chartContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '150px', padding: '10px 0' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' },
  bar: { width: '30%', backgroundColor: '#0ea5e9', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' },
  barLabel: { marginTop: '8px', fontSize: '12px', color: '#64748b' },
  velocityList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  velocityItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(241,245,249,0.8)', borderRadius: '8px', backdropFilter: 'blur(5px)' },
  trend: { fontWeight: 'bold' },
  prTable: { display: 'flex', flexDirection: 'column' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px', borderBottom: '2px solid rgba(241,245,249,0.8)', color: '#64748b', fontSize: '14px' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '15px 10px', borderBottom: '1px solid rgba(241,245,249,0.8)', alignItems: 'center' },
  prExName: { fontWeight: '600', color: '#1e293b' },
  prValue: { color: '#0284c7', fontWeight: 'bold' },
  prDate: { fontSize: '13px', color: '#94a3b8' },
  loading: { textAlign: 'center', marginTop: '100px', fontSize: '1.2rem', color: '#94a3b8' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  selectorSection: { marginBottom: '30px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' },
  selectorTitle: { margin: '0 0 15px', fontSize: '1.1rem', color: '#374151' },
  searchInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(203,213,225,0.5)',
    marginBottom: '15px',
    fontSize: '14px',
    direction: 'ltr',
    backgroundColor: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(5px)'
  },
  traineeList: {
    maxHeight: '200px',
    overflowY: 'auto',
    borderRadius: '8px',
    border: '1px solid rgba(203,213,225,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)'
  },
  traineeItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(241,245,249,0.5)',
    transition: 'background-color 0.3s'
  }
};

export default PersonalStatsPage;