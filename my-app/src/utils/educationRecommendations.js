export const normalize = (value) =>
  (value || "").toString().toLowerCase().trim();

export const toArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item)).filter(Boolean);
  }

  return value
    .split(",")
    .map((item) => normalize(item))
    .filter(Boolean);
};

export const unique = (arr) => [...new Set(arr.filter(Boolean))];

export const getProfileEducationTerms = (profile) => {
  if (!profile) return {
    majors: [],
    minors: [],
    skills: []
  };

  return {
    majors: toArray(profile.major),
    minors: toArray(profile.minors),
    skills: toArray(profile.skills)
  };
};

export const countMatches = (terms, text) => {
  let count = 0;

  for (const term of terms) {
    if (term && text.includes(term)) {
      count += 1;
    }
  }

  return count;
};

export const scoreProgram = (program, profileTerms) => {
  const title = normalize(program.title);
  const level = normalize(program.program_level);
  const type = normalize(program.program_type);
  const clusters = Array.isArray(program.career_clusters)
    ? program.career_clusters.map((cluster) => normalize(cluster))
    : [];

  const clusterText = clusters.join(" ");

  const majorTitleMatches = countMatches(profileTerms.majors, title);
  const majorClusterMatches = countMatches(profileTerms.majors, clusterText);

  const minorTitleMatches = countMatches(profileTerms.minors, title);
  const minorClusterMatches = countMatches(profileTerms.minors, clusterText);

  const skillTitleMatches = countMatches(profileTerms.skills, title);
  const skillClusterMatches = countMatches(profileTerms.skills, clusterText);
  const skillTypeMatches = countMatches(profileTerms.skills, type);

  let score = 0;

  score += majorTitleMatches * 25;
  score += majorClusterMatches * 20;

  score += minorTitleMatches * 14;
  score += minorClusterMatches * 10;

  score += skillTitleMatches * 8;
  score += skillClusterMatches * 6;
  score += skillTypeMatches * 3;

  if (level === "masters") {
    score += 2;
  }

  if (program.program_url) {
    score += 1;
  }

  const qualifies =
    majorTitleMatches > 0 ||
    majorClusterMatches > 0 ||
    minorTitleMatches > 0 ||
    minorClusterMatches > 0 ||
    skillTitleMatches > 0 ||
    skillClusterMatches > 0 ||
    skillTypeMatches > 0;

  return {
    ...program,
    score,
    qualifies,
    matchInfo: {
      majorTitleMatches,
      majorClusterMatches,
      minorTitleMatches,
      minorClusterMatches,
      skillTitleMatches,
      skillClusterMatches,
      skillTypeMatches
    }
  };
};

export const getTopEducationRecommendations = (
  programs,
  profile,
  limit = 3
) => {
  const profileTerms = getProfileEducationTerms(profile);

  const hasProfileTerms =
    profileTerms.majors.length > 0 ||
    profileTerms.minors.length > 0 ||
    profileTerms.skills.length > 0;

  if (!hasProfileTerms) return [];

  const scoredPrograms = (programs || [])
    .map((program) => scoreProgram(program, profileTerms))
    .filter((program) => program.qualifies)
    .sort((a, b) => b.score - a.score);

  const finalPrograms = [];
  const seenPrograms = new Set();

  for (const program of scoredPrograms) {
    const key = `${normalize(program.title)}-${normalize(program.program_level)}-${normalize(program.program_url)}`;

    if (!seenPrograms.has(key)) {
      seenPrograms.add(key);
      finalPrograms.push(program);
    }

    if (finalPrograms.length === limit) break;
  }

  return finalPrograms;
};