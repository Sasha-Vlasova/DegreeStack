import React, { useEffect, useRef, useState } from "react";
import "./Careers.css";
import { supabase } from "../supabase";
import { useLocation } from "react-router-dom";
import { getTopCareerRecommendations } from "../utils/careerRecommendations";

function Careers() {
  const location = useLocation();

  const [recommendedMode, setRecommendedMode] = useState(
    location.state?.recommendedMode || false
  );

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

  const unique = (arr) => [...new Set(arr.filter(Boolean))];

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

  const applyCareerFilters = (query) => {
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

    return query;
  };

  const fetchResults = async () => {
    setLoading(true);

    if (recommendedMode && profile) {
      let query = supabase
        .from("careers")
        .select("*")
        .order("created", { ascending: false })
        .limit(20000);

      query = applyCareerFilters(query);

      const { data, error } = await query;

      if (error || !data) {
        setResults([]);
        setTotalCount(0);
        setHasMore(false);
        setLoading(false);
        return;
      }

      const recommendedJobs = getTopCareerRecommendations(data, profile, 50);

      setResults(recommendedJobs);
      setTotalCount(recommendedJobs.length);
      setHasMore(false);
      setLoading(false);
      return;
    }

    let query = supabase.from("careers").select("*", { count: "exact" });

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    query = applyCareerFilters(query);

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
    if (!profile) {
      setRecommended([]);
      return;
    }

    let query = supabase
      .from("careers")
      .select("*")
      .order("created", { ascending: false })
      .limit(20000);

    query = applyCareerFilters(query);

    const { data, error } = await query;

    if (error || !data) {
      setRecommended([]);
      return;
    }

    setRecommended(getTopCareerRecommendations(data, profile, 3));
  };

  useEffect(() => {
    fetchResults();
  }, [page, searchQuery, filters, profile, recommendedMode]);

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
      const values = await fetchDistinctValues(
        "location_city",
        filters.location
      );
      setCities(values);
    };

    loadCities();
  }, [filters.location]);

  useEffect(() => {
    fetchRecommended();
  }, [profile, filters]);

  useEffect(() => {
    if (recommendedMode) return;
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
  }, [hasMore, loading, recommendedMode]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setRecommendedMode(false);
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
    setRecommendedMode(false);
    setPage(1);
    setResults([]);
  };

  const showRecommendedMode = () => {
    setRecommendedMode(true);
    setSearchQuery("");
    setPage(1);
    setResults([]);
  };

  const showAllJobs = () => {
    setRecommendedMode(false);
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

        {user && !recommendedMode && (
          <button onClick={showRecommendedMode}>Recommended Jobs</button>
        )}

        {recommendedMode && (
          <button onClick={showAllJobs}>Show All Jobs</button>
        )}
      </div>

      <p className="results-count">
        {recommendedMode
          ? `Showing ${end} recommended jobs`
          : `Showing ${start}-${end} of ${totalCount} jobs`}
      </p>

      {recommendedMode && (
        <div className="recommended-mode-banner">
          <h2>Recommended Careers For You</h2>
          <p>These jobs are ranked using your majors, minors, and skills.</p>
        </div>
      )}

      {!recommendedMode && user && recommended.length > 0 && (
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