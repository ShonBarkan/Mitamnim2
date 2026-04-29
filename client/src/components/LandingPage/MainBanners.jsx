import React from 'react';

const MainBanners = ({ mainMessages }) => {
  const { general, personal } = mainMessages;

  if (!general && !personal) return null;

  return (
    <div style={{ marginBottom: '20px' }}>
      {general && (
        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
          <strong>📢 הודעה ראשית לכלולם{general.sender_name}:</strong>
          <p style={{ margin: '5px 0 0' }}>{general.content}</p>
        </div>
      )}
      {personal && (
        <div style={{ backgroundColor: '#d1ecf1', border: '1px solid #bee5eb', padding: '15px', borderRadius: '8px' }}>
          <strong>📩  הודעה ראשית אישית עבורך מ{personal.sender_name}:</strong>
          <p style={{ margin: '5px 0 0' }}>{personal.content}</p>
        </div>
      )}
    </div>
  );
};

export default MainBanners;