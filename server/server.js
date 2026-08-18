const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDb } = require('./config/db');
const { seed } = require('./db/seed');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./auth/auth.routes');
const eventsRoutes = require('./events/events.routes');
const registrationsRoutes = require('./registrations/registrations.routes');
const recommendationsRoutes = require('./recommendations/recommend.routes');
const teamsRoutes = require('./teams/teams.routes');
const notificationsRoutes = require('./notifications/notifications.routes');
const reviewsRoutes = require('./reviews/reviews.routes');
const analyticsRoutes = require('./analytics/analytics.routes');
const checkinRoutes = require('./checkin/checkin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/checkin', checkinRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'EventConnect API', version: '1.0.0' });
});

// Startup Database Initialization & Launch
const startServer = async () => {
  try {
    await initDb();
    console.log('Database initialized successfully.');

    // Only seed locally or if explicitly requested
    if (process.env.NODE_ENV !== 'production') {
       // await seed();
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 EventConnect Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer();
