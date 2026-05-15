import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { MessageContext } from '../contexts/MessageContext';
import { SocketContext } from '../contexts/SocketContext';
import MessageFeed from '../components/MessageFeed';

/**
 * ChatsPage Component - The real-time messaging communications center.
 * Refactored from custom legacy inline object styles to dynamic Tailwind CSS utility structures.
 * Fully styled according to premium Arctic Mirror glassmorphic layouts.
 */
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

  // Initial lookup execution to pull conversational group contacts
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Automated UX Guard: Auto-selects chat target if only one contact structure exists
  useEffect(() => {
    if (contacts.length === 1 && !selectedContact) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts, selectedContact]);

  // Side-effect handler to refresh historical message packet arrays upon contact switch
  useEffect(() => {
    if (selectedContact) {
      fetchHistory(selectedContact.id);
    }
  }, [selectedContact, fetchHistory]);

  return (
    <div className="flex h-[calc(100vh-140px)] font-sans gap-8 p-2 max-w-[1700px] mx-auto overflow-hidden" dir="rtl">
      
      {/* --- SIDEBAR: CONTACT ENGINE LIST --- */}
      <aside className="w-80 bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] flex flex-col shadow-xl overflow-hidden shrink-0">
        
        {/* Sidebar Status Control Header */}
        <div className="p-6 border-b border-white/40 bg-white/10 flex flex-col gap-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mr-1">
            Conversations
          </h2>
          
          {/* Socket Lifecycle Connection Monitor */}
          <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-xl border border-white w-fit shadow-sm">
            <div className={`w-2 h-2 rounded-full shadow-sm ${
              isConnected 
                ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' 
                : 'bg-rose-500 shadow-rose-500/50 animate-ping'
            }`} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider tabular-nums">
              {isConnected ? 'Connected Stream' : 'Connecting Engine...'}
            </span>
          </div>
        </div>

        {/* Scrollable Contacts Roster view */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {loadingStates.contacts ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Syncing Contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-center text-xs font-bold text-zinc-400 italic py-12">No communication nodes allocated</p>
          ) : (
            contacts.map((contact) => {
              const isSelected = selectedContact?.id === contact.id;
              return (
                <div 
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 group ${
                    isSelected 
                      ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                      : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
                  }`}
                >
                  {/* Avatar Profile Context Node with fallback initials renderer */}
                  <div className="relative shrink-0">
                    {contact.profile_picture ? (
                      <img 
                        src={contact.profile_picture} 
                        className={`w-11 h-11 rounded-xl object-cover border-2 transition-all ${
                          isSelected ? 'border-blue-400' : 'border-white'
                        }`} 
                        alt="" 
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black uppercase shadow-sm border ${
                        isSelected 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-zinc-900 text-white border-zinc-900'
                      }`}>
                        {contact.first_name?.[0]}{contact.second_name?.[0]}
                      </div>
                    )}
                  </div>

                  {/* Structural Identity Metadata Labels */}
                  <div className="flex flex-col overflow-hidden text-right">
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
      <main className="flex-1 bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] flex flex-col shadow-xl overflow-hidden h-full">
        {selectedContact ? (
          <div className="h-full p-4 animate-in fade-in duration-500">
            <MessageFeed 
              title={`שיחה עם ${selectedContact.full_name || selectedContact.first_name}`}
              targetId={selectedContact.id}
              type="personal"
              currentUserId={user?.id}
              userRole={user?.role}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center text-center p-8 space-y-4 animate-in zoom-in-95 duration-700">
            <div className="text-6xl p-6 bg-white/40 border border-white/80 rounded-[2rem] shadow-sm transform hover:scale-110 transition-transform duration-500">
              💬
            </div>
            <div className="space-y-1">
               <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">אנשי קשר</h3>
               <p className="text-xs font-bold text-zinc-400 max-w-xs leading-relaxed mx-auto">בחר משתמש או מאמן מתוך הרשימה הצדית כדי לפתוח ערוץ תקשורת מאובטח בזמן אמת.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatsPage;