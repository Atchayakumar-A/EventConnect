import React, { useState } from 'react';
import { OrganizerLayout } from './components/OrganizerLayout';
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { OrganizerRegistrations } from './pages/organizer/OrganizerRegistrations';
import { OrganizerPendingPayments } from './pages/organizer/OrganizerPendingPayments';
import { OrganizerScanQR } from './pages/organizer/OrganizerScanQR';
import { OrganizerAnalytics } from './pages/organizer/OrganizerAnalytics';
import { CreateEventPage } from './pages/CreateEventPage';
import { ProfilePage } from './pages/ProfilePage';

export const OrganizerApp = () => {
    const [activeTab, setActiveTab] = useState('my-events');
    const [selectedEventId, setSelectedEventId] = useState(null);

    // Navigate to a specific section pre-loaded with an event
    const openSection = (tab, eventId = null) => {
        setSelectedEventId(eventId);
        setActiveTab(tab);
    };

    const renderPage = () => {
        switch (activeTab) {
            case 'my-events':
                return (
                    <OrganizerDashboard
                        onOpenSection={openSection}
                    />
                );
            case 'create':
                return (
                    <CreateEventPage
                        onCreated={() => setActiveTab('my-events')}
                    />
                );
            case 'registrations':
                return (
                    <OrganizerRegistrations
                        preSelectedEventId={selectedEventId}
                        onChangeEvent={(id) => setSelectedEventId(id)}
                    />
                );
            case 'payments':
                return (
                    <OrganizerPendingPayments
                        preSelectedEventId={selectedEventId}
                    />
                );
            case 'scan':
                return (
                    <OrganizerScanQR
                        preSelectedEventId={selectedEventId}
                    />
                );
            case 'analytics':
                return (
                    <OrganizerAnalytics
                        preSelectedEventId={selectedEventId}
                    />
                );
            case 'profile':
                return (
                    <ProfilePage
                        onOpenOnboarding={() => { }}
                        onOpenAdmin={() => openSection('analytics', null)}
                    />
                );
            default:
                return <OrganizerDashboard onOpenSection={openSection} />;
        }
    };

    return (
        <OrganizerLayout activeTab={activeTab} setActiveTab={(tab) => { setSelectedEventId(null); setActiveTab(tab); }}>
            {renderPage()}
        </OrganizerLayout>
    );
};
