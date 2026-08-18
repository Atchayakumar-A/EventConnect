import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Check, X, Sparkles, UserCheck, Send, Shield, MessageSquare, Award, Clock, AlertTriangle, UserPlus } from 'lucide-react';

const HACKATHON_SKILL_TAGS = [
  'Frontend Development',
  'Backend Development',
  'Mobile Dev',
  'UI/UX Design',
  'Machine Learning/AI',
  'Data Science',
  'DevOps/Cloud',
  'Blockchain',
  'Product/Pitching',
  'Domain Expert'
];

export const TeamsTab = ({ eventId, event }) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'solos', 'create', 'leader'
  const [teams, setTeams] = useState([]);
  const [solos, setSolos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myLeaderTeam, setMyLeaderTeam] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeStr, setLockTimeStr] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state for Create Team
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [projectPitch, setProjectPitch] = useState('');
  const [domainExpertSubtag, setDomainExpertSubtag] = useState('');
  const [requiredSkills, setRequiredSkills] = useState(['Frontend Development', 'Backend Development']);
  const [maxSize, setMaxSize] = useState(event.max_team_size || 4);
  const [minSize, setMinSize] = useState(2);
  const [createLoading, setCreateLoading] = useState(false);

  // Join Request / Invite modal state
  const [selectedTeamForJoin, setSelectedTeamForJoin] = useState(null);
  const [selectedSoloForInvite, setSelectedSoloForInvite] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // Profile modal state
  const [inspectedLeader, setInspectedLeader] = useState(null);

  const { user } = useAuth();

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/teams/event/${eventId}`);
      setTeams(data.teams || []);
      setIsLocked(Boolean(data.isLocked));
      setLockTimeStr(data.team_lock_time);

      // Check if logged-in user is a leader of any team in this event
      const userTeam = (data.teams || []).find(t => t.leader_id === user?.id);
      if (userTeam) {
        setMyLeaderTeam(userTeam);
        fetchLeaderRequests(userTeam.id);
      }

      // Fetch solo participants for reverse board
      const solosData = await api.get(`/teams/event/${eventId}/solos`);
      setSolos(solosData || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderRequests = async (teamId) => {
    try {
      const data = await api.get(`/teams/${teamId}/requests`);
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load team requests:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [eventId]);

  const toggleSkill = (skill) => {
    if (requiredSkills.includes(skill)) {
      setRequiredSkills(requiredSkills.filter(s => s !== skill));
    } else {
      setRequiredSkills([...requiredSkills, skill]);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (isLocked) {
      alert('Team formation is closed for this event.');
      return;
    }

    setCreateLoading(true);
    try {
      let finalSkills = [...requiredSkills];
      if (requiredSkills.includes('Domain Expert') && domainExpertSubtag.trim()) {
        finalSkills = finalSkills.map(s => s === 'Domain Expert' ? `Domain Expert: ${domainExpertSubtag.trim()}` : s);
      }

      await api.post('/teams', {
        event_id: eventId,
        team_name: teamName,
        description,
        project_pitch: projectPitch || description,
        required_skills: finalSkills,
        max_size: maxSize,
        min_size: minSize
      });

      setTeamName('');
      setDescription('');
      setProjectPitch('');
      fetchTeams();
      setActiveTab('browse');
    } catch (err) {
      alert(err.message || 'Failed to create team');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSendJoinRequest = async () => {
    if (!selectedTeamForJoin) return;
    setJoinLoading(true);
    try {
      await api.post(`/teams/${selectedTeamForJoin.id}/join`, {
        message: joinMessage
      });

      alert('Join request sent to team leader!');
      setSelectedTeamForJoin(null);
      setJoinMessage('');
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to send join request');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedSoloForInvite || !myLeaderTeam) return;
    setJoinLoading(true);
    try {
      await api.post(`/teams/${myLeaderTeam.id}/invite`, {
        target_user_id: selectedSoloForInvite.id,
        message: joinMessage || `Join our team "${myLeaderTeam.team_name}"!`
      });

      alert(`Invitation sent to ${selectedSoloForInvite.name}!`);
      setSelectedSoloForInvite(null);
      setJoinMessage('');
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to send invitation');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      await api.post(`/teams/requests/${requestId}/respond`, { action });
      if (myLeaderTeam) fetchLeaderRequests(myLeaderTeam.id);
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to process request response');
    }
  };

  return (
    <div className="space-y-4 pt-2">

      {/* Deadline / Lock Status Banner */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 animate-in fade-in">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="block text-sm">Team Formation Closed</strong>
            <span>Team formation is now closed for this event deadline ({new Date(lockTimeStr).toLocaleString()}).</span>
          </div>
        </div>
      )}

      {/* Minimum Team Size Leader Incomplete Banner */}
      {myLeaderTeam && isLocked && myLeaderTeam.current_size < (myLeaderTeam.min_size || 2) && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3.5 rounded-2xl text-xs flex items-center space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <strong className="block text-sm text-red-800">Incomplete Team Warning</strong>
            <span>Your team has {myLeaderTeam.current_size} of minimum {myLeaderTeam.min_size || 2} required members — formation is now closed.</span>
          </div>
        </div>
      )}
      
      {/* Sub tabs */}
      <div className="bg-white p-1 rounded-2xl border border-[#E6E4DC] flex text-[11px] font-semibold shadow-calm-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'browse' ? 'bg-[#5F8670] text-white shadow-xs' : 'text-[#64748B]'
          }`}
        >
          Open Teams ({teams.length})
        </button>

        <button
          onClick={() => setActiveTab('solos')}
          className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'solos' ? 'bg-[#3A7CA5] text-white shadow-xs' : 'text-[#64748B]'
          }`}
        >
          Looking for Team ({solos.length})
        </button>

        {myLeaderTeam && (
          <button
            onClick={() => setActiveTab('leader')}
            className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all relative ${
              activeTab === 'leader' ? 'bg-[#3A7CA5] text-white shadow-xs' : 'text-[#64748B]'
            }`}
          >
            My Team ({requests.length})
            {requests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[9px] rounded-full">
                {requests.length}
              </span>
            )}
          </button>
        )}

        {!isLocked && (
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-2.5 rounded-xl whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'create' ? 'bg-[#5F8670] text-white shadow-xs' : 'text-[#64748B]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Form Team</span>
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#64748B]">Loading teams & participants...</div>
      ) : activeTab === 'browse' ? (
        teams.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E6E4DC] text-center space-y-2">
            <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h3 className="text-sm font-bold text-[#2D3748]">No teams formed yet</h3>
            <p className="text-xs text-[#64748B]">Be the first to create a team for this event!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map(team => (
              <div
                key={team.id}
                className="bg-white rounded-2xl border border-[#E6E4DC] p-4 space-y-3 shadow-calm-sm hover:border-[#5F8670]/40 transition-all"
              >
                {/* PROMINENT PROJECT PITCH DISPLAY */}
                <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#E6E4DC] space-y-1">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[#3A7CA5]">
                    <span>🚀 Project Idea / Pitch</span>
                    <span className="bg-[#E8EFEA] text-[#5F8670] px-2 py-0.5 rounded-full text-[10px] font-semibold lowercase">
                      {team.current_size} / {team.max_size} Members
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#2D3748] leading-relaxed">
                    "{team.project_pitch || team.description}"
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-[#2D3748]">{team.team_name}</h4>
                    <p className="text-xs text-[#64748B]">{team.description}</p>
                  </div>
                </div>

                {/* Required Skills & Skill Match Indicator */}
                <div className="space-y-1.5 pt-1 border-t border-[#E6E4DC]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#64748B]">Required Roles:</span>
                    <span className="text-[11px] font-bold text-[#3A7CA5] bg-[#E8F2F8] px-2 py-0.5 rounded-full">
                      ✨ {team.matchText}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {team.required_skills.map(s => (
                      <span key={s} className="bg-[#FAF9F5] border border-[#E6E4DC] text-[#2D3748] px-2 py-0.5 rounded-full text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Team Leader Badge & Join Request Action */}
                <div className="pt-2 border-t border-[#E6E4DC] flex items-center justify-between">
                  <button
                    onClick={() => setInspectedLeader(team.leader)}
                    className="flex items-center space-x-1.5 text-xs text-[#5F8670] font-semibold hover:underline"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Leader: {team.leader.name}</span>
                  </button>

                  {team.leader_id !== user?.id && !isLocked && (
                    <button
                      onClick={() => setSelectedTeamForJoin(team)}
                      disabled={team.status === 'full'}
                      className="bg-[#5F8670] hover:bg-[#486856] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      {team.status === 'full' ? 'Team Full' : 'Request to Join'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'solos' ? (
        /* Solo Participant Board ("Looking for a Team") */
        solos.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E6E4DC] text-center space-y-2">
            <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h3 className="text-sm font-bold text-[#2D3748]">No solo participants looking</h3>
            <p className="text-xs text-[#64748B]">All registered attendees are currently assigned to teams.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solos.map(solo => (
              <div key={solo.id} className="bg-white rounded-2xl border border-[#E6E4DC] p-4 space-y-3 shadow-calm-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#2D3748]">{solo.name}</h4>
                    <p className="text-xs text-[#64748B]">{solo.bio || 'Solo attendee ready for a team.'}</p>
                  </div>
                  <span className="text-[11px] font-semibold bg-[#E8F2F8] text-[#3A7CA5] px-2 py-0.5 rounded-full">
                    Solo Participant
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2 text-[#64748B]">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Past Events Attended: <strong>{solo.past_events_count}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(solo.skills || []).map(s => (
                      <span key={s} className="bg-[#FAF9F5] border border-[#E6E4DC] text-[#2D3748] px-2 py-0.5 rounded-full text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {myLeaderTeam && !isLocked && solo.id !== user?.id && (
                  <button
                    onClick={() => setSelectedSoloForInvite(solo)}
                    className="w-full bg-[#3A7CA5] hover:bg-[#2B5B7A] text-white text-xs font-bold py-2 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite {solo.name} to {myLeaderTeam.team_name}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'leader' ? (
        /* Team Leader Review Panel */
        <div className="space-y-3">
          <div className="bg-[#E8F2F8] p-3 rounded-2xl border border-[#3A7CA5]/20 text-xs text-[#2B5B7A]">
            Reviewing requests & invites for <strong>{myLeaderTeam?.team_name}</strong> ({myLeaderTeam?.current_size}/{myLeaderTeam?.max_size} members).
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#E6E4DC] text-center text-xs text-[#64748B]">
              No pending join requests at the moment.
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-[#E6E4DC] p-4 space-y-3 shadow-calm-sm">
                
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#2D3748]">{req.requester.name}</h4>
                    <p className="text-[11px] text-[#64748B]">{req.requester.bio || 'No bio provided.'}</p>
                  </div>
                  <span className="text-xs font-bold bg-[#E8EFEA] text-[#5F8670] px-2 py-0.5 rounded-full">
                    {req.matchPercentage}% Skill Match
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2 text-[#64748B]">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Past Events Attended: <strong>{req.requester.past_events_count}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {req.requester.skills.map(s => (
                      <span key={s} className="bg-[#FAF9F5] border border-[#E6E4DC] text-[#2D3748] px-2 py-0.5 rounded-full text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {req.message && (
                  <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E6E4DC] text-xs text-[#64748B] italic">
                    "{req.message}"
                  </div>
                )}

                <div className="flex space-x-2 pt-1 border-t border-[#E6E4DC]">
                  <button
                    onClick={() => handleRespondRequest(req.id, 'accept')}
                    className="flex-1 bg-[#5F8670] hover:bg-[#486856] text-white text-xs font-bold py-2 rounded-xl shadow-xs transition-colors"
                  >
                    Accept Member
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'reject')}
                    className="w-1/3 bg-[#F4F3ED] hover:bg-red-50 text-[#64748B] hover:text-red-600 text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Create Team Form */
        <form onSubmit={handleCreateTeam} className="bg-white p-5 rounded-3xl border border-[#E6E4DC] shadow-calm-sm space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[#2D3748] block">Team Name</label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Neural Hackers"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#3A7CA5] block">Project Idea / Pitch</label>
            <textarea
              rows="3"
              required
              value={projectPitch}
              onChange={(e) => setProjectPitch(e.target.value)}
              placeholder="What are you building? What's the problem statement and rough tech stack?"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#3A7CA5] bg-[#FAF9F5]"
            ></textarea>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#2D3748] block">Short Team Overview</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief tagline or description..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
            />
          </div>

          {/* Curated Hackathon Skill Tags Multi-select */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#2D3748] block">Required Roles & Skills</label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {HACKATHON_SKILL_TAGS.map(skill => {
                const isSel = requiredSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      isSel
                        ? 'bg-[#5F8670] border-[#5F8670] text-white'
                        : 'bg-[#FAF9F5] border-[#E6E4DC] text-[#64748B]'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>

            {requiredSkills.includes('Domain Expert') && (
              <div className="pt-1.5 space-y-1">
                <label className="text-[11px] font-semibold text-[#3A7CA5] block">Specify Domain Expertise</label>
                <input
                  type="text"
                  value={domainExpertSubtag}
                  onChange={(e) => setDomainExpertSubtag(e.target.value)}
                  placeholder="e.g. Healthcare, Fintech, EdTech..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] bg-[#FAF9F5]"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-[#2D3748] block">Min Team Size</label>
              <input
                type="number"
                min="2"
                value={minSize}
                onChange={(e) => setMinSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] bg-[#FAF9F5]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2D3748] block">Max Team Size</label>
              <input
                type="number"
                min="2"
                max={event.max_team_size || 8}
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E6E4DC] bg-[#FAF9F5]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createLoading}
            className="w-full bg-[#5F8670] hover:bg-[#486856] text-white font-bold py-3 rounded-2xl text-xs shadow-sm transition-all"
          >
            {createLoading ? 'Forming Team...' : 'Create Hackathon Team'}
          </button>
        </form>
      )}

      {/* Send Join Request Modal */}
      {selectedTeamForJoin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E6E4DC] shadow-calm-lg">
            <h3 className="text-base font-bold text-[#2D3748]">Join {selectedTeamForJoin.team_name}</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#64748B] block">Intro Message for Team Leader</label>
              <textarea
                rows="3"
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Mention your relevant skills and why you want to join..."
                className="w-full p-3 rounded-2xl border border-[#E6E4DC] text-xs focus:outline-none focus:border-[#5F8670] bg-[#FAF9F5]"
              ></textarea>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSendJoinRequest}
                disabled={joinLoading}
                className="w-full bg-[#5F8670] hover:bg-[#486856] text-white font-bold py-2.5 rounded-2xl text-xs shadow-sm transition-colors"
              >
                {joinLoading ? 'Sending Request...' : 'Send Request'}
              </button>
              <button
                onClick={() => setSelectedTeamForJoin(null)}
                className="w-full bg-[#F4F3ED] text-[#64748B] font-semibold py-2.5 rounded-2xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Leader Invite Modal */}
      {selectedSoloForInvite && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E6E4DC] shadow-calm-lg">
            <h3 className="text-base font-bold text-[#2D3748]">Invite {selectedSoloForInvite.name}</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#64748B] block">Invitation Message</label>
              <textarea
                rows="3"
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder={`Hey ${selectedSoloForInvite.name}, we loved your profile and want you to join our team!`}
                className="w-full p-3 rounded-2xl border border-[#E6E4DC] text-xs focus:outline-none focus:border-[#3A7CA5] bg-[#FAF9F5]"
              ></textarea>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSendInvite}
                disabled={joinLoading}
                className="w-full bg-[#3A7CA5] hover:bg-[#2B5B7A] text-white font-bold py-2.5 rounded-2xl text-xs shadow-sm transition-colors"
              >
                {joinLoading ? 'Sending Invite...' : 'Send Team Invitation'}
              </button>
              <button
                onClick={() => setSelectedSoloForInvite(null)}
                className="w-full bg-[#F4F3ED] text-[#64748B] font-semibold py-2.5 rounded-2xl text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Leader Profile Modal */}
      {inspectedLeader && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#E6E4DC] shadow-calm-lg text-center relative">
            <button
              onClick={() => setInspectedLeader(null)}
              className="absolute top-4 right-4 text-[#64748B] p-1 rounded-full bg-[#FAF9F5]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#E8EFEA] text-[#5F8670] border-2 border-[#5F8670] flex items-center justify-center mx-auto text-lg font-bold">
              {inspectedLeader.name.charAt(0)}
            </div>

            <div>
              <h3 className="text-base font-bold text-[#2D3748]">{inspectedLeader.name}</h3>
              <p className="text-xs text-[#64748B]">{inspectedLeader.bio || 'No bio provided.'}</p>
            </div>

            <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#E6E4DC] text-xs space-y-2">
              <div>Past Events Attended: <strong>{inspectedLeader.past_events_count}</strong></div>
              <div className="flex flex-wrap justify-center gap-1">
                {(inspectedLeader.skills || []).map(s => (
                  <span key={s} className="bg-white border border-[#E6E4DC] text-[#2D3748] px-2 py-0.5 rounded-full text-[10px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setInspectedLeader(null)}
              className="w-full bg-[#5F8670] text-white font-semibold py-2.5 rounded-2xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
