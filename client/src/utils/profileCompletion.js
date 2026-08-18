/**
 * Calculates profile completion percentage based on tracked fields:
 * - name (required at signup, 1 point)
 * - bio (1 point if non-empty)
 * - skills[] (1 point if array length > 0)
 * - preferences (1 point if categories set)
 * Total fields = 4
 */
export const calculateProfileCompletion = (user, preferences, localBio, localSkills) => {
  let filledCount = 0;
  const totalFields = 4;

  // 1. Name
  if (user?.name && user.name.trim().length > 0) {
    filledCount += 1;
  }

  // 2. Bio (use local state bio if provided, otherwise user.bio)
  const currentBio = localBio !== undefined ? localBio : user?.bio;
  if (currentBio && currentBio.trim().length > 0) {
    filledCount += 1;
  }

  // 3. Skills (use local state skills if provided, otherwise user.skills)
  const currentSkills = localSkills !== undefined ? localSkills : user?.skills;
  if (Array.isArray(currentSkills) && currentSkills.length > 0) {
    filledCount += 1;
  }

  // 4. Onboarding Preferences
  if (preferences && Array.isArray(preferences.categories) && preferences.categories.length > 0) {
    filledCount += 1;
  }

  return Math.round((filledCount / totalFields) * 100);
};
