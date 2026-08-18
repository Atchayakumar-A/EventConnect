const bcrypt = require('bcryptjs');
const { run, query, get, initDb } = require('../config/db');

const mockUsers = [
  // Demo shortcuts
  { id: 1, name: 'Priya Sharma (Organizer)', email: 'organizer@eventconnect.com', password: 'password123', role: 'organizer', bio: 'Runs tech meetups and hackathons across the city.', skills: JSON.stringify(['Product/Pitching', 'Backend Development']) },
  { id: 4, name: 'Rohan Verma (Attendee / Team Leader)', email: 'attendee@eventconnect.com', password: 'password123', role: 'attendee', bio: 'Frontend dev & React enthusiast, loves building agentic AI tools.', skills: JSON.stringify(['Frontend Development', 'UI/UX Design', 'React']) },

  // Attendees & Organizers
  { id: 2, name: 'Arjun Mehta', email: 'arjun.organizer@eventconnect.dev', password: 'password123', role: 'organizer', bio: 'Community lead for Web3 and builder events.', skills: JSON.stringify(['Blockchain', 'DevOps/Cloud']) },
  { id: 3, name: 'Kavya Nair', email: 'kavya.organizer@eventconnect.dev', password: 'password123', role: 'organizer', bio: 'Wellness instructor and workshop host.', skills: JSON.stringify(['Product/Pitching']) },
  { id: 5, name: 'Ananya Iyer', email: 'ananya.i@mail.dev', password: 'password123', role: 'attendee', bio: 'Backend engineer, into distributed systems & microservices.', skills: JSON.stringify(['Backend Development', 'DevOps/Cloud', 'Node.js', 'PostgreSQL']) },
  { id: 6, name: 'Vikram Rao', email: 'vikram.r@mail.dev', password: 'password123', role: 'attendee', bio: 'Mobile developer, ships Flutter & React Native apps on weekends.', skills: JSON.stringify(['Mobile Dev', 'Frontend Development', 'Flutter']) },
  { id: 7, name: 'Sneha Pillai', email: 'sneha.p@mail.dev', password: 'password123', role: 'attendee', bio: 'UI/UX designer, loves prototyping fast in Figma.', skills: JSON.stringify(['UI/UX Design', 'Figma', 'Product/Pitching']) },
  { id: 8, name: 'Karthik Raj', email: 'karthik.r@mail.dev', password: 'password123', role: 'attendee', bio: 'ML engineer, works on neural recommendation systems.', skills: JSON.stringify(['Machine Learning/AI', 'Data Science', 'Python', 'PyTorch']) },
  { id: 9, name: 'Divya Krishnan', email: 'divya.k@mail.dev', password: 'password123', role: 'attendee', bio: 'Data scientist & competitive hackathon regular.', skills: JSON.stringify(['Data Science', 'Machine Learning/AI', 'Python']) },
  { id: 10, name: 'Aditya Kumar', email: 'aditya.k@mail.dev', password: 'password123', role: 'attendee', bio: 'DevOps engineer & cloud infrastructure nerd.', skills: JSON.stringify(['DevOps/Cloud', 'Backend Development', 'Docker', 'Kubernetes']) },
  { id: 11, name: 'Meera Suresh', email: 'meera.s@mail.dev', password: 'password123', role: 'attendee', bio: 'Blockchain dev, builds smart contracts & dApps.', skills: JSON.stringify(['Blockchain', 'Backend Development', 'Solidity']) },
  { id: 12, name: 'Nikhil Joshi', email: 'nikhil.j@mail.dev', password: 'password123', role: 'attendee', bio: 'Product person, pitches at every demo day.', skills: JSON.stringify(['Product/Pitching', 'UI/UX Design']) },
  { id: 13, name: 'Ishita Bose', email: 'ishita.b@mail.dev', password: 'password123', role: 'attendee', bio: 'Domain expert in fintech, first hackathon.', skills: JSON.stringify(['Domain Expert: Fintech', 'Product/Pitching']) },
  { id: 14, name: 'Farhan Sheikh', email: 'farhan.s@mail.dev', password: 'password123', role: 'attendee', bio: 'Full-stack dev, open to joining hackathon teams.', skills: JSON.stringify(['Frontend Development', 'Backend Development']) },
  { id: 15, name: 'Lakshmi Menon', email: 'lakshmi.m@mail.dev', password: 'password123', role: 'attendee', bio: 'Wellness and fitness meetup regular.', skills: JSON.stringify(['Product/Pitching']) },
  { id: 16, name: 'Rahul Desai', email: 'rahul.d@mail.dev', password: 'password123', role: 'attendee', bio: 'Jazz enthusiast & sound engineer.', skills: JSON.stringify(['Domain Expert']) }
];

const mockPreferences = [
  { userId: 4, categories: JSON.stringify(['Technology & Workshops', 'Festivals & Celebrations']), budget_pref: 'free', time_pref: 'evening' },
  { userId: 5, categories: JSON.stringify(['Technology & Workshops']), budget_pref: 'low', time_pref: 'evening' },
  { userId: 6, categories: JSON.stringify(['Technology & Workshops']), budget_pref: 'free', time_pref: 'weekend' },
  { userId: 7, categories: JSON.stringify(['Technology & Workshops', 'Business & Networking']), budget_pref: 'low', time_pref: 'weekend' },
  { userId: 8, categories: JSON.stringify(['Technology & Workshops']), budget_pref: 'medium', time_pref: 'weekend' },
  { userId: 9, categories: JSON.stringify(['Technology & Workshops']), budget_pref: 'free', time_pref: 'weekend' },
  { userId: 10, categories: JSON.stringify(['Technology & Workshops']), budget_pref: 'low', time_pref: 'evening' },
  { userId: 11, categories: JSON.stringify(['Business & Networking']), budget_pref: 'medium', time_pref: 'weekend' },
  { userId: 12, categories: JSON.stringify(['Business & Networking', 'Technology & Workshops']), budget_pref: 'medium', time_pref: 'evening' },
  { userId: 13, categories: JSON.stringify(['Business & Networking']), budget_pref: 'free', time_pref: 'weekend' },
  { userId: 14, categories: JSON.stringify(['Technology & Workshops']), budget_pref: 'low', time_pref: 'evening' },
  { userId: 15, categories: JSON.stringify(['Sports & Fitness']), budget_pref: 'free', time_pref: 'morning' },
  { userId: 16, categories: JSON.stringify(['Music & Concerts']), budget_pref: 'medium', time_pref: 'evening' }
];

const mockEvents = [
  {
    id: 1,
    organizerId: 2,
    title: 'TechConnect Hackathon 2026',
    description: '24-hour build sprint for full-stack, blockchain, and AI projects. Pitch your project and build with elite devs.',
    category: 'Technology & Workshops',
    start_time: new Date(Date.now() + 10 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 11 * 86400000).toISOString(),
    venue_name: 'Innovation Hub, Chennai',
    venue_lat: 13.0827,
    venue_lng: 80.2707,
    capacity: 100,
    price: 0,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'both',
    max_team_size: 4,
    team_required: 1,
    team_lock_time: new Date(Date.now() + 8 * 86400000).toISOString()
  },
  {
    id: 2,
    organizerId: 1,
    title: 'Startup Pitch Night',
    description: 'Founders pitch to a panel of local investors and venture capitalists.',
    category: 'Business & Networking',
    start_time: new Date(Date.now() + 5 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 5 * 86400000 + 3 * 3600000).toISOString(),
    venue_name: 'WeWork Nungambakkam',
    venue_lat: 13.0569,
    venue_lng: 80.2425,
    capacity: 60,
    price: 200,
    banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'solo_only',
    team_required: 0,
    organizer_upi_id: 'priya.sharma@upi'
  },
  {
    id: 3,
    organizerId: 1,
    title: 'AI/ML Workshop Series',
    description: 'Hands-on session on building recommendation engines and vector similarity search.',
    category: 'Technology & Workshops',
    start_time: new Date(Date.now() + 3 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 3 * 86400000 + 4 * 3600000).toISOString(),
    venue_name: 'IIT Madras Research Park',
    venue_lat: 12.9906,
    venue_lng: 80.2338,
    capacity: 40,
    price: 150,
    banner_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'solo_only',
    team_required: 0,
    organizer_upi_id: 'priya.sharma@upi'
  },
  {
    id: 4,
    organizerId: 3,
    title: 'Sunrise Yoga & Meditation',
    description: 'Morning wellness session in the park with guided breathwork.',
    category: 'Sports & Fitness',
    start_time: new Date(Date.now() + 2 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 2 * 86400000 + 3600000).toISOString(),
    venue_name: 'Semmozhi Poonga',
    venue_lat: 13.0358,
    venue_lng: 80.2497,
    capacity: 30,
    price: 0,
    banner_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'solo_only',
    team_required: 0
  },
  {
    id: 5,
    organizerId: 2,
    title: 'Web3 Builders Sprint',
    description: 'Team-based hackathon focused on smart contracts and dApps.',
    category: 'Technology & Workshops',
    start_time: new Date(Date.now() + 15 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 16 * 86400000).toISOString(),
    venue_name: 'T-Hub Chennai',
    venue_lat: 13.0674,
    venue_lng: 80.2376,
    capacity: 80,
    price: 0,
    banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'team_only',
    max_team_size: 4,
    team_required: 1,
    team_lock_time: new Date(Date.now() + 13 * 86400000).toISOString()
  },
  {
    id: 6,
    organizerId: 1,
    title: 'Product Design Bootcamp',
    description: 'Two-day intensive on product thinking, UI prototyping, and user onboarding.',
    category: 'Technology & Workshops',
    start_time: new Date(Date.now() + 20 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 21 * 86400000).toISOString(),
    venue_name: 'Prestige Palladium Bytes',
    venue_lat: 13.0524,
    venue_lng: 80.2508,
    capacity: 50,
    price: 300,
    banner_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'both',
    max_team_size: 3,
    team_required: 1,
    team_lock_time: new Date(Date.now() + 18 * 86400000).toISOString(),
    organizer_upi_id: 'priya.sharma@upi'
  },
  {
    id: 7,
    organizerId: 3,
    title: 'City Marathon Meetup',
    description: 'Casual group run and post-run breakfast along Marina Beach.',
    category: 'Sports & Fitness',
    start_time: new Date(Date.now() + 7 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 7 * 86400000 + 2 * 3600000).toISOString(),
    venue_name: 'Marina Beach',
    venue_lat: 13.0500,
    venue_lng: 80.2824,
    capacity: 100,
    price: 0,
    banner_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'solo_only',
    team_required: 0
  },
  {
    id: 8,
    organizerId: 3,
    title: 'Live Jazz Night',
    description: 'Evening of live jazz tunes from local bands.',
    category: 'Music & Concerts',
    start_time: new Date(Date.now() + 4 * 86400000).toISOString(),
    end_time: new Date(Date.now() + 4 * 86400000 + 3 * 3600000).toISOString(),
    venue_name: 'The Music Academy',
    venue_lat: 13.0384,
    venue_lng: 80.2534,
    capacity: 120,
    price: 250,
    banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'solo_only',
    team_required: 0,
    organizer_upi_id: 'kavya.nair@upi'
  },
  {
    id: 9,
    organizerId: 1,
    title: 'Startup Networking Mixer',
    description: 'Informal mixer for founders and early employees.',
    category: 'Business & Networking',
    start_time: new Date(Date.now() - 5 * 86400000).toISOString(),
    end_time: new Date(Date.now() - 5 * 86400000 + 2 * 3600000).toISOString(),
    venue_name: 'The Blue Cafe',
    venue_lat: 13.0067,
    venue_lng: 80.2206,
    capacity: 50,
    price: 100,
    banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    participation_mode: 'solo_only',
    team_required: 0,
    organizer_upi_id: 'priya.sharma@upi'
  }
];

const mockTeams = [
  // Event 1 (TechConnect Hackathon)
  { id: 1, eventId: 1, leaderId: 4, name: 'PixelForge', desc: 'Building a mobile-first event discovery tool.', pitch: 'An AI concierge that recommends events based on your calendar gaps and preference vector similarity.', skills: JSON.stringify(['Backend Development', 'Machine Learning/AI']), min: 2, max: 4, current: 3, status: 'open' },
  { id: 2, eventId: 1, leaderId: 8, name: 'DataMinds', desc: 'ML-heavy project on personalized recommendations.', pitch: 'Recommendation engine that explains its own suggestions in plain language.', skills: JSON.stringify(['Frontend Development', 'Data Science']), min: 2, max: 4, current: 1, status: 'incomplete' },
  { id: 3, eventId: 1, leaderId: 11, name: 'ChainCrafters', desc: 'Exploring blockchain ticketing for events.', pitch: 'Tamper-proof event ticketing using signed on-chain tokens.', skills: JSON.stringify(['Frontend Development', 'UI/UX Design']), min: 2, max: 4, current: 4, status: 'full' },
  
  // Event 5 (Web3 Builders Sprint)
  { id: 4, eventId: 5, leaderId: 13, name: 'ZeroKnowledge', desc: 'Privacy-preserving voting dApp.', pitch: 'A zk-proof based voting system for DAOs with zero identity leakage.', skills: JSON.stringify(['Frontend Development', 'Domain Expert: Fintech']), min: 2, max: 4, current: 2, status: 'open' },
  { id: 5, eventId: 5, leaderId: 11, name: 'BlockBuilders', desc: 'NFT-based event ticket marketplace.', pitch: 'Secondary market for event tickets with anti-scalping logic.', skills: JSON.stringify(['UI/UX Design', 'Product/Pitching']), min: 2, max: 4, current: 1, status: 'incomplete' },

  // Event 6 (Product Design Bootcamp)
  { id: 6, eventId: 6, leaderId: 12, name: 'FlowState', desc: 'Redesigning onboarding flow for fintech app.', pitch: 'A 3-screen onboarding layout that cuts user drop-off by half.', skills: JSON.stringify(['UI/UX Design', 'Frontend Development']), min: 2, max: 3, current: 2, status: 'open' },
  { id: 7, eventId: 6, leaderId: 7, name: 'DesignOps', desc: 'Design token component system.', pitch: 'A unified design system library in Tailwind and Figma components.', skills: JSON.stringify(['Frontend Development', 'Product/Pitching']), min: 2, max: 3, current: 1, status: 'incomplete' }
];

const mockRegistrations = [
  // Event 1 (TechConnect Hackathon): Teams & Solos
  { id: 1, userId: 4, eventId: 1, status: 'confirmed', pType: 'team', teamId: 1, qr: 'mock-qr-token-0001', checkedIn: null },
  { id: 2, userId: 5, eventId: 1, status: 'confirmed', pType: 'team', teamId: 1, qr: 'mock-qr-token-0002', checkedIn: null },
  { id: 3, userId: 8, eventId: 1, status: 'confirmed', pType: 'team', teamId: 2, qr: 'mock-qr-token-0003', checkedIn: null },
  { id: 4, userId: 11, eventId: 1, status: 'confirmed', pType: 'team', teamId: 3, qr: 'mock-qr-token-0004', checkedIn: null },
  { id: 5, userId: 6, eventId: 1, status: 'confirmed', pType: 'team', teamId: 3, qr: 'mock-qr-token-0005', checkedIn: null },
  { id: 6, userId: 7, eventId: 1, status: 'confirmed', pType: 'team', teamId: 3, qr: 'mock-qr-token-0006', checkedIn: null },
  { id: 7, userId: 10, eventId: 1, status: 'confirmed', pType: 'team', teamId: 3, qr: 'mock-qr-token-0007', checkedIn: null },
  { id: 8, userId: 13, eventId: 1, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0008', checkedIn: null }, // Solo
  { id: 9, userId: 14, eventId: 1, status: 'confirmed', pType: 'team', teamId: 1, qr: 'mock-qr-token-0009', checkedIn: null },
  { id: 10, userId: 9, eventId: 1, status: 'waitlisted', pType: 'solo', teamId: null, qr: null, checkedIn: null },
  { id: 24, userId: 12, eventId: 1, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0024', checkedIn: null }, // Solo
  { id: 25, userId: 15, eventId: 1, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0025', checkedIn: null }, // Solo
  { id: 26, userId: 16, eventId: 1, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0026', checkedIn: null }, // Solo

  // Event 5 (Web3 Builders Sprint): Teams & Solos
  { id: 11, userId: 13, eventId: 5, status: 'confirmed', pType: 'team', teamId: 4, qr: 'mock-qr-token-0010', checkedIn: null },
  { id: 12, userId: 9, eventId: 5, status: 'confirmed', pType: 'team', teamId: 4, qr: 'mock-qr-token-0011', checkedIn: null },
  { id: 13, userId: 11, eventId: 5, status: 'confirmed', pType: 'team', teamId: 5, qr: 'mock-qr-token-0012', checkedIn: null },
  { id: 14, userId: 12, eventId: 5, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0013', checkedIn: null }, // Solo
  { id: 27, userId: 6, eventId: 5, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0027', checkedIn: null }, // Solo
  { id: 28, userId: 10, eventId: 5, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0028', checkedIn: null }, // Solo
  { id: 29, userId: 14, eventId: 5, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0029', checkedIn: null }, // Solo

  // Event 6 (Product Design Bootcamp): Teams & Solos
  { id: 15, userId: 12, eventId: 6, status: 'confirmed', pType: 'team', teamId: 6, qr: 'mock-qr-token-0014', checkedIn: null },
  { id: 16, userId: 7, eventId: 6, status: 'confirmed', pType: 'team', teamId: 7, qr: 'mock-qr-token-0015', checkedIn: null },
  { id: 30, userId: 5, eventId: 6, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0030', checkedIn: null }, // Solo
  { id: 31, userId: 8, eventId: 6, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0031', checkedIn: null }, // Solo
  { id: 32, userId: 13, eventId: 6, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0032', checkedIn: null }, // Solo
  { id: 33, userId: 14, eventId: 6, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0033', checkedIn: null }, // Solo

  // Other Events
  { id: 17, userId: 15, eventId: 4, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0016', checkedIn: null },
  { id: 18, userId: 16, eventId: 8, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0017', checkedIn: null },
  { id: 19, userId: 5, eventId: 3, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0018', checkedIn: null },
  { id: 20, userId: 4, eventId: 3, status: 'cancelled', pType: 'solo', teamId: null, qr: null, checkedIn: null },

  { id: 21, userId: 12, eventId: 9, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0019', checkedIn: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 22, userId: 5, eventId: 9, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0020', checkedIn: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 23, userId: 13, eventId: 9, status: 'confirmed', pType: 'solo', teamId: null, qr: 'mock-qr-token-0021', checkedIn: new Date(Date.now() - 5 * 86400000).toISOString() },

  // Demo paid-event pending payments (event 2 = Startup Pitch Night ₹200, event 3 = AI/ML Workshop ₹150)
  { id: 34, userId: 6, eventId: 2, status: 'pending_payment', pType: 'solo', teamId: null, qr: null, checkedIn: null, paymentStatus: 'awaiting_verification' },
  { id: 35, userId: 7, eventId: 2, status: 'pending_payment', pType: 'solo', teamId: null, qr: null, checkedIn: null, paymentStatus: 'awaiting_verification' },
  { id: 36, userId: 10, eventId: 3, status: 'pending_payment', pType: 'solo', teamId: null, qr: null, checkedIn: null, paymentStatus: 'awaiting_verification' }
];

const mockJoinRequests = [
  { id: 1, teamId: 1, requesterId: 13, message: 'I have fintech domain knowledge, would love to join for the pitching angle.', status: 'pending', initiatedBy: 'member_request' },
  { id: 2, teamId: 1, requesterId: 14, message: 'Full-stack dev here, can help with backend if needed.', status: 'accepted', initiatedBy: 'member_request' },
  { id: 3, teamId: 2, requesterId: 9, message: 'Frontend + data viz — think I would fit your DataMinds project well.', status: 'pending', initiatedBy: 'member_request' },
  { id: 4, teamId: 5, requesterId: 9, message: 'Data scientist looking for a team, happy to help with NFT scoring logic.', status: 'rejected', initiatedBy: 'member_request' },
  { id: 5, teamId: 4, requesterId: 12, message: 'Leader invite: your product/pitching background would round out the team.', status: 'pending', initiatedBy: 'leader_invite' },
  { id: 6, teamId: 6, requesterId: 14, message: 'Leader invite: we need another dev for FlowState, interested?', status: 'pending', initiatedBy: 'leader_invite' },
  { id: 7, teamId: 3, requesterId: 13, message: 'Requesting to join — interested in blockchain ticketing.', status: 'rejected', initiatedBy: 'member_request' },
  { id: 8, teamId: 7, requesterId: 5, message: 'Backend developer interested in scaling your DesignOps design tokens.', status: 'pending', initiatedBy: 'member_request' }
];

const mockNotifications = [
  { id: 1, userId: 4, type: 'team_join_request', message: 'Ishita Bose requested to join PixelForge.', isRead: false },
  { id: 2, userId: 4, type: 'team_join_accepted', message: 'You accepted Farhan Sheikh into PixelForge.', isRead: true },
  { id: 3, userId: 8, type: 'team_join_request', message: 'Divya Krishnan requested to join DataMinds.', isRead: false },
  { id: 4, userId: 9, type: 'team_join_rejected', message: 'Your request to join BlockBuilders was declined.', isRead: true },
  { id: 5, userId: 12, type: 'team_leader_invite', message: 'Ishita Bose invited you to join ZeroKnowledge.', isRead: false },
  { id: 6, userId: 14, type: 'team_leader_invite', message: 'Nikhil Joshi invited you to join FlowState.', isRead: true },
  { id: 7, userId: 9, type: 'registration_waitlisted', message: 'You have been waitlisted for TechConnect Hackathon 2026.', isRead: false },
  { id: 8, userId: 13, type: 'registration_confirmed', message: 'Your registration for TechConnect Hackathon 2026 is confirmed.', isRead: true },
  { id: 9, userId: 4, type: 'registration_confirmed', message: 'Your registration for TechConnect Hackathon 2026 is confirmed.', isRead: true },
  { id: 10, userId: 15, type: 'registration_confirmed', message: 'Your registration for Sunrise Yoga & Meditation is confirmed.', isRead: true }
];

const mockReviews = [
  { id: 1, userId: 12, eventId: 9, rating: 5, comment: 'Great turnout, met some genuinely useful connections.' },
  { id: 2, userId: 5, eventId: 9, rating: 4, comment: 'Good energy, venue was a bit cramped though.' },
  { id: 3, userId: 13, eventId: 9, rating: 5, comment: "Best networking event I've been to this quarter." }
];

const mockInteractions = [
  { userId: 4, eventId: 1, action: 'view' },
  { userId: 4, eventId: 1, action: 'register' },
  { userId: 5, eventId: 1, action: 'view' },
  { userId: 5, eventId: 1, action: 'register' },
  { userId: 8, eventId: 1, action: 'view' },
  { userId: 8, eventId: 1, action: 'register' },
  { userId: 9, eventId: 5, action: 'view' },
  { userId: 9, eventId: 1, action: 'view' },
  { userId: 9, eventId: 1, action: 'register' },
  { userId: 12, eventId: 9, action: 'view' },
  { userId: 12, eventId: 9, action: 'register' },
  { userId: 12, eventId: 9, action: 'rate' },
  { userId: 5, eventId: 9, action: 'rate' },
  { userId: 13, eventId: 9, action: 'rate' },
  { userId: 16, eventId: 8, action: 'view' },
  { userId: 16, eventId: 8, action: 'register' },
  { userId: 15, eventId: 4, action: 'view' },
  { userId: 15, eventId: 4, action: 'register' },
  { userId: 7, eventId: 3, action: 'view' },
  { userId: 4, eventId: 3, action: 'cancel' }
];

const seed = async () => {
  try {
    console.log('Initializing SQLite database schema...');
    await initDb();

    console.log('Clearing existing records for fresh re-seed...');
    await run('DELETE FROM user_interactions');
    await run('DELETE FROM reviews');
    await run('DELETE FROM notifications');
    await run('DELETE FROM team_join_requests');
    await run('DELETE FROM registrations');
    await run('DELETE FROM teams');
    await run('DELETE FROM events');
    await run('DELETE FROM user_preferences');
    await run('DELETE FROM users');

    console.log('Seeding 16 users...');
    for (const u of mockUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      await run(
        'INSERT INTO users (id, name, email, password_hash, role, bio, skills) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.name, u.email, hash, u.role, u.bio, u.skills]
      );
    }

    console.log('Seeding user preferences...');
    for (const p of mockPreferences) {
      await run(
        'INSERT INTO user_preferences (user_id, categories, budget_pref, time_pref) VALUES (?, ?, ?, ?)',
        [p.userId, p.categories, p.budget_pref, p.time_pref]
      );
    }

    console.log('Seeding 9 events...');
    for (const ev of mockEvents) {
      await run(`
        INSERT INTO events (
          id, organizer_id, title, description, category, start_time, end_time,
          venue_name, venue_lat, venue_lng, capacity, price, banner_url,
          participation_mode, max_team_size, team_required, team_lock_time, organizer_upi_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ev.id, ev.organizerId, ev.title, ev.description, ev.category, ev.start_time, ev.end_time,
        ev.venue_name, ev.venue_lat, ev.venue_lng, ev.capacity, ev.price, ev.banner_url,
        ev.participation_mode, ev.max_team_size || 4, ev.team_required, ev.team_lock_time || null,
        ev.organizer_upi_id || null
      ]);
    }

    console.log('Seeding teams...');
    for (const t of mockTeams) {
      await run(`
        INSERT INTO teams (
          id, event_id, leader_id, team_name, description, project_pitch,
          required_skills, min_size, max_size, current_size, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        t.id, t.eventId, t.leaderId, t.name, t.desc, t.pitch,
        t.skills, t.min, t.max, t.current, t.status
      ]);
    }

    console.log('Seeding registrations...');
    for (const r of mockRegistrations) {
      await run(`
        INSERT INTO registrations (
          id, user_id, event_id, status, participation_type, team_id, qr_token, checked_in_at, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        r.id, r.userId, r.eventId, r.status, r.pType, r.teamId, r.qr, r.checkedIn,
        r.paymentStatus || (r.qr ? 'not_required' : (r.status === 'pending_payment' ? 'awaiting_verification' : 'not_required'))
      ]);
    }

    console.log('Seeding team join requests...');
    for (const req of mockJoinRequests) {
      await run(`
        INSERT INTO team_join_requests (
          id, team_id, requester_id, message, status, initiated_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        req.id, req.teamId, req.requesterId, req.message, req.status, req.initiatedBy || 'member_request'
      ]);
    }

    console.log('Seeding notifications...');
    for (const n of mockNotifications) {
      await run(`
        INSERT INTO notifications (id, user_id, type, message, is_read) VALUES (?, ?, ?, ?, ?)
      `, [n.id, n.userId, n.type, n.message, n.isRead ? 1 : 0]);
    }

    console.log('Seeding reviews...');
    for (const rev of mockReviews) {
      await run(`
        INSERT INTO reviews (id, user_id, event_id, rating, comment) VALUES (?, ?, ?, ?, ?)
      `, [rev.id, rev.userId, rev.eventId, rev.rating, rev.comment]);
    }

    console.log('Seeding user interactions...');
    for (const act of mockInteractions) {
      await run(`
        INSERT INTO user_interactions (user_id, event_id, action_type) VALUES (?, ?, ?)
      `, [act.userId, act.eventId, act.action]);
    }

    console.log('✅ SQLite database re-seeded successfully with robust open teams & solo participants!');
  } catch (err) {
    console.error('Seed error:', err);
  }
};

if (require.main === module) {
  seed();
}

module.exports = { seed };
