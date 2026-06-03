import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { MessageContext } from '../contexts/MessageContext';
import { SocketContext } from '../contexts/SocketContext';
import MessageFeed from '../components/MessageFeed';
import FrontendLogger from '../utils/logger';

/**
 * ChatsPage Component - The real-time messaging communications center.
 * Refactored for full responsiveness across mobile, tablet, and desktop.
 * Includes dynamic contact filtering capabilities.
 */
const ChatsPage = () => {
  const { user } = useContext(AuthContext);
  const { isConnected } = useContext(SocketContext);
  const { 
    contacts = [], 
    fetchContacts, 
    fetchHistory, 
    loadingStates 
  } = useContext(MessageContext);

  const [selectedContact, setSelectedContact] = useState(null);
  
  // State for handling the contact filtering input
  const [searchQuery, setSearchQuery] = useState('');

  // Initial lookup execution to pull conversational group contacts
  useEffect(() => {
    FrontendLogger.info('CHATS_PAGE', 'Initializing real-time communication channel networks and contacts sync');
    fetchContacts();
  }, [fetchContacts]);

  // Automated UX Guard: Auto-selects chat target if only one contact structure exists
  // Disabled on extremely small devices dynamically via CSS hiding rather than state to prevent back-button trap
  useEffect(() => {
    if (contacts.length === 1 && !selectedContact) {
      FrontendLogger.info('CHATS_PAGE', `Automated single contact channel selection captured for user ID: ${contacts[0].id}`);
      setSelectedContact(contacts[0]);
    }
  }, [contacts, selectedContact]);

  // Side-effect handler to refresh historical message packet arrays upon contact switch
  useEffect(() => {
    if (selectedContact) {
      FrontendLogger.info('CHATS_PAGE', `Shifting conversation thread vector pipeline focus to user ID: ${selectedContact.id}`);
      fetchHistory(selectedContact.id);
    }
  }, [selectedContact, fetchHistory]);

  const handleContactClick = (contact) => {
    if (selectedContact?.id !== contact.id) {
      setSelectedContact(contact);
    }
  };

  // Compute filtered array of contacts based on user input
  const filteredContacts = contacts.filter(contact => {
    const fullName = contact.full_name || `${contact.first_name || ''} ${contact.second_name || ''}`;
    return fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-140px)] font-sans gap-2 md:gap-4 lg:gap-8 p-2 md:p-4 max-w-[1700px] mx-auto overflow-hidden relative" dir="rtl">
      
      {/* --- SIDEBAR: CONTACT ENGINE LIST --- */}
      {/* Visible on mobile ONLY IF no contact is selected. Always visible on md and up. */}
      <aside 
        className={`w-full md:w-72 lg:w-80 bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] md:rounded-[2.5rem] flex-col shadow-xl overflow-hidden shrink-0 transition-all duration-300 ${
          selectedContact ? 'hidden md:flex' : 'flex'
        }`}
      >
        
        {/* Search / Filter Input Header */}
        <div className="p-4 md:p-6 border-b border-white/40 bg-white/10 relative">
          <input
            type="text"
            placeholder="חיפוש איש קשר..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/60 border border-white/80 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all shadow-sm"
          />
          
          {/* Subtle Connection Status Indicator (Optional integration alongside search) */}
          <div className="absolute top-2 right-6 md:right-8 flex items-center justify-center pointer-events-none">
            <div className={`w-2 h-2 rounded-full shadow-sm ${
              isConnected 
                ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' 
                : 'bg-rose-500 shadow-rose-500/50'
            }`} />
          </div>
        </div>

        {/* Scrollable Contacts Roster View */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 scrollbar-hide pr-1">
          {loadingStates?.contacts ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 select-none">
              <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Syncing Contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-center text-xs font-black text-zinc-400 italic py-12 uppercase tracking-wide select-none">No active channels allocated</p>
          ) : filteredContacts.length === 0 ? (
            <p className="text-center text-xs font-black text-zinc-500 py-12 select-none">לא נמצאו התאמות לחיפוש</p>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedContact?.id === contact.id;
              return (
                <div 
                  key={contact.id}
                  onClick={() => handleContactClick(contact)}
                  className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl cursor-pointer transition-all duration-300 active:scale-[0.98] group ${
                    isSelected 
                      ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                      : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
                  }`}
                >
                  {/* Avatar Profile Context Node with fallback initials renderer */}
                  <div className="relative shrink-0 select-none">
                    {contact.profile_picture ? (
                      <img 
                        src={contact.profile_picture} 
                        className={`w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover border-2 transition-all ${
                          isSelected ? 'border-blue-400' : 'border-white'
                        }`} 
                        alt="" 
                      />
                    ) : (
                      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-xs font-black uppercase shadow-sm border font-mono ${
                        isSelected 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-zinc-900 text-white border-zinc-900'
                      }`}>
                        {(contact.first_name?.[0] || '') + (contact.second_name?.[0] || '')}
                      </div>
                    )}
                  </div>

                  {/* Structural Identity Metadata Labels */}
                  <div className="flex flex-col overflow-hidden text-right min-w-0">
                    <span className={`text-sm font-black tracking-tight truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                      {contact.full_name || `${contact.first_name} ${contact.second_name}`}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`}>
                      {contact.role === 'trainee' ? 'מתאמן' : contact.role === 'trainer' ? 'מאמן' : contact.role}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* --- MAIN CHAT THREAD VIEWPORTS AREA --- */}
      {/* Hidden on mobile if no contact is selected. Always visible on md and up. */}
      <main 
        className={`flex-1 bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] md:rounded-[2.5rem] flex-col shadow-xl overflow-hidden h-full ${
          !selectedContact ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedContact ? (
          <div className="h-full flex flex-col animate-in fade-in duration-500">
            
            {/* Mobile View Back Button Controller */}
            <div className="md:hidden p-3 border-b border-white/40 bg-white/30 flex items-center shrink-0">
              <button 
                onClick={() => setSelectedContact(null)}
                className="flex items-center gap-2 text-xs font-bold bg-white/60 hover:bg-white text-zinc-800 px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
              >
                <span className="text-lg leading-none">&rarr;</span>
                חזור לרשימה
              </button>
            </div>

            <div className="flex-1 p-2 md:p-4 overflow-hidden">
              <MessageFeed 
                title={`שיחה עם ${selectedContact.full_name || selectedContact.first_name}`}
                targetId={selectedContact.id}
                type="personal"
                currentUserId={user?.id}
                userRole={user?.role}
              />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-col flex-1 items-center justify-center text-center p-8 space-y-4 animate-in zoom-in-95 duration-700 select-none pointer-events-none">
            <div className="text-5xl md:text-6xl p-5 md:p-6 bg-white/40 border border-white/80 rounded-[2rem] shadow-sm transform hover:scale-105 transition-transform duration-500">
              💬
            </div>
            <div className="space-y-1">
               <h3 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tighter uppercase">אנשי קשר</h3>
               <p className="text-xs font-bold text-zinc-400 max-w-xs leading-relaxed mx-auto">בחר משתמש או מאמן מתוך הרשימה הצדית כדי לפתוח ערוץ תקשורת מאובטח בזמן אמת.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatsPage;