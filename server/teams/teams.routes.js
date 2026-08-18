const express = require('express');
const { run, get, query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('../notifications/notifications.service');

const router = express.Router();

// Helper to compute set intersection match count
const calculateSkillMatch = (userSkills = [], requiredSkills = []) => {
  const userSkillSet = new Set(userSkills.map(s => s.toLowerCase().trim()));
  let matchCount = 0;
  requiredSkills.forEach(reqSkill => {
    if (userSkillSet.has(reqSkill.toLowerCase().trim())) {
      matchCount++;
    }
  });
  return matchCount;
};

// GET /api/teams/event/:eventId - List open teams for an event sorted by skill match
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await get('SELECT team_lock_time, participation_mode FROM events WHERE id = ?', [eventId]);

    const isLocked = Boolean(
      event?.team_lock_time && new Date() > new Date(event.team_lock_time)
    );

    // Auto-expire pending requests & flag incomplete teams if past deadline
    if (isLocked) {
      await run(`
        UPDATE team_join_requests
        SET status = 'expired'
        WHERE status = 'pending' AND team_id IN (SELECT id FROM teams WHERE event_id = ?)
      `, [eventId]);

      await run(`
        UPDATE teams
        SET status = 'incomplete'
        WHERE event_id = ? AND current_size < min_size AND status = 'open'
      `, [eventId]);
    }

    // Fetch viewer skills
    const viewer = await get('SELECT skills FROM users WHERE id = ?', [req.user.id]);
    const viewerSkills = viewer ? JSON.parse(viewer.skills || '[]') : [];

    const teamsSql = `
      SELECT t.*, u.name as leader_name, u.bio as leader_bio, u.skills as leader_skills,
        (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id AND r.status IN ('confirmed', 'checked_in')) as leader_past_events
      FROM teams t
      JOIN users u ON t.leader_id = u.id
      WHERE t.event_id = ? AND t.status != 'closed'
      ORDER BY t.created_at DESC
    `;

    const result = await query(teamsSql, [eventId]);

    const formattedTeams = result.rows.map(team => {
      const reqSkills = JSON.parse(team.required_skills || '[]');
      const matchCount = calculateSkillMatch(viewerSkills, reqSkills);

      return {
        ...team,
        project_pitch: team.project_pitch || team.description || '',
        required_skills: reqSkills,
        leader: {
          id: team.leader_id,
          name: team.leader_name,
          bio: team.leader_bio || '',
          skills: JSON.parse(team.leader_skills || '[]'),
          past_events_count: team.leader_past_events || 0
        },
        matchCount,
        matchText: reqSkills.length > 0 ? `Matches ${matchCount} of ${reqSkills.length} required skills` : 'No specific skills required'
      };
    });

    // Sort by best skill match count descending
    formattedTeams.sort((a, b) => b.matchCount - a.matchCount);

    res.json({
      isLocked,
      team_lock_time: event?.team_lock_time || null,
      teams: formattedTeams
    });
  } catch (err) {
    console.error('Fetch event teams error:', err);
    res.status(500).json({ error: 'Failed to fetch event teams' });
  }
});

// GET /api/teams/event/:eventId/solos - Solo Participant Board ("Looking for a Team")
router.get('/event/:eventId/solos', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const sql = `
      SELECT u.id, u.name, u.email, u.bio, u.skills,
        (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id AND r.status IN ('confirmed', 'checked_in')) as past_events_count
      FROM registrations reg
      JOIN users u ON reg.user_id = u.id
      WHERE reg.event_id = ? AND reg.status IN ('confirmed', 'checked_in')
        AND (reg.team_id IS NULL OR reg.team_id = 0)
        AND u.id NOT IN (SELECT leader_id FROM teams WHERE event_id = ?)
      ORDER BY u.name ASC
    `;

    const result = await query(sql, [eventId, eventId]);

    const solos = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      skills: JSON.parse(user.skills || '[]'),
      past_events_count: user.past_events_count || 0
    }));

    res.json(solos);
  } catch (err) {
    console.error('Fetch solo participants error:', err);
    res.status(500).json({ error: 'Failed to fetch solo participants' });
  }
});

// POST /api/teams - Create a new team (Team Leader flow)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, team_name, description, project_pitch, required_skills, max_size, min_size } = req.body;

    if (!event_id || !team_name || !max_size) {
      return res.status(400).json({ error: 'event_id, team_name, and max_size are required' });
    }

    const event = await get('SELECT * FROM events WHERE id = ?', [event_id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Enforce team_lock_time check
    if (event.team_lock_time && new Date() > new Date(event.team_lock_time)) {
      return res.status(400).json({ error: 'Team formation deadline has passed for this event.' });
    }

    const skillsJson = JSON.stringify(required_skills || []);

    // Create team record
    const result = await run(`
      INSERT INTO teams (event_id, leader_id, team_name, description, project_pitch, required_skills, max_size, min_size, current_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      event_id,
      req.user.id,
      team_name.trim(),
      description || '',
      project_pitch || description || '',
      skillsJson,
      parseInt(max_size) || 4,
      parseInt(min_size) || 2
    ]);

    const teamId = result.id;

    // Ensure leader is registered for event and linked to team
    const reg = await get('SELECT id FROM registrations WHERE user_id = ? AND event_id = ?', [req.user.id, event_id]);
    if (reg) {
      await run('UPDATE registrations SET team_id = ? WHERE id = ?', [teamId, reg.id]);
    } else {
      await run(
        "INSERT INTO registrations (user_id, event_id, status, team_id) VALUES (?, ?, 'confirmed', ?)",
        [req.user.id, event_id, teamId]
      );
    }

    const createdTeam = await get('SELECT * FROM teams WHERE id = ?', [teamId]);

    res.status(201).json({
      message: 'Team created successfully',
      team: {
        ...createdTeam,
        required_skills: JSON.parse(createdTeam.required_skills || '[]')
      }
    });
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// POST /api/teams/:teamId/join - Solo Attendee sends join request
router.post('/:teamId/join', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { message } = req.body;

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const event = await get('SELECT team_lock_time FROM events WHERE id = ?', [team.event_id]);
    if (event?.team_lock_time && new Date() > new Date(event.team_lock_time)) {
      return res.status(400).json({ error: 'Team formation is closed for this event.' });
    }

    if (team.status === 'full' || team.current_size >= team.max_size) {
      return res.status(400).json({ error: 'This team is already full' });
    }

    if (team.leader_id === req.user.id) {
      return res.status(400).json({ error: 'You are the leader of this team' });
    }

    // Check existing request
    const existingReq = await get(
      'SELECT id, status FROM team_join_requests WHERE team_id = ? AND requester_id = ?',
      [teamId, req.user.id]
    );

    if (existingReq) {
      return res.status(400).json({ error: `You have already sent a join request to this team (status: ${existingReq.status})` });
    }

    const result = await run(
      "INSERT INTO team_join_requests (team_id, requester_id, message, initiated_by) VALUES (?, ?, ?, 'member_request')",
      [teamId, req.user.id, message || '']
    );

    // Fetch requester name for notification
    const requester = await get('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const notifyMsg = `${requester ? requester.name : 'An attendee'} requested to join your team "${team.team_name}".`;
    await createNotification(team.leader_id, 'team_request', notifyMsg);

    res.status(201).json({
      message: 'Join request sent successfully',
      requestId: result.id
    });
  } catch (err) {
    console.error('Join team request error:', err);
    res.status(500).json({ error: 'Failed to send join request' });
  }
});

// POST /api/teams/:teamId/invite - Team Leader invites a Solo Participant
router.post('/:teamId/invite', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { target_user_id, message } = req.body;

    if (!target_user_id) {
      return res.status(400).json({ error: 'target_user_id is required' });
    }

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the team leader can invite participants' });
    }

    const event = await get('SELECT team_lock_time FROM events WHERE id = ?', [team.event_id]);
    if (event?.team_lock_time && new Date() > new Date(event.team_lock_time)) {
      return res.status(400).json({ error: 'Team formation is closed for this event.' });
    }

    const existingReq = await get(
      'SELECT id FROM team_join_requests WHERE team_id = ? AND requester_id = ?',
      [teamId, target_user_id]
    );

    if (existingReq) {
      return res.status(400).json({ error: 'An invite or request is already pending for this participant' });
    }

    const result = await run(
      "INSERT INTO team_join_requests (team_id, requester_id, message, initiated_by) VALUES (?, ?, ?, 'leader_invite')",
      [teamId, target_user_id, message || `Join our team "${team.team_name}"!`]
    );

    await createNotification(
      target_user_id,
      'team_request',
      `The leader of team "${team.team_name}" invited you to join their team!`
    );

    res.status(201).json({
      message: 'Invitation sent to participant!',
      requestId: result.id
    });
  } catch (err) {
    console.error('Invite solo participant error:', err);
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

// GET /api/teams/:teamId/requests - Team Leader reviews join requests
router.get('/:teamId/requests', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;

    const team = await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the team leader can review join requests' });
    }

    const reqSkills = JSON.parse(team.required_skills || '[]');

    const sql = `
      SELECT r.*, u.name as requester_name, u.email as requester_email, u.bio as requester_bio, u.skills as requester_skills,
        (SELECT COUNT(*) FROM registrations reg WHERE reg.user_id = u.id AND reg.status IN ('confirmed', 'checked_in')) as requester_past_events
      FROM team_join_requests r
      JOIN users u ON r.requester_id = u.id
      WHERE r.team_id = ? AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `;

    const result = await query(sql, [teamId]);

    const formattedRequests = result.rows.map(row => {
      const skills = JSON.parse(row.requester_skills || '[]');
      const matchCount = calculateSkillMatch(skills, reqSkills);

      return {
        id: row.id,
        team_id: row.team_id,
        requester_id: row.requester_id,
        message: row.message,
        initiated_by: row.initiated_by || 'member_request',
        status: row.status,
        created_at: row.created_at,
        requester: {
          id: row.requester_id,
          name: row.requester_name,
          email: row.requester_email,
          bio: row.requester_bio || '',
          skills,
          past_events_count: row.requester_past_events || 0
        },
        matchCount,
        matchPercentage: reqSkills.length > 0 ? Math.round((matchCount / reqSkills.length) * 100) : 100
      };
    });

    formattedRequests.sort((a, b) => b.matchCount - a.matchCount);

    res.json({
      team,
      requests: formattedRequests
    });
  } catch (err) {
    console.error('Fetch team requests error:', err);
    res.status(500).json({ error: 'Failed to fetch team join requests' });
  }
});

// POST /api/teams/requests/:requestId/respond - Accept/Reject request
router.post('/requests/:requestId/respond', authenticateToken, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accept or reject' });
    }

    const joinReq = await get('SELECT * FROM team_join_requests WHERE id = ?', [requestId]);
    if (!joinReq) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    const team = await get('SELECT * FROM teams WHERE id = ?', [joinReq.team_id]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Verify permission: leader can accept member_request, target user can accept leader_invite
    const isLeader = team.leader_id === req.user.id;
    const isTargetUser = joinReq.requester_id === req.user.id;

    if (!isLeader && !isTargetUser) {
      return res.status(403).json({ error: 'You are not authorized to respond to this request' });
    }

    if (action === 'accept') {
      if (team.current_size >= team.max_size) {
        return res.status(400).json({ error: 'Team has reached its maximum size capacity' });
      }

      await run("UPDATE team_join_requests SET status = 'accepted' WHERE id = ?", [requestId]);

      const newSize = team.current_size + 1;
      const newStatus = newSize >= team.max_size ? 'full' : 'open';

      await run('UPDATE teams SET current_size = ?, status = ? WHERE id = ?', [newSize, newStatus, team.id]);

      // Ensure requester registration links to team_id
      const reg = await get('SELECT id FROM registrations WHERE user_id = ? AND event_id = ?', [joinReq.requester_id, team.event_id]);
      if (reg) {
        await run('UPDATE registrations SET team_id = ? WHERE id = ?', [team.id, reg.id]);
      } else {
        await run(
          "INSERT INTO registrations (user_id, event_id, status, team_id) VALUES (?, ?, 'confirmed', ?)",
          [joinReq.requester_id, team.event_id, team.id]
        );
      }

      const notifyUserId = isLeader ? joinReq.requester_id : team.leader_id;
      await createNotification(
        notifyUserId,
        'team_response',
        `Congratulations! Team request for "${team.team_name}" was accepted!`
      );

      res.json({ message: 'Join request accepted', teamStatus: newStatus });
    } else {
      await run("UPDATE team_join_requests SET status = 'rejected' WHERE id = ?", [requestId]);

      const notifyUserId = isLeader ? joinReq.requester_id : team.leader_id;
      await createNotification(
        notifyUserId,
        'team_response',
        `Request for team "${team.team_name}" was declined.`
      );

      res.json({ message: 'Join request rejected' });
    }
  } catch (err) {
    console.error('Respond to request error:', err);
    res.status(500).json({ error: 'Failed to process request response' });
  }
});

module.exports = router;
