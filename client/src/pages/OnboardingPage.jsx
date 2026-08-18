import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  'Music & Concerts',
  'Technology & Workshops',
  'Sports & Fitness',
  'Food & Drink',
  'Arts & Culture',
  'Business & Networking',
  'Comedy & Entertainment',
  'Education & Learning',
  'Community & Charity',
  'Festivals & Celebrations'
];

export const OnboardingPage = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState(['Technology & Workshops', 'Music & Concerts']);
  const [budgetPref, setBudgetPref] = useState('under_2000');
  const [timePref, setTimePref] = useState('weekends');
  const [loading, setLoading] = useState(false);

  const { savePreferences } = useAuth();

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await savePreferences({
        categories: selectedCategories,
        budget_pref: budgetPref,
        time_pref: timePref
      });
      onComplete();
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FAF9F5]">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#E6E4DC] shadow-calm-lg space-y-6">
        
        {/* Progress header */}
        <div className="flex items-center justify-between text-xs text-[#64748B] border-b border-[#E6E4DC] pb-3">
          <span className="font-semibold text-[#2D3748]">Personalize Feed</span>
          <span>Step {step} of 2</span>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#2D3748]">What interests you?</h2>
              <p className="text-xs text-[#64748B]">Select topics to tailor your event recommendations.</p>
            </div>

            {/* Multi-select Chips */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-72 overflow-y-auto pr-1">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-2 rounded-2xl text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-[#5F8670] border-[#5F8670] text-white shadow-xs scale-102'
                        : 'bg-[#FAF9F5] border-[#E6E4DC] text-[#2D3748] hover:bg-[#F4F3ED]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={selectedCategories.length === 0}
              onClick={() => setStep(2)}
              className="w-full bg-[#5F8670] hover:bg-[#486856] text-white font-semibold py-3 rounded-2xl text-xs shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>Next: Preferences</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#2D3748]">Budget & Timing</h2>
              <p className="text-xs text-[#64748B]">Help us filter events that match your lifestyle.</p>
            </div>

            {/* Budget options */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-[#2D3748] block">Budget Preference</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'free', label: 'Free only' },
                  { id: 'under_500', label: 'Under ₹500' },
                  { id: 'under_2000', label: 'Under ₹2000' },
                  { id: 'any', label: 'No limit' }
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBudgetPref(b.id)}
                    className={`p-2.5 rounded-2xl border text-center font-medium transition-all ${
                      budgetPref === b.id
                        ? 'border-[#3A7CA5] bg-[#E8F2F8] text-[#3A7CA5]'
                        : 'border-[#E6E4DC] bg-[#FAF9F5] text-[#2D3748]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time options */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-[#2D3748] block">Preferred Time</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'weekdays', label: 'Weekdays' },
                  { id: 'weekends', label: 'Weekends' },
                  { id: 'evenings', label: 'Evenings' },
                  { id: 'anytime', label: 'Anytime' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimePref(t.id)}
                    className={`p-2.5 rounded-2xl border text-center font-medium transition-all ${
                      timePref === t.id
                        ? 'border-[#5F8670] bg-[#E8EFEA] text-[#5F8670]'
                        : 'border-[#E6E4DC] bg-[#FAF9F5] text-[#2D3748]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-[#F4F3ED] hover:bg-[#E6E4DC] text-[#64748B] font-semibold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="w-2/3 bg-[#5F8670] hover:bg-[#486856] text-white font-semibold py-3 rounded-2xl text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{loading ? 'Saving...' : 'Finish Onboarding'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
