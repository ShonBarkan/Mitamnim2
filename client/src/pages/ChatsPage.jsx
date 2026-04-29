import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { MessageContext } from '../contexts/MessageContext';
import { SocketContext } from '../contexts/SocketContext';
import MessageFeed from '../components/MessageFeed';

const ChatsPage = () => {
  const { user } = useContext(AuthContext);
  const { isConnected } = useContext(SocketContext);
  const { 
    contacts, 
    fetchContacts, 
    fetchHistory, 
    loadingStates 
  } = useContext(MessageContext);

  const [selectedContact, setSelectedContact] = useState(null);

  // Initial fetch for contacts
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Auto-select if there is only one contact
  useEffect(() => {
    if (contacts.length === 1 && !selectedContact) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts, selectedContact]);

  // Fetch history when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      fetchHistory(selectedContact.id);
    }
  }, [selectedContact, fetchHistory]);

  return (
    <div style={styles.container}>
      {/* --- SIDEBAR: CONTACT LIST --- */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Messages</h2>
          <div style={styles.statusContainer}>
            <div style={{
              ...styles.statusDot,
              backgroundColor: isConnected ? '#28a745' : '#ff4d4f'
            }} />
            <span style={styles.statusText}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div style={styles.contactList}>
          {loadingStates.contacts ? (
            <p style={styles.loadingText}>Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p style={styles.emptyText}>No contacts found in your group.</p>
          ) : (
            contacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                style={{
                  ...styles.contactItem,
                  backgroundColor: selectedContact?.id === contact.id ? '#e3f2fd' : 'transparent',
                  borderRight: selectedContact?.id === contact.id ? '4px solid #007bff' : '4px solid transparent'
                }}
              >
                <div style={styles.avatar}>
                  {contact.first_name[0]}{contact.second_name[0]}
                </div>
                <div style={styles.contactInfo}>
                  <div style={styles.contactName}>{contact.full_name}</div>
                  <div style={styles.contactRole}>{contact.role}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- MAIN AREA: CHAT FEED --- */}
      <main style={styles.mainContent}>
        {selectedContact ? (
          <div style={styles.chatWrapper}>
            <MessageFeed 
              title={`Chat with ${selectedContact.full_name}`}
              targetId={selectedContact.id}
              type="personal"
              currentUserId={user?.id}
              userRole={user?.role}
            />
          </div>
        ) : (
          <div style={styles.noSelection}>
            <div style={styles.noSelectionIcon}>💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a contact from the list to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
};

// --- STYLES ---

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 100px)', // Adjust based on your Navbar height
    backgroundColor: '#f5f7fb',
    direction: 'rtl',
    gap: '20px',
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  sidebar: {
    width: '320px',
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fff'
  },
  sidebarTitle: {
    margin: '0 0 5px 0',
    fontSize: '1.4rem',
    color: '#333'
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  statusText: {
    fontSize: '12px',
    color: '#666'
  },
  contactList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 15px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '8px'
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  contactName: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  contactRole: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'capitalize'
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },
  chatWrapper: {
    height: '100%',
    padding: '20px'
  },
  noSelection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    textAlign: 'center'
  },
  noSelectionIcon: {
    fontSize: '4rem',
    marginBottom: '15px',
    opacity: 0.5
  },
  loadingText: { textAlign: 'center', padding: '20px', color: '#999' },
  emptyText: { textAlign: 'center', padding: '20px', color: '#bbb', fontSize: '13px' }
};

export default ChatsPage;