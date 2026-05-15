import React from 'react';

const TemplateFooter = ({ onCancel, styles }) => {
  return (
    <div style={styles.footer}>
      <button type="submit" style={styles.submitBtn}>שמור שבלונה</button>
      <button type="button" onClick={onCancel} style={styles.cancelBtn}>ביטול</button>
    </div>
  );
};

export default TemplateFooter;