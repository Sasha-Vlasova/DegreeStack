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

export const parseJobSkills = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalize(item)).filter(Boolean);
      }
    } catch {}

    return value
      .split(",")
      .map((item) => normalize(item.replace(/[\[\]"]/g, "")))
      .filter(Boolean);
  }

  return [];
};

export const unique = (arr) => [...new Set(arr.filter(Boolean))];

export const getProfileTerms = (profile) => {
  if (!profile) return [];

  const majors = toArray(profile.major);
  const minors = toArray(profile.minors);
  const skills = toArray(profile.skills);

  return unique([...majors, ...minors, ...skills]);
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

export const scoreCareer = (job, profileTerms) => {
  const title = normalize(job.title);
  const category = normalize(job.category);
  const description = normalize(job.description);
  const cluster = normalize(job.career_cluster);
  const jobSkills = parseJobSkills(job.skills);

  const titleMatches = countMatches(profileTerms, title);
  const categoryMatches = countMatches(profileTerms, category);
  const descriptionMatches = countMatches(profileTerms, description);
  const skillMatches = profileTerms.filter((term) =>
    jobSkills.includes(term)
  ).length;
  const clusterMatches = countMatches(profileTerms, cluster);

  let score = 0;

  score += titleMatches * 20;
  score += skillMatches * 18;
  score += categoryMatches * 8;
  score += clusterMatches * 6;
  score += descriptionMatches * 1;

  if (job.job_type === "Internship" && title.includes("intern")) {
    score += 4;
  }

  if (job.salary_min && Number(job.salary_min) > 0) {
    score += 1;
  }

  if (job.job_url) {
    score += 1;
  }

  const qualifies =
    titleMatches > 0 ||
    skillMatches > 0 ||
    clusterMatches > 0 ||
    categoryMatches > 0 ||
    descriptionMatches >= 2;

  return {
    ...job,
    score,
    qualifies,
    matchInfo: {
      titleMatches,
      skillMatches,
      categoryMatches,
      clusterMatches,
      descriptionMatches
    }
  };
};

export const getTopCareerRecommendations = (jobs, profile, limit = 3) => {
  const profileTerms = getProfileTerms(profile);

  if (profileTerms.length === 0) return [];

  const scoredJobs = jobs
    .map((job) => scoreCareer(job, profileTerms))
    .filter((job) => job.qualifies)
    .sort((a, b) => b.score - a.score);

  const finalJobs = [];
  const seenJobs = new Set();

  for (const job of scoredJobs) {
    const jobKey = `${normalize(job.title)}-${normalize(job.company_name)}-${normalize(job.job_url)}`;

    if (!seenJobs.has(jobKey)) {
      seenJobs.add(jobKey);
      finalJobs.push(job);
    }

    if (finalJobs.length === limit) break;
  }

  return finalJobs;
};