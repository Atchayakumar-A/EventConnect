import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { MyEventsPage } from './pages/MyEventsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { OrganizerApp } from './OrganizerApp';
import { Calendar } from 'lucide-react';

// ── Attendee Layout (unchanged) ──────────────────────────────
const AttendeeApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [analyticsEventId, setAnalyticsEventId] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const { hasPreferences } = useAuth();

  if (!hasPreferences || showOnboardingModal) {
    return (
      <OnboardingPage
        onComplete={() => {
          setShowOnboardingModal(false);
          setActiveTab('home');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#2D3748]">
      <div className="max-w-md mx-auto min-h-screen bg-[#FAF9F5] border-x border-[#E6E4DC] relative flex flex-col shadow-calm-lg">
        <Navbar />
        <main className="flex-1 p-4">
          {analyticsEventId || showAdminPanel ? (
            <AnalyticsDashboard
              eventId={analyticsEventId}
              onBack={() => { setAnalyticsEventId(null); setShowAdminPanel(false); }}
            />
          ) : selectedEventId ? (
            <EventDetailPage
              eventId={selectedEventId}
              onBack={() => setSelectedEventId(null)}
              onRegistrationSuccess={() => { setSelectedEventId(null); setActiveTab('my-events'); }}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomePage
                  onSelectEvent={(id) => setSelectedEventId(id)}
                  onOpenSearch={() => setActiveTab('search')}
                />
              )}
              {activeTab === 'search' && (
                <SearchPage onSelectEvent={(id) => setSelectedEventId(id)} />
              )}
              {activeTab === 'create' && (
                <CreateEventPage onCreated={() => setActiveTab('home')} />
              )}
              {activeTab === 'my-events' && (
                <MyEventsPage
                  onSelectEvent={(id) => setSelectedEventId(id)}
                  onOpenAnalytics={(id) => setAnalyticsEventId(id)}
                />
              )}
              {activeTab === 'profile' && (
                <ProfilePage
                  onOpenOnboarding={() => setShowOnboardingModal(true)}
                  onOpenAdmin={() => setShowAdminPanel(true)}
                />
              )}
            </>
          )}
        </main>
        {!selectedEventId && !analyticsEventId && !showAdminPanel && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </div>
    </div>
  );
};

// ── Main entry: dispatch by role ─────────────────────────────
const MainContent = () => {
  const { user, hasPreferences, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F5] space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-[#5F8670] text-white flex items-center justify-center animate-bounce shadow-md">
          <Calendar className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-[#64748B]">Loading EventConnect...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthPage onComplete={() => { }} />;
  }

  // ── ORGANIZER: left sidebar layout ──
  if (user.role === 'organizer') {
    // Organizer still needs onboarding if not done
    if (!hasPreferences) {
      return <OnboardingPage onComplete={() => window.location.reload()} />;
    }
    return <OrganizerApp />;
  }

  // ── ATTENDEE: bottom nav layout (unchanged) ──
  return <AttendeeApp />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
