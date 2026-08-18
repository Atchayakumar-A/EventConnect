import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { calculateProfileCompletion } from '../utils/profileCompletion';
import { User, Settings, LogOut, ShieldCheck, Sparkles, BarChart2, Bell, Award, Check, Plus, CheckCircle2, Wallet } from 'lucide-react';

const SKILL_TAGS = [
  'React', 'Node.js', 'Python', 'AI/ML', 'UI/UX Design',
  'PostgreSQL', 'Flutter', 'TypeScript', 'Java', 'Data Science',
  'Cloud/DevOps', 'Cybersecurity', 'Project Management'
];

export const ProfilePage = ({ onOpenOnboarding, onOpenAdmin }) => {
  const { user, preferences, logout } = useAuth();
  const [skills, setSkills] = useState(user?.skills || ['React', 'Node.js']);
  const [bio, setBio] = useState(user?.bio || '');
  const [defaultUpiId, setDefaultUpiId] = useState(user?.default_upi_id || '');
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const isOrganizer = user?.role === 'organizer';

  const completionPct = calculateProfileCompletion(user, preferences, bio, skills);

  const toggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { skills, bio, default_upi_id: defaultUpiId });
      user.skills = skills;
      user.bio = bio;
      user.default_upi_id = defaultUpiId;
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E4DC] shadow-calm-sm text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#E8EFEA] text-[#5F8670] border-2 border-[#5F8670] flex items-center justify-center mx-auto shadow-xs text-xl font-bold">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#2D3748]">{user?.name}</h2>
          <p className="text-xs text-[#64748B]">{user?.email}</p>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F3ED] text-[#2D3748] border border-[#E6E4DC]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5F8670]" />
            <span className="capitalize">{user?.role} Account</span>
          </div>

          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F2F8] text-[#3A7CA5]">
            <Award className="w-3.5 h-3.5" />
            <span>{user?.past_events_count || 0} Attended</span>
          </div>
        </div>
      </div>

      {/* Profile Completion Indicator Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E4DC] shadow-calm-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className={`w-4 h-4 ${completionPct === 100 ? 'text-[#5F8670]' : 'text-[#3A7CA5]'}`} />
            <span className="font-bold text-[#2D3748]">Profile Completion</span>
          </div>
          <span className={`font-bold text-xs ${completionPct === 100 ? 'text-[#5F8670]' : 'text-[#3A7CA5]'}`}>
            {completionPct}%
          </span>
        </div>

        <div className="w-full bg-[#F4F3ED] border border-[#E6E4DC] h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${completionPct === 100 ? 'bg-[#5F8670]' : 'bg-[#3A7CA5]'
              }`}
            style={{ width: `${completionPct}%` }}
          ></div>
        </div>

        <p className="text-xs text-[#64748B]">
          {completionPct < 100 ? (
            <span>Profile {completionPct}% complete — add skills to get better team matches</span>
          ) : (
            <span className="text-[#5F8670] font-semibold flex items-center">
              <Check className="w-3.5 h-3.5 inline mr-1" />
              Profile complete
            </span>
          )}
        </p>
      </div>

      {/* Skills & Bio Profile Extension Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E4DC] shadow-calm-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-[#3A7CA5]" />
            <h3 className="text-sm font-bold text-[#2D3748]">Team Skills & Bio</h3>
          </div>
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="text-xs text-[#3A7CA5] font-semibold hover:underline"
          >
            {editingProfile ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editingProfile ? (
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#2D3748] block">Bio / Summary</label>
              <textarea
                rows="2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your experience or developer background..."
                className="w-full p-2.5 rounded-2xl border border-[#E6E4DC] bg-[#FAF9F5] focus:outline-none focus:border-[#3A7CA5]"
              ></textarea>
            </div>

            {/* UPI ID for organizers */}
            {isOrganizer && (
              <div className="space-y-1">
                <label className="font-semibold text-[#2D3748] flex items-center space-x-1 block">
                  <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--accent, #C07D3A)' }} />
                  <span>Default UPI ID (pre-fills paid events)</span>
                </label>
                <input
                  type="text"
                  value={defaultUpiId}
                  onChange={(e) => setDefaultUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full p-2.5 rounded-2xl border border-[#E6E4DC] bg-[#FAF9F5] focus:outline-none focus:border-[#C07D3A] text-xs"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-[#2D3748] block">Your Technical Skills</label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {SKILL_TAGS.map(skill => {
                  const isSel = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${isSel
                          ? 'bg-[#3A7CA5] border-[#3A7CA5] text-white'
                          : 'bg-[#FAF9F5] border-[#E6E4DC] text-[#64748B]'
                        }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-[#3A7CA5] text-white font-bold py-2.5 rounded-2xl text-xs shadow-xs"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <p className="text-[#64748B] italic">{bio || 'No bio added yet. Click edit to add your bio.'}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map(s => (
                <span key={s} className="bg-[#E8F2F8] text-[#3A7CA5] px-2.5 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Preferences Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E4DC] shadow-calm-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#5F8670]" />
            <h3 className="text-sm font-bold text-[#2D3748]">Recommendation Profile</h3>
          </div>
          <button
            onClick={onOpenOnboarding}
            className="text-xs text-[#5F8670] font-semibold hover:underline"
          >
            Edit
          </button>
        </div>

        {preferences ? (
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[#64748B] block mb-1">Interests:</span>
              <div className="flex flex-wrap gap-1.5">
                {(preferences.categories || []).map(cat => (
                  <span key={cat} className="bg-[#E8EFEA] text-[#5F8670] px-2.5 py-0.5 rounded-full font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E6E4DC] text-[#64748B]">
              <div>Budget: <strong className="text-[#2D3748] capitalize">{preferences.budget_pref?.replace('_', ' ')}</strong></div>
              <div>Timing: <strong className="text-[#2D3748] capitalize">{preferences.time_pref}</strong></div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#64748B]">No preferences set. Click edit to customize recommendations.</p>
        )}
      </div>

      {/* Admin Panel Button */}
      <button
        onClick={onOpenAdmin}
        className="w-full bg-[#E8F2F8] hover:bg-[#3A7CA5] hover:text-white border border-[#3A7CA5]/30 text-[#3A7CA5] font-bold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
      >
        <BarChart2 className="w-4 h-4" />
        <span>Open Admin & Platform Analytics</span>
      </button>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full bg-[#FAF9F5] hover:bg-red-50 hover:border-red-200 border border-[#E6E4DC] text-red-600 font-bold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>

    </div >
  );
};
