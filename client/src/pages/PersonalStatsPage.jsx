import React, { useEffect, useState } from 'react';
import { useStats } from '../contexts/StatsContext';
import { useAuth } from '../hooks/useAuth';

/**
 * Personal Statistics Dashboard Component.
 * Visualizes user performance, consistency, and progress metrics.
 */
const PersonalStatsPage = () => {
  const { fetchUserOverview, loading } = useStats();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  // Fetch consolidated stats on component mount
  useEffect(() => {
    const loadData = async () => {
      const overview = await fetchUserOverview();
      setData(overview);
    };
    loadData();
  }, [fetchUserOverview]);

  if (loading || !data) {
    return <div style={styles.loading}>טוען נתונים...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>הביצועים שלי</h1>
        <p style={styles.subtitle}>סיכום פעילות והישגים אישיים</p>
      </header>

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
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto', direction: 'rtl', fontFamily: 'system-ui' },
  header: { marginBottom: '30px', textAlign: 'center' },
  title: { fontSize: '2rem', margin: '0 0 10px', color: '#212529' },
  subtitle: { color: '#868e96', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' },
  cardIcon: { fontSize: '2.5rem' },
  cardLabel: { margin: 0, fontSize: '14px', color: '#868e96' },
  cardValue: { margin: '5px 0 0', fontSize: '1.4rem', fontWeight: 'bold', color: '#212529' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' },
  sectionCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' },
  sectionTitle: { margin: '0 0 20px', fontSize: '1.2rem', color: '#495057' },
  chartContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '150px', padding: '10px 0' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' },
  bar: { width: '30%', backgroundColor: '#4dabf7', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' },
  barLabel: { marginTop: '8px', fontSize: '12px', color: '#868e96' },
  velocityList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  velocityItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  trend: { fontWeight: 'bold' },
  prTable: { display: 'flex', flexDirection: 'column' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px', borderBottom: '2px solid #f1f3f5', color: '#868e96', fontSize: '14px' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '15px 10px', borderBottom: '1px solid #f1f3f5', alignItems: 'center' },
  prExName: { fontWeight: '600', color: '#212529' },
  prValue: { color: '#228be6', fontWeight: 'bold' },
  prDate: { fontSize: '13px', color: '#adb5bd' },
  loading: { textAlign: 'center', marginTop: '100px', fontSize: '1.2rem', color: '#adb5bd' },
  emptyText: { textAlign: 'center', color: '#adb5bd', fontSize: '14px' }
};

export default PersonalStatsPage;