import React, { useEffect, useRef, useState } from "react";
import "./Careers.css";
import { supabase } from "../supabase";
import { useLocation } from "react-router-dom";

function Careers() {
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState(
    location.state?.searchQuery || ""
  );

  const [filters, setFilters] = useState({
    location: "",
    city: "",
    type: "",
    cluster: "",
    minSalary: ""
  });

  const [results, setResults] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [cities, setCities] = useState([]);
  const [clusters, setClusters] = useState([]);

  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);
  const pageSize = 50;

  const salaryOptions = [
    { label: "Any Salary", value: "" },
    { label: "$10,000+", value: "10000" },
    { label: "$20,000+", value: "20000" },
    { label: "$30,000+", value: "30000" },
    { label: "$40,000+", value: "40000" },
    { label: "$50,000+", value: "50000" },
    { label: "$60,000+", value: "60000" },
    { label: "$70,000+", value: "70000" },
    { label: "$80,000+", value: "80000" },
    { label: "$90,000+", value: "90000" },
    { label: "$100,000+", value: "100000" },
    { label: "$125,000+", value: "125000" },
    { label: "$150,000+", value: "150000" }
  ];

  const normalize = (value) => (value || "").toString().toLowerCase().trim();

  const toArray = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.map((item) => normalize(item)).filter(Boolean);
    }

    return value
      .split(",")
      .map((item) => normalize(item))
      .filter(Boolean);
  };

  const parseJobSkills = (value) => {
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

  const unique = (arr) => [...new Set(arr.filter(Boolean))];

  const getProfileTerms = () => {
    if (!profile) return [];

    const majors = toArray(profile.major);
    const minors = toArray(profile.minors);
    const skills = toArray(profile.skills);

    return unique([...majors, ...minors, ...skills]);
  };

  const countMatches = (terms, text) => {
    let count = 0;

    for (const term of terms) {
      if (term && text.includes(term)) {
        count += 1;
      }
    }

    return count;
  };

  const scoreJob = (job, profileTerms) => {
    const title = normalize(job.title);
    const category = normalize(job.category);
    const description = normalize(job.description);
    const cluster = normalize(job.career_cluster);
    const jobSkills = parseJobSkills(job.skills);

    const titleMatches = countMatches(profileTerms, title);
    const categoryMatches = countMatches(profileTerms, category);
    const descriptionMatches = countMatches(profileTerms, description);
    const skillMatches = profileTerms.filter((term) => jobSkills.includes(term)).length;
    const clusterMatches = countMatches(profileTerms, cluster);

    let score = 0;

    score += titleMatches * 15;
    score += skillMatches * 18;
    score += categoryMatches * 8;
    score += descriptionMatches * 2;
    score += clusterMatches * 3;

    if (job.job_type === "Internship" && title.includes("intern")) {
      score += 3;
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
      categoryMatches > 0 ||
      (categoryMatches >= 1 && descriptionMatches >= 1);

    return {
      ...job,
      score,
      qualifies
    };
  };

  const fetchDistinctValues = async (column, state = "") => {
    const batchSize = 1000;
    let from = 0;
    let keepGoing = true;
    const allRows = [];

    while (keepGoing) {
      let query = supabase
        .from("careers")
        .select(column)
        .not(column, "is", null)
        .range(from, from + batchSize - 1);

      if (column === "location_city") {
        query = query.neq("location_city", "");
      }

      if (state) {
        query = query.eq("state_source", state);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        keepGoing = false;
      } else {
        allRows.push(...data);
        from += batchSize;

        if (data.length < batchSize) {
          keepGoing = false;
        }
      }
    }

    return unique(allRows.map((row) => row[column])).sort();
  };

  const fetchResults = async () => {
    setLoading(true);

    let query = supabase.from("careers").select("*", { count: "exact" });

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    if (filters.location) {
      query = query.eq("state_source", filters.location);
    }

    if (filters.city) {
      query = query.eq("location_city", filters.city);
    }

    if (filters.type) {
      query = query.eq("job_type", filters.type);
    }

    if (filters.cluster) {
      query = query.eq("career_cluster", filters.cluster);
    }

    if (filters.minSalary) {
      query = query.gte("salary_min", Number(filters.minSalary));
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await query
      .order("created", { ascending: false })
      .range(from, to);

    const jobs = data || [];

    if (page === 1) {
      setResults(jobs);
    } else {
      setResults((prev) => [...prev, ...jobs]);
    }

    setTotalCount(count || 0);
    setHasMore(to < (count || 0) - 1);
    setLoading(false);
  };

  const fetchRecommended = async () => {
    const profileTerms = getProfileTerms();

    if (profileTerms.length === 0) {
      setRecommended([]);
      return;
    }

    let query = supabase
      .from("careers")
      .select("*")
      .order("created", { ascending: false })
      .limit(1500);

    if (filters.location) {
      query = query.eq("state_source", filters.location);
    }

    if (filters.city) {
      query = query.eq("location_city", filters.city);
    }

    if (filters.type) {
      query = query.eq("job_type", filters.type);
    }

    if (filters.cluster) {
      query = query.eq("career_cluster", filters.cluster);
    }

    if (filters.minSalary) {
      query = query.gte("salary_min", Number(filters.minSalary));
    }

    const { data, error } = await query;

    if (error || !data) {
      setRecommended([]);
      return;
    }

    const scoredJobs = data
      .map((job) => scoreJob(job, profileTerms))
      .filter((job) => job.qualifies)
      .sort((a, b) => b.score - a.score);

    const finalJobs = [];
    const seenTitles = new Set();

    for (const job of scoredJobs) {
      const key = normalize(job.title);

      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        finalJobs.push(job);
      }

      if (finalJobs.length === 3) break;
    }

    setRecommended(finalJobs);
  };

  useEffect(() => {
    fetchResults();
  }, [page, searchQuery, filters]);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data } = await supabase
        .from("user_profiles")
        .select("major, minors, skills")
        .eq("user_id", user.id)
        .single();

      setProfile(data || null);
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadClusters = async () => {
      const values = await fetchDistinctValues("career_cluster");
      setClusters(values);
    };

    loadClusters();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      const values = await fetchDistinctValues("location_city", filters.location);
      setCities(values);
    };

    loadCities();
  }, [filters.location]);

  useEffect(() => {
    fetchRecommended();
  }, [profile, filters]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const currentRef = observerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0.1
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, [hasMore, loading]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
    setResults([]);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "location") {
        updated.city = "";
      }

      return updated;
    });

    setPage(1);
    setResults([]);
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      city: "",
      type: "",
      cluster: "",
      minSalary: ""
    });
    setSearchQuery("");
    setPage(1);
    setResults([]);
  };

  const start = results.length === 0 ? 0 : 1;
  const end = results.length;

  return (
    <div className="careers-page">
      <h1>Explore Careers</h1>

      <div className="search-filters">
        <input
          type="text"
          placeholder="Search for jobs..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <select name="location" value={filters.location} onChange={handleFilterChange}>
          <option value="">All States</option>
          <option value="Wisconsin">Wisconsin</option>
          <option value="Minnesota">Minnesota</option>
        </select>

        <select name="city" value={filters.city} onChange={handleFilterChange}>
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select name="cluster" value={filters.cluster} onChange={handleFilterChange}>
          <option value="">All Career Clusters</option>
          {clusters.map((cluster) => (
            <option key={cluster} value={cluster}>
              {cluster}
            </option>
          ))}
        </select>

        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Internship">Internship</option>
        </select>

        <select
          name="minSalary"
          value={filters.minSalary}
          onChange={handleFilterChange}
        >
          {salaryOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button onClick={clearFilters}>Clear Filters</button>
      </div>

      <p className="results-count">
        Showing {start}-{end} of {totalCount} jobs
      </p>

      {user && recommended.length > 0 && (
        <div className="recommended">
          <h2>Careers You May Be Interested In</h2>

          {recommended.map((job) => (
            <div key={job.id} className="career-item">
              <h3>{job.title}</h3>
              <p><strong>Company:</strong> {job.company_name}</p>
              <p><strong>Location:</strong> {job.location_city}, {job.state_source}</p>
              <p><strong>Cluster:</strong> {job.career_cluster || "Other"}</p>
              <p><strong>Type:</strong> {job.job_type}</p>

              {job.salary_min !== null && job.salary_min !== undefined && (
                <p>
                  <strong>Min Salary:</strong>{" "}
                  {Number(job.salary_min) > 0
                    ? `$${Number(job.salary_min).toLocaleString()}`
                    : "Not Listed"}
                </p>
              )}

              {job.job_url && (
                <p>
                  <strong>View Job:</strong>{" "}
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="career-link"
                  >
                    Apply
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="results">
        {!loading && results.length === 0 && (
          <p className="no-results">No Results Found :(</p>
        )}

        {results.map((job) => (
          <div key={job.id} className="career-item">
            <h3>{job.title}</h3>
            <p><strong>Company:</strong> {job.company_name}</p>
            <p><strong>Location:</strong> {job.location_city}, {job.state_source}</p>
            <p><strong>Cluster:</strong> {job.career_cluster || "Other"}</p>
            <p><strong>Type:</strong> {job.job_type}</p>

            {job.salary_min !== null && job.salary_min !== undefined && (
              <p>
                <strong>Min Salary:</strong>{" "}
                {Number(job.salary_min) > 0
                  ? `$${Number(job.salary_min).toLocaleString()}`
                  : "Not Listed"}
              </p>
            )}

            {job.job_url && (
              <p>
                <strong>View Job:</strong>{" "}
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="career-link"
                >
                  Apply
                </a>
              </p>
            )}
          </div>
        ))}

        {loading && <p>Loading more jobs...</p>}

        <div ref={observerRef} style={{ height: "20px" }} />
      </div>
    </div>
  );
}

export default Careers;