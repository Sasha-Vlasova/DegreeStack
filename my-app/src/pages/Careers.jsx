import React, { useState, useEffect, useRef } from "react";
import "./Careers.css";
import { supabase } from "../supabase";
import { useLocation } from "react-router-dom";

function Careers() {
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState(
    location.state?.searchQuery || ""
  );

  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    location: "",
    type: ""
  });

  const [results, setResults] = useState([]);
  const [recommended, setRecommended] = useState([]);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const observerRef = useRef();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
    setResults([]);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
    setPage(1);
    setResults([]);
  };

  const handleClearFilters = () => {
    setFilters({
      location: "",
      type: ""
    });
    setSearchQuery("");
    setPage(1);
    setResults([]);
  };

  const performSearch = async () => {
    setLoading(true);

    let query = supabase
      .from("careers")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    if (filters.location) {
      query = query.eq("state_source", filters.location);
    }

    if (filters.type) {
      query = query.eq("job_type", filters.type);
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
    setHasMore(jobs.length === pageSize);
    setLoading(false);
  };

  useEffect(() => {
    performSearch();
  }, [page, searchQuery, filters]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data } = await supabase
        .from("user_profiles")
        .select("skills")
        .eq("user_id", user.id);

      setProfile(data?.[0]);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!profile || !profile.skills) return;

    const skills = profile.skills
      .split(",")
      .map((s) => s.trim().toLowerCase());

    const fetchRecommended = async () => {
      let query = supabase.from("careers").select("*");

      for (const skill of skills) {
        query = query.or(`description.ilike.%${skill}%`);
      }

      const { data } = await query.limit(10);

      setRecommended((data || []).slice(0, 3));
    };

    fetchRecommended();
  }, [profile]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

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

        <select
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
        >
          <option value="">All Locations</option>
          <option value="Wisconsin">Wisconsin</option>
          <option value="Minnesota">Minnesota</option>
        </select>

        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">All Types</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Internship">Internship</option>
        </select>

        <button onClick={handleClearFilters}>Clear Filters</button>
      </div>

      <p className="results-count">
        Showing {start}-{end} of {totalCount} jobs
      </p>

      {user && recommended.length > 0 && (
        <div className="recommended">
          <h2>Recommended for You</h2>

          {recommended.map((job) => (
            <div key={job.id} className="career-item">
              <h3>{job.title}</h3>
              <p><strong>Company:</strong> {job.company_name}</p>
              <p><strong>Location:</strong> {job.location_city}, {job.state_source}</p>
              <p><strong>Type:</strong> {job.job_type}</p>

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
            <p><strong>Type:</strong> {job.job_type}</p>

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