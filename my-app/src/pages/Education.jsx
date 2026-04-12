import React, { useState, useEffect } from "react";
import "./Education.css";
import { supabase } from "../supabase";
import { searchPrograms } from "../utils/programSearch";
import { useLocation } from "react-router-dom";

function Education() {
  const location = useLocation();

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

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

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
  };

  const performSearch = async (queryText = "") => {
    setLoading(true);

    const data = await searchPrograms(queryText, filters);

    const filtered = (data || []).filter((item) => {
      const matchLocation =
        !filters.location ||
        item.state_source === filters.location;

      const matchField =
        !filters.field_of_study ||
        (item.career_clusters || []).includes(filters.field_of_study);

      return matchLocation && matchField;
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
      const unique = [...new Set(all.map((c) => c.trim()))];

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
        .eq("user_id", user.id);

      setProfile(data?.[0]);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchRecommended = async () => {
      if (!profile) return;

      let data = [];

      if (profile.major) {
        data = await performSearch(profile.major);
      }

      if ((!data || data.length === 0) && profile.minors) {
        data = await performSearch(profile.minors);
      }

      if ((!data || data.length === 0) && profile.skills) {
        const firstSkill = profile.skills.split(",")[0].trim();
        if (firstSkill) {
          data = await performSearch(firstSkill);
        }
      }

      setRecommended((data || []).slice(0, 3));
    };

    fetchRecommended();
  }, [profile, filters]);

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
          <option value="Minnesota">Minnesota</option>
        </select>

        <button onClick={handleClearFilters}>Clear Filters</button>
      </div>

      {user && recommended.length > 0 && (
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