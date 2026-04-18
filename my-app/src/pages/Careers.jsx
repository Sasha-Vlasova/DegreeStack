import React, { useState, useEffect } from "react";
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
    title: "",
    location: "",
    type: ""
  });

  const [results, setResults] = useState([]);
  const [recommended, setRecommended] = useState([]);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const mockJobs = [
    {
      id: 1,
      title: "Software Engineer",
      company: "Tech Corp",
      location: "Wisconsin",
      type: "Full-time",
      skills: ["JavaScript", "React"]
    },
    {
      id: 2,
      title: "Data Analyst",
      company: "Data Inc",
      location: "Minnesota",
      type: "Internship",
      skills: ["SQL", "Python"]
    },
    {
      id: 3,
      title: "Backend Developer",
      company: "Cloud Systems",
      location: "Wisconsin",
      type: "Full-time",
      skills: ["Node.js", "Databases"]
    }
  ];

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleClearFilters = () => {
    setFilters({
      title: "",
      location: "",
      type: ""
    });
    setSearchQuery("");
  };

  const performSearch = async (queryText = "") => {
    setLoading(true);

    let data = mockJobs;

    const filtered = data.filter((job) => {
      const matchQuery =
        !queryText ||
        job.title.toLowerCase().includes(queryText.toLowerCase());

      const matchLocation =
        !filters.location || job.location === filters.location;

      const matchType =
        !filters.type || job.type === filters.type;

      return matchQuery && matchLocation && matchType;
    });

    setLoading(false);
    return filtered;
  };

  const handleSearch = async () => {
    const data = await performSearch(searchQuery);
    setResults(data);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, filters]);

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

    const matches = mockJobs.filter((job) =>
      job.skills.some((skill) =>
        skills.includes(skill.toLowerCase())
      )
    );

    setRecommended(matches.slice(0, 3));
  }, [profile]);

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
          <option value="Full-time">Full-time</option>
          <option value="Internship">Internship</option>
        </select>

        <button onClick={handleClearFilters}>Clear Filters</button>
      </div>

      {user && recommended.length > 0 && (
        <div className="recommended">
          <h2>Recommended for You</h2>

          {recommended.map((job) => (
            <div key={job.id} className="career-item">
              <h3>{job.title}</h3>
              <p><strong>Company:</strong> {job.company}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Type:</strong> {job.type}</p>
            </div>
          ))}
        </div>
      )}

      <div className="results">
        {loading ? (
          <p>Loading...</p>
        ) : results.length === 0 ? (
          <p>No jobs found :(</p>
        ) : (
          results.map((job) => (
            <div key={job.id} className="career-item">
              <h3>{job.title}</h3>
              <p><strong>Company:</strong> {job.company}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Type:</strong> {job.type}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Careers;