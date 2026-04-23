import React, { useState, useEffect } from "react";
import "./Education.css";
import { supabase } from "../supabase";
import { searchPrograms } from "../utils/programSearch";
import { getTopEducationRecommendations } from "../utils/educationRecommendations";
import { useLocation } from "react-router-dom";

function Education() {
  const location = useLocation();

  const [recommendedMode, setRecommendedMode] = useState(
    location.state?.recommendedMode || false
  );

  const [searchQuery, setSearchQuery] = useState(
    location.state?.searchQuery || ""
  );

  const [loading, setLoading] = useState(false);

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setRecommendedMode(false);
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
    setRecommendedMode(false);
  };

  const filterPrograms = (data) => {
    return (data || []).filter((item) => {
      const matchLocation =
        !filters.location || item.state_source === filters.location;

      const matchField =
        !filters.field_of_study ||
        (item.career_clusters || []).includes(filters.field_of_study);

      return matchLocation && matchField;
    });
  };

  const performSearch = async (queryText = "") => {
    setLoading(true);

    const data = await searchPrograms(queryText, filters);
    const filtered = filterPrograms(data);

    setLoading(false);
    return filtered;
  };

  const handleSearch = async () => {
    if (recommendedMode && profile) {
      setLoading(true);

      const data = await searchPrograms("", filters);
      const filtered = filterPrograms(data);
      const topPrograms = getTopEducationRecommendations(filtered, profile, 50);

      setResults(topPrograms);
      setLoading(false);
      return;
    }

    const data = await performSearch(searchQuery);
    setResults(data);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery, filters, recommendedMode, profile]);

  useEffect(() => {
    const fetchCampuses = async () => {
      let query = supabase
        .from("campuses")
        .select("code, name, state")
        .order("name");

      if (filters.location) {
        query = query.eq("state", filters.location);
      }

      const { data } = await query;
      setCampuses(data || []);
    };

    fetchCampuses();
  }, [filters.location]);

  useEffect(() => {
    const fetchFields = async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("career_clusters");

      if (error) return;

      const all = (data || []).flatMap((p) => p.career_clusters || []);
      const unique = [...new Set(all.map((c) => c.trim()))].sort();

      setFields(unique);
    };

    fetchFields();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
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

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchRecommended = async () => {
      if (!profile) {
        setRecommended([]);
        return;
      }

      const data = await searchPrograms("", filters);
      const filtered = filterPrograms(data);
      const topPrograms = getTopEducationRecommendations(filtered, profile, 3);

      setRecommended(topPrograms);
    };

    fetchRecommended();
  }, [profile, filters]);

  const showRecommendedMode = () => {
    setRecommendedMode(true);
    setSearchQuery("");
  };

  const showAllPrograms = () => {
    setRecommendedMode(false);
    setSearchQuery("");
  };

  const renderCampuses = (item) => {
    const names = item.program_campuses
      ?.map((pc) => pc.campuses?.name)
      .filter((v) => v && v.trim() !== "");

    if (!names || names.length === 0) return null;

    return names.join(", ");
  };

  return (
    <div className="education-page">
      <h1>Find Further Education Opportunities</h1>

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

        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">All Program Types</option>
          <option value="Masters">Masters</option>
          <option value="Doctorate">Doctorate</option>
          <option value="Certificate">Certificate</option>
          <option value="Post Bachelors">Post Bachelors</option>
          <option value="Education Specialist">Education Specialist</option>
        </select>

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

        <button onClick={handleClearFilters}>Clear Filters</button>

        {user && !recommendedMode && (
          <button onClick={showRecommendedMode}>Recommended Programs</button>
        )}

        {recommendedMode && (
          <button onClick={showAllPrograms}>Show All Programs</button>
        )}
      </div>

      {recommendedMode && (
        <div className="recommended-mode-banner">
          <h2>Recommended Education For You</h2>
          <p>These programs are ranked using your majors, minors, and skills.</p>
        </div>
      )}

      {!recommendedMode && user && recommended.length > 0 && (
        <div className="recommended">
          <h2>Recommended for You</h2>

          {recommended.map((item) => (
            <div key={item.id} className="education-result-item">
              <h3>{item.title}</h3>

              <p><strong>Level:</strong> {item.program_level}</p>

              {renderCampuses(item) && (
                <p>
                  <strong>Campuses:</strong> {renderCampuses(item)}
                </p>
              )}

              {item.program_type && (
                <p><strong>Type:</strong> {item.program_type}</p>
              )}

              {item.program_url && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={item.program_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Program
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="results">
        {loading ? (
          <p>Loading...</p>
        ) : results.length === 0 ? (
          <p className="no-results">No results found :(</p>
        ) : (
          results.map((item) => (
            <div key={item.id} className="education-result-item">
              <h3>{item.title}</h3>

              <p><strong>Level:</strong> {item.program_level}</p>

              {renderCampuses(item) && (
                <p>
                  <strong>Campuses:</strong> {renderCampuses(item)}
                </p>
              )}

              {item.program_type && (
                <p><strong>Type:</strong> {item.program_type}</p>
              )}

              {item.program_url && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={item.program_url}
                    target="_blank"
                    rel="noopener noreferrer"
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