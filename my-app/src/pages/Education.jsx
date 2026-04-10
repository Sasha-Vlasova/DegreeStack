import React, { useState, useEffect } from "react";
import "./Education.css";
import { supabase } from "../supabase";

function Education() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [filters, setFilters] = useState({
    field_of_study: "",
    type: "",
    school: "",
    location: ""
  });

  const [results, setResults] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [fields, setFields] = useState([]);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // ---------------------------
  // INPUT HANDLERS
  // ---------------------------
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleClearFilters = () => {
    setFilters({
      field_of_study: "",
      type: "",
      school: "",
      location: ""
    });

    setSearchQuery("");
    setHasSearched(false);
    setResults([]);
  };

  // ---------------------------
  // SEARCH FUNCTION
  // ---------------------------
  const performSearch = async (queryText = "", overrideFilters = {}) => {
    setLoading(true);

    const effectiveFilters = { ...filters, ...overrideFilters };

    let query = supabase
      .from("programs")
      .select(`
        id,
        title,
        program_level,
        program_type,
        program_url,
        career_clusters,
        program_campuses!inner (
          campus_code,
          campuses (
            code,
            name,
            state
          )
        )
      `);

    // TEXT SEARCH
    if (queryText.trim() !== "") {
      const phrase = queryText.trim();
      query = query.textSearch("title,keywords", phrase, {
        type: "phrase"
      });
    }

    // FIELD
    if (effectiveFilters.field_of_study) {
      const field = effectiveFilters.field_of_study.trim();
      query = query.contains("career_clusters", JSON.stringify([field]));
    }

    // SCHOOL
    if (effectiveFilters.school) {
      query = query.eq("program_campuses.campus_code", effectiveFilters.school);
    }

    // TYPE
    if (effectiveFilters.type) {
      query = query.eq("program_level", effectiveFilters.type);
    }

    // LOCATION (STATE FILTER)
    if (effectiveFilters.location) {
      query = query.eq(
        "program_campuses.campuses.state",
        effectiveFilters.location
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching programs:", error);
      setLoading(false);
      return [];
    }

    setLoading(false);
    return data || [];
  };

  // ---------------------------
  // MAIN SEARCH
  // ---------------------------
  const handleSearch = async () => {
    setHasSearched(true);
    const data = await performSearch(searchQuery);
    setResults(data);
  };

  // ---------------------------
  // CAMPUSES
  // ---------------------------
  useEffect(() => {
    const fetchCampuses = async () => {
      const { data } = await supabase
        .from("campuses")
        .select("code, name")
        .order("name");

      setCampuses(data || []);
    };

    fetchCampuses();
  }, []);

  // ---------------------------
  // FIELDS
  // ---------------------------
  useEffect(() => {
    const fetchFields = async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("career_clusters");

      if (error) return;

      const all = data.flatMap((p) => p.career_clusters || []);
      const unique = [...new Set(all.map((c) => c.trim()))];

      setFields(unique);
    };

    fetchFields();
  }, []);

  // ---------------------------
  // AUTO SEARCH
  // ---------------------------
  useEffect(() => {
    const delay = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, filters]);

  // ---------------------------
  // USER
  // ---------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data } = await supabase
        .from("user_profiles")
        .select("major")
        .eq("user_id", user.id);

      setProfile(data?.[0]);
    };

    fetchUser();
  }, []);

  // ---------------------------
  // RECOMMENDED
  // ---------------------------
  useEffect(() => {
    const fetchRecommended = async () => {
      if (!profile?.major) return;

      const data = await performSearch(profile.major);

      const filtered = (data || []).filter((item) => {
        const matchType =
          !filters.type || item.program_level === filters.type;

        const matchSchool =
          !filters.school ||
          item.program_campuses?.some(
            (pc) => pc.campus_code === filters.school
          );

        const matchLocation =
          !filters.location ||
          item.program_campuses?.some(
            (pc) => pc.campuses?.state === filters.location
          );

        return matchType && matchSchool && matchLocation;
      });

      setRecommended(filtered.slice(0, 3));
    };

    fetchRecommended();
  }, [profile, filters]);

  return (
    <div className="education-page">
      <h1>Find Further Education Opportunities</h1>

      {/* ---------------- FILTERS ---------------- */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search for a program, or keyword..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <select
          name="field_of_study"
          value={filters.field_of_study}
          onChange={handleFilterChange}
        >
          <option value="">All Fields</option>
          {fields.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>

        <select name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Program Types</option>
          <option value="Masters">Masters</option>
          <option value="Doctorate">Doctorate</option>
          <option value="Certificate">Certificate</option>
          <option value="Post Bachelors">Post Bachelors</option>
          <option value="Education Specialist">
            Education Specialist
          </option>
        </select>

        <select
          name="school"
          value={filters.school}
          onChange={handleFilterChange}
        >
          <option value="">All Schools</option>
          {campuses.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
        >
          <option value="">All Locations</option>
          <option value="Wisconsin">Wisconsin</option>
        </select>

        <button onClick={handleClearFilters}>Clear Filters</button>
      </div>

      {/* ---------------- RECOMMENDED ---------------- */}
      {user && recommended.length > 0 && (
        <div className="recommended">
          <h2>Recommended for You</h2>

          {recommended.map((item) => (
            <div key={item.id} className="result-item">
              <h3>{item.title}</h3>

              <p>
                <strong>Level:</strong> {item.program_level}
              </p>

              <p>
                <strong>Campuses:</strong>{" "}
                {item.program_campuses
                  ?.map((pc) => pc.campuses?.name)
                  .filter(Boolean)
                  .join(", ")}
              </p>

              {item.program_type && (
                <p>
                  <strong>Type:</strong> {item.program_type}
                </p>
              )}

              {item.program_url && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={item.program_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="program-link"
                  >
                    Visit Program
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---------------- RESULTS ---------------- */}
      <div className="results">
        {loading ? (
          <p>Loading...</p>
        ) : !hasSearched ? (
          <p>Start searching to see results</p>
        ) : results.length === 0 ? (
          <p className="no-results">No results found :(</p>
        ) : (
          results.map((item) => (
            <div key={item.id} className="result-item">
              <h3>{item.title}</h3>

              <p>
                <strong>Level:</strong> {item.program_level}
              </p>

              <p>
                <strong>Campuses:</strong>{" "}
                {item.program_campuses
                  ?.map((pc) => pc.campuses?.name)
                  .filter(Boolean)
                  .join(", ")}
              </p>

              {item.program_type && (
                <p>
                  <strong>Type:</strong> {item.program_type}
                </p>
              )}

              {item.program_url && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={item.program_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="program-link"
                  >
                    Visit Program
                  </a>
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Education;