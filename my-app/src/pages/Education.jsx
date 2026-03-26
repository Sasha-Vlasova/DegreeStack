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
  const [campuses, setCampuses] = useState([]);
  const [fields, setFields] = useState([]);
  // Handle typing in search box
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle dropdown changes
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  // Main search function
  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

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
            name
          )
        )
      `)

    if (searchQuery.trim() !== "") {
      const phrase = `"${searchQuery.trim()}"`;
      query = query.textSearch('title,keywords', phrase);
    }

    if (filters.school) {
      query = query.filter("program_campuses.campus_code", "eq", filters.school);
    }

    if (filters.field_of_study) {
      query = query.contains("career_clusters", [filters.field_of_study]);
    }

    if (filters.type) {
      query = query.eq("program_level", filters.type);
    }



    const { data, error } = await query;
    console.log("RAW DATA:", data);

    if (error) {
      console.error("Error fetching programs:", error);
    } else {
      console.log("RESULTS:", data); // helpful for debugging
      setResults(data);
    }

    setLoading(false);
  };
  useEffect(() => {
    const fetchCampuses = async () => {
      const { data, error } = await supabase
        .from("campuses")
        .select("code, name")
        .order("name");

      if (error) {
        console.error("Error fetching campuses:", error);
      } else {
        setCampuses(data);
      }
    };

    fetchCampuses();
  }, []);

  useEffect(() => {
  const fetchFields = async () => {
    const { data, error } = await supabase
      .from("programs")
      .select("career_clusters");

    if (error) {
      console.error("Error fetching fields:", error);
      return;
    }

    // Flatten + remove duplicates
    const allClusters = data
      .flatMap((p) => p.career_clusters || []);

    const uniqueClusters = [...new Set(allClusters)];

    setFields(uniqueClusters);
  };

  fetchFields();
  }, []);

  // Auto-run search when filters or query change
  useEffect(() => {
  const delaySearch = setTimeout(() => {
    handleSearch();
  }, 300);

  return () => clearTimeout(delaySearch);
  }, [searchQuery, filters]);

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

          {campuses.map((campus) => (
            <option key={campus.code} value={campus.code}>
              {campus.name}
            </option>
          ))}
        </select>

        <select
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
        >
          <option value="">All Locations</option>
          <option value="wisconsin">Wisconsin</option>
        </select>

        {/* Optional now, since auto-search exists */}
        <button onClick={handleSearch}>Refresh</button>
      </div>

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